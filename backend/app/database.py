from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

from app.config import settings


client = AsyncMongoClient(
    settings.mongo_url,
    serverSelectionTimeoutMS=5000, # 5 seg para encontrar el servidor
    connectTimeoutMS=10000         # 10 seg para establecer conexión
)

db = client[settings.db_name]

recintos_col = db.get_collection("recintos")
equipos_col = db.get_collection("equipos")
partidos_col = db.get_collection("partidos")
usuarios_col = db.get_collection("usuarios")


def format_mongo_doc(doc):
    if not doc:
        return None
    formatted = {key: value for key, value in doc.items() if key != "_id"}
    formatted["id"] = str(doc["_id"])
    return formatted


async def ping_db():
    try:
        await client.admin.command("ping")
        return True
    except PyMongoError:
        return False