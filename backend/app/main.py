# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importamos usuarios en lugar de auth para centralizar la lógica
from app.routes import usuarios, equipos, partidos, recintos 

# redirect_slashes=False evita que el navegador haga redirecciones raras (error 307)
app = FastAPI(
    title="Match to Match API",
    description="Backend Profesional para gestión de pichangas",
    version="2.1.0",
    redirect_slashes=False  
)

# --- CONFIGURACIÓN DE CORS ---
# Esto permite que tu Frontend en Vercel se comunique sin bloqueos
origins = [
    "https://match-to-match-app.vercel.app",
    "http://localhost:5173", # Para tus pruebas locales
    "*" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS ---
# Hemos quitado auth.router porque usuarios.router ya cubre esas funciones
app.include_router(usuarios.router)  
app.include_router(equipos.router)
app.include_router(partidos.router)
app.include_router(recintos.router)

@app.get("/")
async def root():
    return {
        "status": "ok", 
        "message": "Backend Match to Match funcionando", 
        "version": "2.1.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "online"}