import hashlib

import jwt
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from app.routes import auth
from app.routes import partidos as partidos_route
from app.config import Settings
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


class CorsConfigurationTests(IsolatedAsyncioTestCase):
    async def test_production_frontend_is_allowed_with_local_origins(self):
        settings = Settings(
            allowed_origins="http://localhost:5173",
            production_frontend_origin="https://match-to-match-app.vercel.app",
        )

        self.assertIn("http://localhost:5173", settings.cors_origins)
        self.assertIn("https://match-to-match-app.vercel.app", settings.cors_origins)

    async def test_production_cors_preflight_is_accepted(self):
        origins = Settings(
            allowed_origins="http://localhost:5173",
            production_frontend_origin="https://match-to-match-app.vercel.app",
        ).cors_origins
        test_app = FastAPI()
        test_app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
        )

        @test_app.post("/api/auth/login")
        async def login():
            return {"ok": True}

        messages = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            messages.append(message)

        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "OPTIONS",
            "scheme": "https",
            "path": "/api/auth/login",
            "raw_path": b"/api/auth/login",
            "query_string": b"",
            "root_path": "",
            "headers": [
                (b"origin", b"https://match-to-match-app.vercel.app"),
                (b"access-control-request-method", b"POST"),
                (
                    b"access-control-request-headers",
                    b"content-type,idempotency-key",
                ),
            ],
            "client": ("127.0.0.1", 1234),
            "server": ("testserver", 443),
        }
        await test_app(scope, receive, send)
        response_headers = dict(messages[0]["headers"])

        self.assertEqual(messages[0]["status"], 200)
        self.assertEqual(
            response_headers[b"access-control-allow-origin"].decode(),
            "https://match-to-match-app.vercel.app",
        )
        self.assertIn(
            b"idempotency-key",
            response_headers[b"access-control-allow-headers"].lower(),
        )


