from datetime import date, time
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class EquipoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=2, max_length=60)


class PartidoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    equipoId: str = Field(min_length=1, max_length=24)
    recinto: str = Field(min_length=1, max_length=160)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    hora: str = Field(pattern=r"^\d{2}:\d{2}$")
    fecha: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    tipo: Literal["JUGADORES", "RIVAL"]
    jugadores: int = Field(ge=1)
    total: int = Field(ge=2, le=50)
    arqueroFaltante: bool

    @field_validator("fecha")
    @classmethod
    def validate_fecha(cls, value: str) -> str:
        date.fromisoformat(value)
        return value

    @field_validator("hora")
    @classmethod
    def validate_hora(cls, value: str) -> str:
        time.fromisoformat(value)
        return value

    @model_validator(mode="after")
    def validate_player_count(self):
        if self.jugadores > self.total:
            raise ValueError("jugadores cannot exceed total")
        return self

class RecintoModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=1, max_length=100)
    direccion: str = Field(min_length=1, max_length=200)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    oficial: bool = True


class MatchUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: Literal["join", "challenge"]
    rival_team_id: Optional[str] = None