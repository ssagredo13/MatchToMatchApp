import jwt
from bson import ObjectId
from fastapi import HTTPException, Response
from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from app.routes import auth
from app.security import create_access_token, get_current_user
from fastapi.security import HTTPAuthorizationCredentials


class GoogleLoginTests(IsolatedAsyncioTestCase):
    async def test_verified_google_user_is_persisted_and_receives_session(self):
        secret = "test-secret-key-with-more-than-32-characters"
        claims = {
            "sub": "google-user-123",
            "email": "PLAYER@EXAMPLE.COM",
            "email_verified": True,
            "name": "Player",
            "picture": "https://example.com/player.jpg",
        }
        persisted_user = {
            "_id": ObjectId(),
            "email": "player@example.com",
            "nombre": "Player",
            "foto": "https://example.com/player.jpg",
            "rol": "jugador",
        }
        collection = SimpleNamespace(
            update_one=AsyncMock(),
            find_one=AsyncMock(return_value=persisted_user),
        )
        auth_settings = SimpleNamespace(
            google_client_id="test-client-id",
            auth_secret_key=secret,
            configured_admin_emails=set(),
        )
        security_settings = SimpleNamespace(auth_secret_key=secret)

        with (
            patch("app.routes.auth.settings", auth_settings),
            patch("app.routes.auth.usuarios_col", collection),
            patch("app.routes.auth.id_token.verify_oauth2_token", return_value=claims),
            patch("app.security.settings", security_settings),
        ):
            response = Response()
            result = await auth.login_google(
                auth.GoogleLoginRequest(credential="x" * 40),
                response,
            )

        collection.update_one.assert_awaited_once()
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertEqual(collection.update_one.await_args.args[0], {"email": "player@example.com"})
        self.assertEqual(result["user"]["email"], "player@example.com")
        self.assertEqual(result["user"]["nombre"], "Player")
        self.assertEqual(
            jwt.decode(result["access_token"], secret, algorithms=["HS256"])["sub"],
            "player@example.com",
        )

    async def test_unverified_google_email_is_rejected(self):
        claims = {
            "sub": "google-user-123",
            "email": "player@example.com",
            "email_verified": False,
        }
        collection = SimpleNamespace(
            update_one=AsyncMock(),
            find_one=AsyncMock(),
        )
        auth_settings = SimpleNamespace(
            google_client_id="test-client-id",
            auth_secret_key="test-secret-key-with-more-than-32-characters",
            configured_admin_emails=set(),
        )

        with (
            patch("app.routes.auth.settings", auth_settings),
            patch("app.routes.auth.usuarios_col", collection),
            patch("app.routes.auth.id_token.verify_oauth2_token", return_value=claims),
        ):
            with self.assertRaises(HTTPException) as raised:
                await auth.login_google(
                    auth.GoogleLoginRequest(credential="x" * 40),
                    Response(),
                )

        self.assertEqual(raised.exception.status_code, 401)
        collection.update_one.assert_not_awaited()

    async def test_session_resolves_only_an_existing_database_user(self):
        secret = "test-secret-key-with-more-than-32-characters"
        user = {"email": "player@example.com", "rol": "jugador"}
        collection = SimpleNamespace(find_one=AsyncMock(return_value=user))

        with (
            patch("app.security.settings", SimpleNamespace(auth_secret_key=secret)),
            patch("app.security.usuarios_col", collection),
        ):
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=create_access_token(user["email"]),
            )
            resolved_user = await get_current_user(credentials)

        self.assertEqual(resolved_user, user)
        collection.find_one.assert_awaited_once_with({"email": user["email"]})
