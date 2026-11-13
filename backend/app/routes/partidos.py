import hashlib
import logging
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.config import settings
from app.database import equipos_col, format_mongo_doc, partidos_col
from app.models import MatchUpdate, PartidoCreate
from app.security import get_current_user

router = APIRouter(prefix="/api/partidos", tags=["Partidos"])
IDEMPOTENCY_FIELDS = {"idempotencyKey", "idempotencyPayloadHash"}
logger = logging.getLogger(__name__)


def _format_public_match(partido: dict) -> dict:
    public_partido = {
        key: value for key, value in partido.items() if key not in IDEMPOTENCY_FIELDS
    }
    return format_mongo_doc(public_partido)


def _partido_datetime(fecha: str, hora: str) -> datetime:
    return datetime.combine(
        date.fromisoformat(fecha),
        time.fromisoformat(hora),
    )


def _horarios_solapan(
    f1: str, h1: str, d1: int,
    f2: str, h2: str, d2: int,
    margen_min: int = 15,
) -> bool:
    inicio1 = _partido_datetime(f1, h1)
    fin1 = inicio1 + timedelta(minutes=d1)
    inicio2 = _partido_datetime(f2, h2)
    fin2 = inicio2 + timedelta(minutes=d2)
    inicio1_m = inicio1 - timedelta(minutes=margen_min)
    fin1_m = fin1 + timedelta(minutes=margen_min)
    inicio2_m = inicio2 - timedelta(minutes=margen_min)
    fin2_m = fin2 + timedelta(minutes=margen_min)
    return inicio1_m < fin2_m and inicio2_m < fin1_m


def _get_existing_idempotent_match(partido: dict, payload_hash: str) -> dict:
    if partido.get("idempotencyPayloadHash") != payload_hash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This idempotency key was already used for a different match",
        )
    return _format_public_match(partido)


