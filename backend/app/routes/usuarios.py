from fastapi import APIRouter, Body
from app.database import usuarios_col, format_mongo_doc

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

@router.post("/login")
async def login_o_registrar(user_data: dict = Body(...)):
    email = user_data.get("email")
    
    # 1. Buscar si el usuario ya existe
    existente = await usuarios_col.find_one({"email": email})
    
    if existente:
        return {"status": "ok", "user": format_mongo_doc(existente), "nuevo": False}
    
    # 2. Si no existe, lo creamos con los datos de Google
    nuevo_usuario = {
        "email": email,
        "nombre": user_data.get("displayName"),
        "foto": user_data.get("photoURL"),
        "rol": "jugador", # Rol por defecto
        "fecha_registro": user_data.get("lastSignInTime") 
    }
    
    result = await usuarios_col.insert_one(nuevo_usuario)
    nuevo_usuario["_id"] = result.inserted_id
    
    return {"status": "created", "user": format_mongo_doc(nuevo_usuario), "nuevo": True}

@router.get("/")
async def listar_usuarios():
    # Esto te permitirá ver a todos desde la API o una vista de Admin
    users = []
    async for u in usuarios_col.find():
        users.append(format_mongo_doc(u))
    return users