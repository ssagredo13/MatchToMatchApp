from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from bson import ObjectId
from fastapi import HTTPException

from app.models import AvisoCreate
from app.routes import avisos as avisos_route


def future_schedule():
    scheduled = datetime.now().astimezone() + timedelta(days=2)
    offset = -int(scheduled.utcoffset().total_seconds() / 60)
    return scheduled.strftime("%Y-%m-%d"), scheduled.strftime("%H:%M"), offset


class FakeCursor:
    def __init__(self, items):
        self.items = items

    def sort(self, fields):
        self.sort_fields = fields
        return self

    def limit(self, count):
        self.limit_count = count
        return self

    def __aiter__(self):
        self.iterator = iter(self.items)
        return self

    async def __anext__(self):
        try:
            return next(self.iterator)
        except StopIteration:
            raise StopAsyncIteration from None


class AvisoTests(IsolatedAsyncioTestCase):
    def make_notice(self, notice_type="JUGADORES"):
        fecha, hora, offset = future_schedule()
        data = {
            "tipo": notice_type,
            "recinto": "Cancha de prueba",
            "fecha": fecha,
            "hora": hora,
            "timezoneOffsetMinutes": offset,
        }
        if notice_type in {"JUGADORES", "ARQUERO"}:
            data["cantidad"] = 2
        if notice_type == "CANCHA":
            data["precio"] = 30000
        return AvisoCreate(**data)

    async def test_creation_persists_local_schedule_and_does_not_expose_email(self):
        notice = self.make_notice()
        owner = {"email": "owner@example.com", "nombre": "Capitán"}
        inserted_id = ObjectId()
        collection = SimpleNamespace(
            insert_one=AsyncMock(return_value=SimpleNamespace(inserted_id=inserted_id)),
        )

        with patch("app.routes.avisos.avisos_col", collection):
            result = await avisos_route.crear_aviso(notice, owner)

        stored_notice = collection.insert_one.await_args.args[0]
        self.assertEqual(stored_notice["creadorEmail"], owner["email"])
        self.assertTrue(stored_notice["expiresAt"].tzinfo)
        self.assertEqual(result["id"], str(inserted_id))
        self.assertTrue(result["isOwner"])
        self.assertNotIn("creadorEmail", result)

    async def test_listing_excludes_expired_notices_and_hides_owner_email(self):
        notice_id = ObjectId()
        cursor = FakeCursor([{
            "_id": notice_id,
            "tipo": "RIVAL",
            "creadorEmail": "owner@example.com",
            "creadorNombre": "Capitán",
        }])
        queries = []

        def find(query):
            queries.append(query)
            return cursor

        collection = SimpleNamespace(find=find)

        with patch("app.routes.avisos.avisos_col", collection):
            result = await avisos_route.listar_avisos({"email": "viewer@example.com"})

        query = queries[0]
        self.assertEqual(query["activo"], True)
        self.assertIn("$gt", query["expiresAt"])
        self.assertFalse(result[0]["isOwner"])
        self.assertNotIn("creadorEmail", result[0])

    async def test_only_notice_owner_can_cancel(self):
        notice_id = ObjectId()
        collection = SimpleNamespace(
            find_one=AsyncMock(return_value={"creadorEmail": "owner@example.com"}),
            update_one=AsyncMock(),
        )

        with patch("app.routes.avisos.avisos_col", collection):
            with self.assertRaises(HTTPException) as raised:
                await avisos_route.cancelar_aviso(
                    str(notice_id),
                    {"email": "other@example.com"},
                )

        self.assertEqual(raised.exception.status_code, 403)
        collection.update_one.assert_not_awaited()

    async def test_notice_owner_can_cancel(self):
        notice_id = ObjectId()
        collection = SimpleNamespace(
            find_one=AsyncMock(return_value={"creadorEmail": "owner@example.com"}),
            update_one=AsyncMock(),
        )

        with patch("app.routes.avisos.avisos_col", collection):
            result = await avisos_route.cancelar_aviso(
                str(notice_id),
                {"email": "owner@example.com"},
            )

        self.assertEqual(result["msg"], "Aviso cancelado")
        collection.update_one.assert_awaited_once_with(
            {"_id": notice_id, "activo": True},
            {"$set": {"activo": False}},
        )

    async def test_notice_requires_quantity_for_player_requests(self):
        fecha, hora, offset = future_schedule()
        with self.assertRaises(ValueError):
            AvisoCreate(
                tipo="JUGADORES",
                recinto="Cancha de prueba",
                fecha=fecha,
                hora=hora,
                timezoneOffsetMinutes=offset,
            )

    async def test_court_notice_rejects_player_quantity(self):
        fecha, hora, offset = future_schedule()
        with self.assertRaises(ValueError):
            AvisoCreate(
                tipo="CANCHA",
                recinto="Cancha de prueba",
                fecha=fecha,
                hora=hora,
                timezoneOffsetMinutes=offset,
                cantidad=2,
            )
