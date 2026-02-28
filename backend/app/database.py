import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Cargamos variables de entorno si existe un archivo .env (útil para desarrollo local fuera de Docker)
load_dotenv()

# --- CONFIGURACIÓN DE URL ---
# En Docker, tomará 'mongodb://mongodb:27017' definido en el docker-compose.yml
# El nombre 'mongodb' debe coincidir con el nombre del servicio en el YAML.
# Cambia "mongodb" por "mtm-db"
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mtm-db:27017")

# --- CLIENTE MOTOR ---
# Agregamos timeouts para evitar bloqueos infinitos si la DB no está lista
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000, # 5 segundos máximo para encontrar el servidor
    connectTimeoutMS=10000         # 10 segundos máximo para conectar
)

# --- BASE DE DATOS Y COLECCIONES ---
# Aseguramos usar el mismo nombre de base de datos que en main.py
DB_NAME = os.getenv("DB_NAME", "match_to_match")
database = client[DB_NAME]

# Colecciones exportables
recintos_helper = database.get_collection("recintos")
equipos_helper = database.get_collection("equipos")
partidos_helper = database.get_collection("partidos")

# Función útil para verificar la conexión si fuera necesario
async def ping_db():
    try:
        await client.admin.command('ping')
        return True
    except Exception:
        return False