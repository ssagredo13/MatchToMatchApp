from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from pymongo.errors import PyMongoError

from app.config import settings
from app.database import usuarios_col

bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(email: str) -> str:
    if not settings.auth_secret_key or len(settings.auth_secret_key) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Session signing is not configured",
        )

    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "iat": now,
        "exp": now + timedelta(minutes=60),
    }
    return jwt.encode(payload, settings.auth_secret_key, algorithm="HS256")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or not settings.auth_secret_key or len(settings.auth_secret_key) < 32:
        raise unauthorized

    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.auth_secret_key,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        email = claims.get("sub")
        if not isinstance(email, str):
            raise unauthorized
    except InvalidTokenError as exc:
        raise unauthorized from exc

    try:
        user = await usuarios_col.find_one({"email": email})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify the user session",
        ) from exc

    if user is None:
        raise unauthorized
    return user
