from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
import os
from dotenv import load_dotenv  # <--- NEW: Importar esto

# --- CARGAR VARIABLES DE ENTORNO ---
load_dotenv()  # <--- NEW: ¡ESTO ES VITAL! Sin esto, ignora el .env

app = FastAPI(title="Match to Match API")

# --- CONFIGURACIÓN CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONEXIÓN BASE DE DATOS ---
# Ahora sí, os.getenv buscará primero en tu .env la URL de Atlas
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mtm-db:27017")


# Configuración de cliente con Timeouts para evitar que el contenedor se quede colgado
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000
)

# Nombre de la base de datos (extraído de env o por defecto)
DB_NAME = os.getenv("DB_NAME", "match_to_match")
db = client[DB_NAME]

# Colecciones
recintos_col = db.get_collection("recintos")
equipos_col = db.get_collection("equipos")
partidos_col = db.get_collection("partidos")

# --- MODELOS DE DATOS ---

class Recinto(BaseModel):
    nombre: str
    direccion: str
    lat: float
    lng: float

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

@app.get("/api/recintos")
async def listar_recintos():
    try:
        items = []
        async for r in recintos_col.find():
            items.append({"id": str(r["_id"]), **{k: v for k, v in r.items() if k != "_id"}})
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al conectar con DB: {str(e)}")

@app.get("/api/equipos", response_model=List[dict])
async def obtener_equipos(email: str = Query(...)):
    equipos = []
    try:
        cursor = equipos_col.find({"creadorEmail": email})
        async for eq in cursor:
            equipos.append({
                "id": str(eq["_id"]), 
                "nombre": eq.get("nombre", "Sin nombre"), 
                "creadorEmail": eq.get("creadorEmail", "")
            })
        return equipos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en DB: {str(e)}")

@app.post("/api/equipos")
async def crear_equipo(equipo: Equipo):
    try:
        # Verificamos si ya existe
        existente = await equipos_col.find_one({
            "nombre": equipo.nombre, 
            "creadorEmail": equipo.creadorEmail
        })
        if existente:
            raise HTTPException(status_code=400, detail="Ya tienes un equipo con ese nombre")
            
        nuevo_eq = await equipos_col.insert_one(equipo.model_dump())
        return {"id": str(nuevo_eq.inserted_id), **equipo.model_dump()}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/partidos")
async def listar_partidos():
    try:
        partidos = []
        async for p in partidos_col.find():
            partidos.append({"id": str(p["_id"]), **{k: v for k, v in p.items() if k != "_id"}})
        return partidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/partidos")
async def crear_partido(partido: Partido):
    res = await partidos_col.insert_one(partido.model_dump())
    return {"id": str(res.inserted_id), **partido.model_dump()}

@app.delete("/api/partidos/{id}")
async def eliminar_partido(id: str):
    try:
        res = await partidos_col.delete_one({"_id": ObjectId(id)})
        if res.deleted_count:
            return {"msg": "Partido eliminado"}
        raise HTTPException(status_code=404, detail="No encontrado")
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

# El bloque if __name__ es opcional en Docker pero bueno tenerlo
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)