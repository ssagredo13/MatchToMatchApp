import hashlib
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


def _format_public_match(partido: dict) -> dict:
    public_partido = {
        key: value for key, value in partido.items() if key not in IDEMPOTENCY_FIELDS
    }
    return format_mongo_doc(public_partido)


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


@router.post("/")
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
            return _get_existing_idempotent_match(existing, payload_hash)

    equipo = await equipos_col.find_one({
        "_id": ObjectId(partido.equipoId),
        "creadorEmail": current_user["email"],
    })
    if not equipo:
        raise HTTPException(status_code=403, detail="No puedes organizar con un equipo que no te pertenece")

    partido_data = partido.model_dump()
    partido_data.update({
        "equipo": equipo["nombre"],
        "creadorEmail": current_user["email"],
        "creadorNombre": current_user.get("nombre") or current_user["email"],
        "jugadoresInscritos": [current_user["email"]],
        "estado": "BUSCANDO RIVAL" if partido.tipo == "RIVAL" else "BUSCANDO JUGADORES",
        "activo": True,
        "rival": None,
    })
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
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not confirm whether the match was saved",
            ) from exc
        return _get_existing_idempotent_match(existing, payload_hash)
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not save the match",
        ) from exc

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

    await partidos_col.update_one(
        {"_id": ObjectId(partido_id)},
        {"$set": {"activo": False, "estado": "CANCELADO"}},
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

            await partidos_col.update_one(
                {"_id": object_id, "estado": {"$ne": "PARTIDO LISTO"}},
                {"$set": {
                    "rival": rival_team["nombre"],
                    "estado": "PARTIDO LISTO",
                    "jugadores": partido.get("total", 12),
                }},
            )
        else:
            if partido.get("creadorEmail") == current_user["email"]:
                raise HTTPException(status_code=400, detail="No puedes sumarte a tu propio partido")

            result = await partidos_col.update_one(
                {
                    "_id": object_id,
                    "activo": {"$ne": False},
                    "estado": {"$ne": "PARTIDO LISTO"},
                    "jugadores": {"$lt": partido.get("total", 12)},
                    "jugadoresInscritos": {"$ne": current_user["email"]},
                },
                {
                    "$addToSet": {"jugadoresInscritos": current_user["email"]},
                    "$inc": {"jugadores": 1},
                },
            )
            if result.modified_count == 0:
                raise HTTPException(
                    status_code=409,
                    detail="El partido está lleno, cerrado o ya estás inscrito",
                )

            updated = await partidos_col.find_one({"_id": object_id})
            if updated and updated.get("jugadores", 0) >= updated.get("total", 12):
                await partidos_col.update_one(
                    {"_id": object_id, "estado": {"$ne": "PARTIDO LISTO"}},
                    {"$set": {"estado": "PARTIDO LISTO"}},
                )

        updated_partido = await partidos_col.find_one({"_id": object_id})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not update the match",
        ) from exc

    if not updated_partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return format_mongo_doc(updated_partido)
