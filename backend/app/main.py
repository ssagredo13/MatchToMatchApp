from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
import os
from dotenv import load_dotenv

# --- CARGAR VARIABLES DE ENTORNO ---
load_dotenv()

app = FastAPI(title="Match to Match API")

# --- CONFIGURACIÓN CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"], # Métodos explícitos
    allow_headers=["*"],
)

# --- CONEXIÓN BASE DE DATOS ---
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mtm-db:27017")
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000
)

DB_NAME = os.getenv("DB_NAME", "match_to_match")
db = client[DB_NAME]

# Colecciones
recintos_col = db.get_collection("recintos")
equipos_col = db.get_collection("equipos")
partidos_col = db.get_collection("partidos")

# --- UTILIDAD PARA FORMATEAR MONGO ---
def format_mongo_doc(doc):
    if not doc: return None
    doc["id"] = str(doc.pop("_id"))
    return doc

# --- MODELOS DE DATOS ---
class Equipo(BaseModel):
    nombre: str
    creadorEmail: str

class Partido(BaseModel):
    equipo: str
    equipoId: str
    creadorEmail: str
    recinto: str
    lat: float
    lng: float
    hora: str
    fecha: str
    tipo: str
    jugadores: int
    total: int
    arqueroFaltante: bool
    jugadoresInscritos: List[str]
    estado: str
    rival: Optional[str] = None

# --- ENDPOINTS ---

@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend Match to Match funcionando"}

# --- SECCIÓN EQUIPOS ---

@app.get("/api/equipos")
async def obtener_equipos(email: Optional[str] = None):
    equipos = []
    filtro = {"creadorEmail": email} if email else {}
    async for eq in equipos_col.find(filtro):
        equipos.append(format_mongo_doc(eq))
    return equipos

@app.post("/api/equipos")
async def crear_equipo(equipo: Equipo):
    existente = await equipos_col.find_one({"nombre": equipo.nombre, "creadorEmail": equipo.creadorEmail})
    if existente:
        raise HTTPException(status_code=400, detail="Ya tienes un equipo con ese nombre")
    nuevo_eq = await equipos_col.insert_one(equipo.model_dump())
    return {"id": str(nuevo_eq.inserted_id), **equipo.model_dump()}

# --- SECCIÓN PARTIDOS ---

@app.get("/api/partidos")
async def listar_partidos(email: Optional[str] = None):
    partidos = []
    filtro = {}
    if email:
        filtro = {"$or": [{"creadorEmail": email}, {"jugadoresInscritos": email}]}
    
    async for p in partidos_col.find(filtro).sort("_id", -1): 
        partidos.append(format_mongo_doc(p))
    return partidos

@app.post("/api/partidos")
async def crear_partido(partido: Partido):
    try:
        res = await partidos_col.insert_one(partido.model_dump())
        return {"id": str(res.inserted_id), **partido.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")

@app.patch("/api/partidos/{partido_id}")
async def actualizar_partido(partido_id: str, data: dict):
    try:
        if not ObjectId.is_valid(partido_id):
            raise HTTPException(status_code=400, detail="ID de partido inválido")
            
        oid = ObjectId(partido_id)
        update_ops = {}

        if "rival" in data:
            update_ops["$set"] = {
                "rival": data["rival"],
                "estado": "PARTIDO LISTO",
                "jugadores": 12 
            }
        elif "nuevoJugadorEmail" in data:
            email = data["nuevoJugadorEmail"]
            update_ops["$addToSet"] = {"jugadoresInscritos": email}
            update_ops["$inc"] = {"jugadores": 1}

        if not update_ops:
            raise HTTPException(status_code=400, detail="Datos de actualización no válidos")

        res = await partidos_col.update_one({"_id": oid}, update_ops)
        
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Partido no encontrado")

        updated_doc = await partidos_col.find_one({"_id": oid})
        return format_mongo_doc(updated_doc)
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/partidos/{id}")
async def eliminar_partido(id: str):
    try:
        if not ObjectId.is_valid(id):
             raise HTTPException(status_code=400, detail="ID inválido")
        res = await partidos_col.delete_one({"_id": ObjectId(id)})
        if res.deleted_count:
            return {"msg": "Partido eliminado"}
        raise HTTPException(status_code=404, detail="No encontrado")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- SECCIÓN RECINTOS ---
@app.get("/api/recintos")
async def listar_recintos():
    items = []
    async for r in recintos_col.find():
        items.append(format_mongo_doc(r))
    return items

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)