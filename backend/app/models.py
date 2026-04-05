from pydantic import BaseModel
from typing import List, Optional

class Equipo(BaseModel):
    nombre: str
    creadorEmail: str

class Partido(BaseModel):
    equipo: str
    equipoId: str
    creadorEmail: str
    creadorNombre: Optional[str] = "Organizador" # <-- Para mostrar en la tarjeta
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
    estado: str
    activo: bool = True  # Agregamos esto para el Soft Delete
    rival: Optional[str] = None

class RecintoModel(BaseModel):
    nombre: str
    direccion: str
    lat: float
    lng: float
    oficial: bool = True