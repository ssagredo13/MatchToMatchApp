from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import Optional, List
from app.database import partidos_col, format_mongo_doc
from app.models import Partido

router = APIRouter(prefix="/api/partidos", tags=["Partidos"])

@router.get("/")
async def listar_partidos(email: Optional[str] = None):
    partidos = []
    filtro = {"activo": {"$ne": False}} # Solo los que no están cancelados
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
    

@router.patch("/{id}/cancelar")
async def cancelar_partido(id: str):
    # NUEVO: SOFT DELETE
    if not ObjectId.is_valid(id): raise HTTPException(status_code=400)
    res = await partidos_col.update_one({"_id": ObjectId(id)}, {"$set": {"activo": False, "estado": "CANCELADO"}})
    return {"msg": "Partido cancelado"}

@router.patch("/{partido_id}")
async def actualizar_partido(partido_id: str, data: dict):
    # AQUÍ ESTÁ TODA TU LÓGICA ORIGINAL DE BLOQUEOS Y UNIÓN
    try:
        if not ObjectId.is_valid(partido_id):
            raise HTTPException(status_code=400, detail="ID de partido inválido")
        oid = ObjectId(partido_id)
        partido_actual = await partidos_col.find_one({"_id": oid})
        if not partido_actual:
            raise HTTPException(status_code=404, detail="Partido no encontrado")

        if partido_actual.get("estado") == "PARTIDO LISTO":
            raise HTTPException(status_code=403, detail="El partido ya está cerrado y completo.")

        update_ops = {}
        if "rival" in data:
            if partido_actual.get("tipo") != "RIVAL":
                raise HTTPException(status_code=400, detail="Este partido no es de tipo Versus/Rival")
            update_ops["$set"] = {"rival": data["rival"], "estado": "PARTIDO LISTO", "jugadores": 12}
        
        elif "nuevoJugadorEmail" in data:
            email = data["nuevoJugadorEmail"]
            if partido_actual.get("jugadores", 0) >= partido_actual.get("total", 12):
                raise HTTPException(status_code=400, detail="La pichanga ya está llena")
            update_ops["$addToSet"] = {"jugadoresInscritos": email}
            update_ops["$inc"] = {"jugadores": 1}
            if (partido_actual.get("jugadores", 0) + 1) >= partido_actual.get("total", 12):
                if "$set" not in update_ops: update_ops["$set"] = {}
                update_ops["$set"]["estado"] = "PARTIDO LISTO"

        if not update_ops:
            raise HTTPException(status_code=400, detail="No hay datos válidos")

        await partidos_col.update_one({"_id": oid}, update_ops)
        updated_doc = await partidos_col.find_one({"_id": oid})
        return format_mongo_doc(updated_doc)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

