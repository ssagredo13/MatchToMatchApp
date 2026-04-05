from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import equipos, partidos, recintos

app = FastAPI(title="Match to Match API")

# CONFIGURACIÓN CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTRO DE RUTAS (Aquí conectamos los archivos de la carpeta routes)
app.include_router(equipos.router)
app.include_router(partidos.router)
app.include_router(recintos.router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend Profesional de Match to Match"}