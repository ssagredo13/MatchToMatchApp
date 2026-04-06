# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importamos todos los routers necesarios, incluyendo el nuevo de auth
from app.routes import equipos, partidos, recintos, auth 

app = FastAPI(
    title="Match to Match API",
    description="Backend Profesional para gestión de pichangas y recintos deportivos",
    version="2.1.0"
)

# --- CONFIGURACIÓN DE CORS ---
# Nota: "allow_origins=['*']" es útil para desarrollo, pero en producción 
# Vercel y Render se comunicarán mejor si los dejas abiertos o específicos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS (ORDENADO) ---
app.include_router(auth.router)     # Autenticación y Persistencia de Usuarios
app.include_router(equipos.router)  # Gestión de Clubes
app.include_router(partidos.router) # Lógica de Pichangas
app.include_router(recintos.router) # Mapa y Sedes Deportivas

@app.get("/")
async def root():
    return {
        "status": "ok", 
        "message": "Backend Profesional de Match to Match",
        "version": "2.1.0",
        "docs": "/docs"
    }

# --- MONITOREO DE SALUD (OPCIONAL) ---
@app.get("/health")
async def health_check():
    from app.database import ping_db
    db_status = await ping_db()
    return {
        "api": "online",
        "database": "connected" if db_status else "disconnected"
    }