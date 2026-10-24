from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongo_url: str = Field(default="mongodb://localhost:27017", min_length=1)
    db_name: str = "match_to_match"
    google_client_id: str | None = None
    auth_secret_key: str | None = None
    admin_emails: str = ""
    allowed_origins: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        if not origins:
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin")
        if "*" in origins:
            raise ValueError("ALLOWED_ORIGINS must not contain a wildcard")
        return origins

    @property
    def configured_admin_emails(self) -> set[str]:
        return {
            email.strip().lower()
            for email in self.admin_emails.split(",")
            if email.strip()
        }


settings = Settings()
