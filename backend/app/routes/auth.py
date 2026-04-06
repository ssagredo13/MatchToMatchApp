from fastapi import APIRouter, Body
from app.database import usuarios_col, format_mongo_doc

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login")
async def login_google(user_data: dict = Body(...)):
    email = user_data.get("email")
    # Si el usuario no existe, lo creamos
    user = await usuarios_col.find_one({"email": email})
    if not user:
        new_user = {
            "email": email,
            "nombre": user_data.get("displayName"),
            "foto": user_data.get("photoURL"),
            "rol": "jugador"
        }
        await usuarios_col.insert_one(new_user)
        user = new_user
    return format_mongo_doc(user)