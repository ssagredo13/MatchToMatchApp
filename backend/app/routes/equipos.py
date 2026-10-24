from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError
from typing import Optional
from app.models import EquipoCreate
from app.database import equipos_col, format_mongo_doc
from app.security import get_current_user

router = APIRouter(prefix="/api/equipos", tags=["Equipos"])

@router.get("/")
async def obtener_equipos(
    email: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    current_email = current_user["email"]
    if email and email.strip().lower() != current_email:
        raise HTTPException(status_code=403, detail="No puedes consultar equipos de otro usuario")

    equipos = []
    filtro = {"creadorEmail": current_email}
    async for eq in equipos_col.find(filtro):
        equipos.append(format_mongo_doc(eq))
    return equipos

@router.post("/")
async def crear_equipo(equipo: EquipoCreate, current_user: dict = Depends(get_current_user)):
    nombre = equipo.nombre.strip()
    if not nombre:
        raise HTTPException(status_code=422, detail="El nombre del equipo es obligatorio")

    existente = await equipos_col.find_one({"nombre": nombre, "creadorEmail": current_user["email"]})
    if existente:
        raise HTTPException(status_code=400, detail="Ya tienes un equipo con ese nombre")
    team_data = {"nombre": nombre, "creadorEmail": current_user["email"]}
    try:
        nuevo_eq = await equipos_col.insert_one(team_data)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Ya tienes un equipo con ese nombre") from exc
    return {"id": str(nuevo_eq.inserted_id), **team_data}