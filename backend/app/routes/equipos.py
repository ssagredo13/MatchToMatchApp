from fastapi import APIRouter, HTTPException
from typing import Optional
from app.models import Equipo
from app.database import equipos_col, format_mongo_doc

router = APIRouter(prefix="/equipos", tags=["Equipos"])

@router.get("/")
async def obtener_equipos(email: Optional[str] = None):
    equipos = []
    filtro = {"creadorEmail": email} if email else {}
    async for eq in equipos_col.find(filtro):
        equipos.append(format_mongo_doc(eq))
    return equipos

@router.post("/")
async def crear_equipo(equipo: Equipo):
    existente = await equipos_col.find_one({"nombre": equipo.nombre, "creadorEmail": equipo.creadorEmail})
    if existente:
        raise HTTPException(status_code=400, detail="Ya tienes un equipo con ese nombre")
    nuevo_eq = await equipos_col.insert_one(equipo.model_dump())
    return {"id": str(nuevo_eq.inserted_id), **equipo.model_dump()}