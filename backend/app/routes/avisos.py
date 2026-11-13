from datetime import date, datetime, time, timedelta, timezone
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import PyMongoError

from app.database import avisos_col, format_mongo_doc
from app.models import AvisoCreate
from app.security import get_current_user

router = APIRouter(prefix="/api/avisos", tags=["Avisos"])
logger = logging.getLogger(__name__)


def _format_notice(aviso: dict, current_email: str) -> dict:
    public_notice = {
        key: value for key, value in aviso.items() if key != "creadorEmail"
    }
    public_notice["isOwner"] = aviso.get("creadorEmail") == current_email
    return format_mongo_doc(public_notice)


@router.get("/")
async def listar_avisos(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    avisos = []
    cursor = (
        avisos_col.find({"activo": True, "expiresAt": {"$gt": now}})
        .sort([("fecha", 1), ("hora", 1)])
        .limit(100)
    )
    async for aviso in cursor:
        avisos.append(_format_notice(aviso, current_user["email"]))
    return avisos


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_aviso(
    aviso: AvisoCreate,
    current_user: dict = Depends(get_current_user),
):
    scheduled_at = datetime.combine(
        date.fromisoformat(aviso.fecha),
        time.fromisoformat(aviso.hora),
        tzinfo=timezone(timedelta(minutes=-aviso.timezoneOffsetMinutes)),
    ).astimezone(timezone.utc)
    aviso_data = aviso.model_dump()
    aviso_data.update({
        "creadorEmail": current_user["email"],
        "creadorNombre": current_user.get("nombre") or current_user["email"],
        "activo": True,
        "createdAt": datetime.now(timezone.utc),
        "expiresAt": scheduled_at.astimezone(timezone.utc),
    })

    try:
        result = await avisos_col.insert_one(aviso_data)
    except PyMongoError as exc:
        logger.exception(
            "notice.create.database_error",
            extra={"event": "notice.create.database_error"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo publicar el aviso. Intenta nuevamente.",
        ) from exc

    logger.info(
        "notice.created",
        extra={
            "event": "notice.created",
            "entity_type": "notice",
            "entity_id": str(result.inserted_id),
        },
    )
    return _format_notice({"_id": result.inserted_id, **aviso_data}, current_user["email"])


@router.delete("/{aviso_id}")
async def cancelar_aviso(
    aviso_id: str,
    current_user: dict = Depends(get_current_user),
):
    from bson import ObjectId

    if not ObjectId.is_valid(aviso_id):
        raise HTTPException(status_code=400, detail="ID de aviso inválido")

    aviso = await avisos_col.find_one({"_id": ObjectId(aviso_id)})
    if not aviso:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    if aviso.get("creadorEmail") != current_user["email"]:
        raise HTTPException(
            status_code=403,
            detail="Solo quien publicó el aviso puede cancelarlo",
        )

    try:
        result = await avisos_col.update_one(
            {"_id": ObjectId(aviso_id), "activo": True},
            {"$set": {"activo": False}},
        )
    except PyMongoError as exc:
        logger.exception(
            "notice.cancel.database_error",
            extra={"event": "notice.cancel.database_error", "entity_type": "notice"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo cancelar el aviso. Intenta nuevamente.",
        ) from exc
    if result.modified_count:
        logger.info(
            "notice.cancelled",
            extra={
                "event": "notice.cancelled",
                "entity_type": "notice",
                "entity_id": aviso_id,
            },
        )
    return {"msg": "Aviso cancelado"}
