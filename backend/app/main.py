# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import equipos, partidos, recintos, auth 

# Agregamos redirect_slashes=False para evitar el error 307 que vimos en tus logs
app = FastAPI(
    title="Match to Match API",
    description="Backend Profesional para gestión de pichangas",
    version="2.1.0",
    redirect_slashes=False  
)

# --- CONFIGURACIÓN DE CORS ---
# Especificar el dominio de Vercel ayuda a que el navegador confíe más en la conexión
origins = [
    "https://match-to-match-app.vercel.app",
    "http://localhost:5173",
    "*" # Mantenemos el asterisco por si acaso, pero los anteriores tienen prioridad
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS ---
# IMPORTANTE: Asegúrate de que los prefijos en los routers tengan o no barra consistentemente
app.include_router(auth.router)
app.include_router(equipos.router)
app.include_router(partidos.router)
app.include_router(recintos.router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend Match to Match", "version": "2.1.0"}