@router.get("/")
async def listar_partidos(
    email: Optional[str] = None,
    solo_activos: bool = True,
    current_user: dict = Depends(get_current_user),
):
    filtro = {"activo": {"$ne": False}} if solo_activos else {}
    if email:
        if email.strip().lower() != current_user["email"]:
            raise HTTPException(status_code=403, detail="No puedes consultar el historial de otro usuario")
        filtro["$or"] = [
            {"creadorEmail": current_user["email"]},
            {"jugadoresInscritos": current_user["email"]},
        ]

    partidos = []
    async for partido in partidos_col.find(filtro).sort("_id", -1):
        partidos.append(_format_public_match(partido))
    return partidos


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_partido(
    partido: PartidoCreate,
    current_user: dict = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(
        default=None,
        alias="Idempotency-Key",
        min_length=1,
        max_length=100,
    ),
):
    if not ObjectId.is_valid(partido.equipoId):
        raise HTTPException(status_code=400, detail="ID de equipo inválido")

    payload_hash = hashlib.sha256(partido.model_dump_json().encode()).hexdigest()
    if idempotency_key is not None:
        idempotency_key = idempotency_key.strip()
        if not idempotency_key:
            raise HTTPException(status_code=400, detail="Idempotency-Key cannot be empty")

        existing = await partidos_col.find_one({
            "creadorEmail": current_user["email"],
            "idempotencyKey": idempotency_key,
        })
        if existing:
            logger.info(
                "match.create.idempotent_replay",
                extra={
                    "event": "match.create.idempotent_replay",
                    "entity_type": "match",
                    "entity_id": str(existing["_id"]),
                },
            )
            return _get_existing_idempotent_match(existing, payload_hash)

    equipo = await equipos_col.find_one({
        "_id": ObjectId(partido.equipoId),
        "creadorEmail": current_user["email"],
    })
    if not equipo:
        raise HTTPException(status_code=403, detail="No puedes organizar con un equipo que no te pertenece")

    partido_data = partido.model_dump()
    partido_data["scheduledAt"] = datetime.combine(
        date.fromisoformat(partido.fecha),
        time.fromisoformat(partido.hora),
        tzinfo=timezone(timedelta(minutes=-partido.timezoneOffsetMinutes)),
    ).astimezone(timezone.utc)
    partido_data.update({
        "equipo": equipo["nombre"],
        "creadorEmail": current_user["email"],
        "creadorNombre": current_user.get("nombre") or current_user["email"],
        "jugadoresInscritos": [current_user["email"]],
        "estado": "BUSCANDO RIVAL" if partido.tipo == "RIVAL" else "BUSCANDO JUGADORES",
        "activo": True,
        "rival": None,
        "duracion_minutos": partido.duracion_minutos,
    })
    # --- Regla: misma cancha no puede tener dos partidos que se crucen ---
    async for existente in partidos_col.find({
        "recinto": partido.recinto,
        "estado": {"$ne": "CANCELADO"},
        "fecha": partido.fecha,
    }):
        if _horarios_solapan(
            partido.fecha, partido.hora, partido.duracion_minutos,
            existente["fecha"], existente["hora"],
            existente.get("duracion_minutos", 60),
        ):
            logger.warning(
                "match.create.overlap_conflict",
                extra={
                    "event": "match.create.overlap_conflict",
                    "entity_type": "match",
                    "entity_id": str(existente.get("_id", "")),
                },
            )
            raise HTTPException(
                status_code=409,
                detail="Ya existe un partido en este recinto que se cruza en horario",
            )
    if idempotency_key is not None:
        partido_data["idempotencyKey"] = idempotency_key
        partido_data["idempotencyPayloadHash"] = payload_hash
    try:
        result = await partidos_col.insert_one(partido_data)
    except DuplicateKeyError as exc:
        if idempotency_key is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not save the match",
            ) from exc

        existing = await partidos_col.find_one({
            "creadorEmail": current_user["email"],
            "idempotencyKey": idempotency_key,
        })
        if not existing:
            logger.exception(
                "match.create.idempotency_conflict_unresolved",
                extra={"event": "match.create.idempotency_conflict_unresolved"},
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not confirm whether the match was saved",
            ) from exc
        return _get_existing_idempotent_match(existing, payload_hash)
    except PyMongoError as exc:
        logger.exception(
            "match.create.database_error",
            extra={"event": "match.create.database_error"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not save the match",
        ) from exc

    logger.info(
        "match.created",
        extra={
            "event": "match.created",
            "entity_type": "match",
            "entity_id": str(result.inserted_id),
        },
    )
    return _format_public_match({"_id": result.inserted_id, **partido_data})


@router.patch("/{partido_id}/cancelar")
async def cancelar_partido(partido_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(partido_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")

    partido = await partidos_col.find_one({"_id": ObjectId(partido_id)})
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    is_admin = (
        current_user.get("rol") == "admin"
        or current_user["email"] in settings.configured_admin_emails
    )
    if partido.get("creadorEmail") != current_user["email"] and not is_admin:
        raise HTTPException(status_code=403, detail="No tienes permiso para cancelar este partido")

    try:
        await partidos_col.update_one(
            {"_id": ObjectId(partido_id), "activo": {"$ne": False}},
            {"$set": {"activo": False, "estado": "CANCELADO"}},
        )
    except PyMongoError as exc:
        logger.exception(
            "match.cancel.database_error",
            extra={"event": "match.cancel.database_error", "entity_type": "match"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo cancelar el partido. Intenta nuevamente.",
        ) from exc
    logger.info(
        "match.cancelled",
        extra={
            "event": "match.cancelled",
            "entity_type": "match",
            "entity_id": partido_id,
        },
    )
    return {"msg": "Partido cancelado"}


@router.patch("/{partido_id}")
async def actualizar_partido(
    partido_id: str,
    data: MatchUpdate,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(partido_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")

    object_id = ObjectId(partido_id)
    partido = await partidos_col.find_one({"_id": object_id})
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    if partido.get("activo") is False:
        raise HTTPException(status_code=409, detail="El partido está cancelado")
    if partido.get("estado") == "PARTIDO LISTO":
        raise HTTPException(status_code=409, detail="El partido ya está cerrado y completo")

    try:
        if data.action == "challenge":
            if partido.get("tipo") != "RIVAL":
                raise HTTPException(status_code=400, detail="Este partido no es de tipo Versus/Rival")
            if not data.rival_team_id or not ObjectId.is_valid(data.rival_team_id):
                raise HTTPException(status_code=400, detail="Equipo rival inválido")

            rival_team = await equipos_col.find_one({
                "_id": ObjectId(data.rival_team_id),
                "creadorEmail": current_user["email"],
            })
            if not rival_team:
                raise HTTPException(status_code=403, detail="No puedes usar un equipo que no te pertenece")

            result = await partidos_col.update_one(
                {
                    "_id": object_id,
                    "activo": {"$ne": False},
                    "estado": "BUSCANDO RIVAL",
                    "rival": None,
                },
                {"$set": {
                    "rival": rival_team["nombre"],
                    "estado": "PARTIDO LISTO",
                    "jugadores": partido.get("total", 12),
                }},
            )
            if result.modified_count == 0:
                logger.warning(
                    "match.challenge.conflict",
                    extra={
                        "event": "match.challenge.conflict",
                        "entity_type": "match",
                        "entity_id": partido_id,
                    },
                )
                raise HTTPException(
                    status_code=409,
                    detail="El desafío ya fue aceptado o dejó de estar disponible",
                )
            logger.info(
                "match.challenge.accepted",
                extra={
                    "event": "match.challenge.accepted",
                    "entity_type": "match",
                    "entity_id": partido_id,
                },
            )
        else:
            if partido.get("tipo") != "JUGADORES":
                raise HTTPException(status_code=400, detail="Este partido no acepta jugadores individuales")
            if partido.get("creadorEmail") == current_user["email"]:
                raise HTTPException(status_code=400, detail="No puedes sumarte a tu propio partido")

            # --- Regla: mismo jugador no puede tener partidos que se crucen ---
            usuario_email = current_user["email"]
            async for pu in partidos_col.find({
                "$or": [
                    {"creadorEmail": usuario_email},
                    {"jugadoresInscritos": usuario_email},
                ],
                "estado": {"$ne": "CANCELADO"},
                "_id": {"$ne": object_id},
            }):
                if _horarios_solapan(
                    partido["fecha"], partido["hora"], partido.get("duracion_minutos", 60),
                    pu["fecha"], pu["hora"], pu.get("duracion_minutos", 60),
                ):
                    logger.warning(
                        "match.join.overlap_conflict",
                        extra={
                            "event": "match.join.overlap_conflict",
                            "entity_type": "match",
                            "entity_id": partido_id,
                        },
                    )
                    raise HTTPException(
                        status_code=409,
                        detail="Ya tienes un partido que se cruza en este horario",
                    )

            result = await partidos_col.update_one(
                {
                    "_id": object_id,
                    "activo": {"$ne": False},
                    "estado": "BUSCANDO JUGADORES",
                    "jugadores": {"$lt": partido.get("total", 12)},
                    "jugadoresInscritos": {"$ne": current_user["email"]},
                },
                [{
                    "$set": {
                        "jugadoresInscritos": {
                            "$setUnion": [
                                {"$ifNull": ["$jugadoresInscritos", []]},
                                [current_user["email"]],
                            ],
                        },
                        "jugadores": {
                            "$add": [{"$ifNull": ["$jugadores", 0]}, 1],
                        },
                        "estado": {
                            "$cond": [
                                {
                                    "$gte": [
                                        {"$add": [{"$ifNull": ["$jugadores", 0]}, 1]},
                                        {"$ifNull": ["$total", 12]},
                                    ],
                                },
                                "PARTIDO LISTO",
                                {"$ifNull": ["$estado", "BUSCANDO JUGADORES"]},
                            ],
                        },
                    },
                }],
            )
            if result.modified_count == 0:
                logger.warning(
                    "match.join.conflict",
                    extra={
                        "event": "match.join.conflict",
                        "entity_type": "match",
                        "entity_id": partido_id,
                    },
                )
                raise HTTPException(
                    status_code=409,
                    detail="El partido está lleno, cerrado o ya estás inscrito",
                )

            logger.info(
                "match.player.joined",
                extra={
                    "event": "match.player.joined",
                    "entity_type": "match",
                    "entity_id": partido_id,
                },
            )

        updated_partido = await partidos_col.find_one({"_id": object_id})
    except PyMongoError as exc:
        logger.exception(
            "match.update.database_error",
            extra={"event": "match.update.database_error", "entity_type": "match"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not update the match",
        ) from exc

    if not updated_partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return format_mongo_doc(updated_partido)
