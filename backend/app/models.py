from pydantic import BaseModel, Field
from typing import Optional

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