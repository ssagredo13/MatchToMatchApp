from datetime import date, datetime, time, timedelta, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator, model_validator


class EquipoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=2, max_length=60)


class PartidoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    equipoId: str = Field(min_length=1, max_length=24)
    recinto: str = Field(min_length=2, max_length=160)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    hora: str = Field(pattern=r"^\d{2}:\d{2}$")
    fecha: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    timezoneOffsetMinutes: int = Field(default=0, ge=-840, le=840)
    tipo: Literal["JUGADORES", "RIVAL"]
    jugadores: int = Field(ge=1)
    total: int = Field(ge=2, le=50)
    arqueroFaltante: bool
    duracion_minutos: int = Field(default=60, ge=30, le=180)

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

    @field_validator("recinto")
    @classmethod
    def trim_recinto(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise ValueError("recinto must contain at least two characters")
        return trimmed

    @model_validator(mode="after")
    def validate_player_count(self):
        if self.jugadores > self.total:
            raise ValueError("jugadores cannot exceed total")
        scheduled_at = datetime.combine(
            date.fromisoformat(self.fecha),
            time.fromisoformat(self.hora),
            tzinfo=timezone(timedelta(minutes=-self.timezoneOffsetMinutes)),
        ).astimezone(timezone.utc)
        if scheduled_at <= datetime.now(timezone.utc):
            raise ValueError("match date and time must be in the future")
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


class AvisoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tipo: Literal["RIVAL", "JUGADORES", "ARQUERO", "CANCHA"]
    recinto: str = Field(min_length=2, max_length=160)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    fecha: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    hora: str = Field(pattern=r"^\d{2}:\d{2}$")
    timezoneOffsetMinutes: int = Field(ge=-840, le=840)
    detalle: str = Field(default="", max_length=240)
    cantidad: Optional[int] = Field(default=None, ge=1, le=30)
    precio: Optional[int] = Field(default=None, ge=0, le=10_000_000)

    @field_validator("fecha")
    @classmethod
    def validate_fecha_aviso(cls, value: str) -> str:
        date.fromisoformat(value)
        return value

    @field_validator("hora")
    @classmethod
    def validate_hora_aviso(cls, value: str) -> str:
        time.fromisoformat(value)
        return value

    @field_validator("recinto", "detalle")
    @classmethod
    def trim_text_fields(cls, value: str, info: ValidationInfo) -> str:
        trimmed = value.strip()
        if info.field_name == "recinto" and not trimmed:
            raise ValueError("recinto cannot be empty")
        return trimmed

    @model_validator(mode="after")
    def validate_aviso(self):
        if (self.lat is None) != (self.lng is None):
            raise ValueError("lat and lng must be provided together")

        if self.tipo in {"JUGADORES", "ARQUERO"} and self.cantidad is None:
            raise ValueError("cantidad is required for player and goalkeeper notices")
        if self.tipo != "CANCHA" and self.precio is not None:
            raise ValueError("precio is only allowed for a court availability notice")
        if self.tipo == "CANCHA" and self.cantidad is not None:
            raise ValueError("cantidad is only allowed for player and goalkeeper notices")

        scheduled_at = datetime.combine(
            date.fromisoformat(self.fecha),
            time.fromisoformat(self.hora),
            tzinfo=timezone(timedelta(minutes=-self.timezoneOffsetMinutes)),
        ).astimezone(timezone.utc)
        now = datetime.now(timezone.utc)
        if scheduled_at <= now:
            raise ValueError("notice date and time must be in the future")
        if scheduled_at - now > timedelta(days=30):
            raise ValueError("notice date and time cannot be more than 30 days away")
        return self