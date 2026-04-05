from fastapi import APIRouter, HTTPException
from typing import Optional
from bson import ObjectId
from app.models import Partido
from app.database import partidos_col, format_mongo_doc

router = APIRouter(prefix="/api/partidos", tags=["Partidos"])

@router.get("/")
async def listar_partidos(email: Optional[str] = None):
    partidos = []
    # Filtramos para que solo aparezcan los activos: True
    filtro = {"activo": True} 
    if email:
        filtro["$or"] = [{"creadorEmail": email}, {"jugadoresInscritos": email}]
    
    async for p in partidos_col.find(filtro).sort("_id", -1): 
        partidos.append(format_mongo_doc(p))
    return partidos

@router.post("/")
async def crear_partido(partido: Partido):
    try:
        res = await partidos_col.insert_one(partido.model_dump())
        return {"id": str(res.inserted_id), **partido.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")

# NUEVO ENDPOINT PARA CANCELAR (Soft Delete)
@router.patch("/{id}/cancelar")
async def cancelar_partido(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")
    
    res = await partidos_col.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"estado": "CANCELADO", "activo": False}}
    )
    
    if res.modified_count:
        return {"msg": "Partido movido al historial"}
    raise HTTPException(status_code=404, detail="No encontrado")