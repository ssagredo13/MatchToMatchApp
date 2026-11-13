import asyncio
import logging

from fastapi import APIRouter, HTTPException, Response, status
from google.auth.exceptions import TransportError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from pydantic import BaseModel, ConfigDict, Field
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.config import settings
from app.database import format_mongo_doc, usuarios_col
from app.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])
logger = logging.getLogger(__name__)


class GoogleLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    credential: str = Field(min_length=20, max_length=8192)


@router.post("/login")
async def login_google(payload: GoogleLoginRequest, response: Response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"

    if (
        not settings.google_client_id
        or not settings.auth_secret_key
        or len(settings.auth_secret_key) < 32
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        )

    try:
        claims = await asyncio.to_thread(
            id_token.verify_oauth2_token,
            payload.credential,
            Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google credential is invalid or expired",
        ) from exc
    except TransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is temporarily unavailable",
        ) from exc

    claimed_email = claims.get("email")
    email = claimed_email.strip().lower() if isinstance(claimed_email, str) else ""
    if not email or claims.get("email_verified") is not True or not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google did not provide a verified account",
        )

    user_fields = {
        "google_sub": claims["sub"],
        "email": email,
        "nombre": claims.get("name") or claims.get("given_name") or email,
        "foto": claims.get("picture"),
        "rol": "admin" if email in settings.configured_admin_emails else "jugador",
    }
    update = {"$set": user_fields}

    try:
        try:
            persistence_result = await usuarios_col.update_one(
                {"email": email},
                update,
                upsert=True,
            )
        except DuplicateKeyError:
            # Concurrent first logins can race against the unique email index.
            persistence_result = await usuarios_col.update_one({"email": email}, update)

        user = await usuarios_col.find_one({"email": email})
    except PyMongoError as exc:
        logger.exception(
            "auth.login.database_error",
            extra={"event": "auth.login.database_error"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not persist the user",
        ) from exc

    if user is None:
        logger.error(
            "auth.login.persisted_user_missing",
            extra={"event": "auth.login.persisted_user_missing"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load the persisted user",
        )

    if persistence_result.upserted_id is not None:
        logger.info(
            "auth.user.created",
            extra={
                "event": "auth.user.created",
                "entity_type": "user",
                "entity_id": str(persistence_result.upserted_id),
            },
        )
    logger.info(
        "auth.login.succeeded",
        extra={
            "event": "auth.login.succeeded",
            "entity_type": "user",
            "entity_id": str(user["_id"]),
        },
    )

    return {
        "user": format_mongo_doc(user),
        "access_token": create_access_token(email),
        "token_type": "bearer",
    }