class MatchCreationIdempotencyTests(IsolatedAsyncioTestCase):
    def _make_match(self):
        return partidos_route.PartidoCreate(
            equipoId=str(ObjectId()),
            recinto="Cancha de prueba",
            lat=-35.4,
            lng=-71.6,
            hora="20:00",
            fecha="2026-10-30",
            tipo="JUGADORES",
            jugadores=2,
            total=12,
            arqueroFaltante=False,
        )

    async def test_retry_with_same_key_returns_saved_match_without_inserting_again(self):
        match = self._make_match()
        payload_hash = hashlib.sha256(match.model_dump_json().encode()).hexdigest()
        saved_match = {
            "_id": ObjectId(),
            "equipo": "Equipo de prueba",
            "creadorEmail": "player@example.com",
            "idempotencyKey": "request-key",
            "idempotencyPayloadHash": payload_hash,
        }
        matches = SimpleNamespace(
            find_one=AsyncMock(return_value=saved_match),
            insert_one=AsyncMock(),
        )
        teams = SimpleNamespace(find_one=AsyncMock())

        with (
            patch("app.routes.partidos.partidos_col", matches),
            patch("app.routes.partidos.equipos_col", teams),
        ):
            result = await partidos_route.crear_partido(
                match,
                {"email": "player@example.com"},
                "request-key",
            )

        self.assertEqual(result["id"], str(saved_match["_id"]))
        self.assertNotIn("idempotencyKey", result)
        self.assertNotIn("idempotencyPayloadHash", result)
        matches.insert_one.assert_not_awaited()
        teams.find_one.assert_not_awaited()

    async def test_reusing_key_for_different_match_returns_conflict(self):
        match = self._make_match()
        saved_match = {
            "_id": ObjectId(),
            "creadorEmail": "player@example.com",
            "idempotencyKey": "request-key",
            "idempotencyPayloadHash": "different-payload",
        }
        matches = SimpleNamespace(find_one=AsyncMock(return_value=saved_match))

        with patch("app.routes.partidos.partidos_col", matches):
            with self.assertRaises(HTTPException) as raised:
                await partidos_route.crear_partido(
                    match,
                    {"email": "player@example.com"},
                    "request-key",
                )

        self.assertEqual(raised.exception.status_code, 409)

    async def test_creating_match_persists_owner_and_returns_database_id(self):
        match = self._make_match()
        owner = {"email": "player@example.com", "nombre": "Player"}
        team = {"_id": ObjectId(), "nombre": "Los de prueba"}
        inserted_id = ObjectId()
        teams = SimpleNamespace(find_one=AsyncMock(return_value=team))
        matches = SimpleNamespace(
            find_one=AsyncMock(return_value=None),
            insert_one=AsyncMock(return_value=SimpleNamespace(inserted_id=inserted_id)),
        )

        with (
            patch("app.routes.partidos.equipos_col", teams),
            patch("app.routes.partidos.partidos_col", matches),
        ):
            result = await partidos_route.crear_partido(match, owner, "new-request")

        saved_data = matches.insert_one.await_args.args[0]
        self.assertEqual(result["id"], str(inserted_id))
        self.assertEqual(result["creadorEmail"], owner["email"])
        self.assertEqual(result["estado"], "BUSCANDO JUGADORES")
        self.assertEqual(saved_data["idempotencyKey"], "new-request")
        self.assertNotIn("idempotencyKey", result)
        self.assertEqual(saved_data["jugadoresInscritos"], [owner["email"]])

    async def test_creating_match_with_another_users_team_is_forbidden(self):
        match = self._make_match()
        teams = SimpleNamespace(find_one=AsyncMock(return_value=None))
        matches = SimpleNamespace(find_one=AsyncMock(return_value=None), insert_one=AsyncMock())

        with (
            patch("app.routes.partidos.equipos_col", teams),
            patch("app.routes.partidos.partidos_col", matches),
        ):
            with self.assertRaises(HTTPException) as raised:
                await partidos_route.crear_partido(
                    match,
                    {"email": "player@example.com"},
                    "new-request",
                )

        self.assertEqual(raised.exception.status_code, 403)
        matches.insert_one.assert_not_awaited()

    async def test_joining_full_or_already_joined_match_is_rejected_atomically(self):
        match_id = ObjectId()
        matches = SimpleNamespace(
            find_one=AsyncMock(return_value={
                "_id": match_id,
                "creadorEmail": "host@example.com",
                "tipo": "JUGADORES",
                "activo": True,
                "estado": "BUSCANDO JUGADORES",
                "jugadores": 2,
                "total": 3,
            }),
            update_one=AsyncMock(return_value=SimpleNamespace(modified_count=0)),
        )

        with patch("app.routes.partidos.partidos_col", matches):
            with self.assertRaises(HTTPException) as raised:
                await partidos_route.actualizar_partido(
                    str(match_id),
                    partidos_route.MatchUpdate(action="join"),
                    {"email": "player@example.com"},
                )

        self.assertEqual(raised.exception.status_code, 409)
        update_filter = matches.update_one.await_args.args[0]
        self.assertEqual(update_filter["jugadoresInscritos"], {"$ne": "player@example.com"})
        self.assertEqual(update_filter["jugadores"], {"$lt": 3})

    async def test_successful_join_updates_player_count_and_closes_full_match(self):
        match_id = ObjectId()
        initial_match = {
            "_id": match_id,
            "creadorEmail": "host@example.com",
            "tipo": "JUGADORES",
            "activo": True,
            "estado": "BUSCANDO JUGADORES",
            "jugadores": 2,
            "total": 3,
        }
        full_match = {**initial_match, "jugadores": 3}
        saved_match = {
            **full_match,
            "estado": "PARTIDO LISTO",
            "jugadoresInscritos": ["host@example.com", "player@example.com"],
        }
        matches = SimpleNamespace(
            find_one=AsyncMock(side_effect=[initial_match, full_match, saved_match]),
            update_one=AsyncMock(
                side_effect=[
                    SimpleNamespace(modified_count=1),
                    SimpleNamespace(modified_count=1),
                ]
            ),
        )

        with patch("app.routes.partidos.partidos_col", matches):
            result = await partidos_route.actualizar_partido(
                str(match_id),
                partidos_route.MatchUpdate(action="join"),
                {"email": "player@example.com"},
            )

        self.assertEqual(result["estado"], "PARTIDO LISTO")
        self.assertEqual(result["jugadores"], 3)
        self.assertIn("player@example.com", result["jugadoresInscritos"])

    async def test_challenge_with_another_users_team_is_forbidden(self):
        match_id = ObjectId()
        rival_team_id = ObjectId()
        matches = SimpleNamespace(find_one=AsyncMock(return_value={
            "_id": match_id,
            "creadorEmail": "host@example.com",
            "tipo": "RIVAL",
            "activo": True,
            "estado": "BUSCANDO RIVAL",
        }))
        teams = SimpleNamespace(find_one=AsyncMock(return_value=None))

        with (
            patch("app.routes.partidos.partidos_col", matches),
            patch("app.routes.partidos.equipos_col", teams),
        ):
            with self.assertRaises(HTTPException) as raised:
                await partidos_route.actualizar_partido(
                    str(match_id),
                    partidos_route.MatchUpdate(
                        action="challenge",
                        rival_team_id=str(rival_team_id),
                    ),
                    {"email": "player@example.com"},
                )

        self.assertEqual(raised.exception.status_code, 403)

    async def test_only_match_owner_can_cancel_match(self):
        match_id = ObjectId()
        matches = SimpleNamespace(
            find_one=AsyncMock(return_value={
                "_id": match_id,
                "creadorEmail": "host@example.com",
            }),
            update_one=AsyncMock(),
        )

        with patch("app.routes.partidos.partidos_col", matches):
            with self.assertRaises(HTTPException) as raised:
                await partidos_route.cancelar_partido(
                    str(match_id),
                    {"email": "player@example.com", "rol": "jugador"},
                )

        self.assertEqual(raised.exception.status_code, 403)
        matches.update_one.assert_not_awaited()

    async def test_match_owner_can_cancel_match(self):
        match_id = ObjectId()
        matches = SimpleNamespace(
            find_one=AsyncMock(return_value={
                "_id": match_id,
                "creadorEmail": "host@example.com",
            }),
            update_one=AsyncMock(),
        )

        with patch("app.routes.partidos.partidos_col", matches):
            result = await partidos_route.cancelar_partido(
                str(match_id),
                {"email": "host@example.com", "rol": "jugador"},
            )

        self.assertEqual(result["msg"], "Partido cancelado")
        matches.update_one.assert_awaited_once_with(
            {"_id": match_id},
            {"$set": {"activo": False, "estado": "CANCELADO"}},
        )
