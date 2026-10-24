from fastapi import APIRouter, Depends, HTTPException
from app.database import recintos_col, format_mongo_doc
from app.security import get_current_user

router = APIRouter(prefix="/api/recintos", tags=["Recintos"])

@router.get("/")
async def listar_recintos(current_user: dict = Depends(get_current_user)):
    recintos = []
    async for r in recintos_col.find():
        recintos.append(format_mongo_doc(r))
    return recintos

@router.get("/{id}")
async def obtener_recinto(id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")
    recinto = await recintos_col.find_one({"_id": ObjectId(id)})
    if not recinto:
        raise HTTPException(status_code=404, detail="Recinto no encontrado")
    return format_mongo_doc(recinto)