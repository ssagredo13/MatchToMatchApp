from fastapi import APIRouter, Body
from app.database import usuarios_col, format_mongo_doc
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

@router.post("/login")
async def login_o_registrar(user_data: dict = Body(...)):
    email = user_data.get("email")
    ahora = datetime.utcnow()
    
    # 1. Buscar si el usuario ya existe
    existente = await usuarios_col.find_one({"email": email})
    
    if existente:
        # ACTUALIZAMOS su última conexión al loguearse
        await usuarios_col.update_one(
            {"email": email}, 
            {"$set": {"ultimaConexion": ahora}}
        )
        return {"status": "ok", "user": format_mongo_doc(existente), "nuevo": False}
    
    # 2. Si no existe, lo creamos con los datos de Google
    nuevo_usuario = {
        "email": email,
        "nombreReal": user_data.get("displayName"), # Mantenemos nombreReal para coherencia con el Sidebar
        "photoURL": user_data.get("photoURL"),
        "rol": "jugador",
        "ciudad": "Talca", # Ciudad por defecto para el Hub inicial
        "fecha_registro": ahora,
        "ultimaConexion": ahora
    }
    
    result = await usuarios_col.insert_one(nuevo_usuario)
    nuevo_usuario["_id"] = result.inserted_id
    
    return {"status": "created", "user": format_mongo_doc(nuevo_usuario), "nuevo": True}

@router.get("/activos")
async def listar_usuarios_activos(email: str = None):
    """
    Retorna usuarios divididos en Online (activos hace < 15 min) 
    y Recientes (activos hace más tiempo).
    """
    limite_online = datetime.utcnow() - timedelta(minutes=15)
    
    # 1. Usuarios Online
    cursor_online = usuarios_col.find({"ultimaConexion": {"$gte": limite_online}}).limit(20)
    online = []
    async for u in cursor_online:
        user_doc = format_mongo_doc(u)
        user_doc["estadoConexion"] = "online"
        online.append(user_doc)
        
    # 2. Usuarios Recientes (Offline)
    cursor_recientes = usuarios_col.find({"ultimaConexion": {"$lt": limite_online}}).sort("ultimaConexion", -1).limit(30)
    recientes = []
    async for u in cursor_recientes:
        user_doc = format_mongo_doc(u)
        user_doc["estadoConexion"] = "offline"
        recientes.append(user_doc)
        
    # Retornamos ambos grupos (el frontend ActivePlayers los unirá o filtrará)
    return online + recientes

@router.get("/")
async def listar_usuarios():
    users = []
    async for u in usuarios_col.find():
        users.append(format_mongo_doc(u))
    return users