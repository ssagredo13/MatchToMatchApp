import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Cargamos variables de entorno (.env)
load_dotenv()

# --- CONFIGURACIÓN DE URL ---
# Prioriza la URL de MongoDB Atlas (en Render) o la de Docker (mtm-db) en local.
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mtm-db:27017")

# --- CLIENTE MOTOR (ASYNC) ---
# Configuramos timeouts para detectar fallos de red rápidamente
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000, # 5 seg para encontrar el servidor
    connectTimeoutMS=10000         # 10 seg para establecer conexión
)

# --- BASE DE DATOS Y COLECCIONES ---
DB_NAME = os.getenv("DB_NAME", "match_to_match")
db = client[DB_NAME]

# Colecciones exportables (Usamos nombres descriptivos para las rutas)
recintos_col = db.get_collection("recintos")
equipos_col = db.get_collection("equipos")
partidos_col = db.get_collection("partidos")

# --- UTILIDADES DE FORMATO ---
def format_mongo_doc(doc):
    """
    Convierte el '_id' de MongoDB (ObjectId) a un string 'id' 
    para que sea compatible con el Frontend (JSON).
    """
    if not doc: 
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

# --- MONITOREO ---
async def ping_db():
    """Verifica si la base de datos está respondiendo."""
    try:
        await client.admin.command('ping')
        return True
    except Exception:
        return False