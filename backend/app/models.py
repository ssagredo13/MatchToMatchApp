from pydantic import BaseModel, Field
from typing import List, Optional

# --- MODELO PARA LOS RECINTOS DE TALCA ---
class RecintoModel(BaseModel):
    nombre: str
    direccion: str
    lat: float
    lng: float
    oficial: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Estadio Fiscal",
                "direccion": "Libertad 123, Talca",
                "lat": -35.4264,
                "lng": -71.6554
            }
        }

# --- MODELO PARA LOS EQUIPOS/CLUBES ---
class Equipo(BaseModel):
    nombre: str
    creadorEmail: str

# --- MODELO PARA LOS PARTIDOS (PICHANGAS) ---
class Partido(BaseModel):
    equipo: str
    equipoId: str
    creadorEmail: str
    recinto: str
    lat: float
    lng: float
    hora: str
    fecha: str
    tipo: str
    jugadores: int
    total: int
    arqueroFaltante: bool
    jugadoresInscritos: List[str]
    estado: str = "BUSCANDO RIVAL"
    activo: bool = True           # Este es clave para el Soft Delete (historial)
    rival: Optional[str] = None