# main.py
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.config import settings
from app.database import client, equipos_col, partidos_col, ping_db, usuarios_col
from app.routes import auth, equipos, partidos, recintos

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await usuarios_col.create_index("email", unique=True)
        await equipos_col.create_index(
            [("creadorEmail", 1), ("nombre", 1)],
            unique=True,
        )
        await partidos_col.create_index(
            [("creadorEmail", 1), ("idempotencyKey", 1)],
            unique=True,
            partialFilterExpression={"idempotencyKey": {"$type": "string"}},
        )
    except PyMongoError:
        logger.exception(
            "Database initialization failed. Check Render's MONGO_URL, Atlas database "
            "user credentials/roles, and network access. URL-encode special characters "
            "in the username or password."
        )
        raise
    yield
    await client.close()


app = FastAPI(
    title="Match to Match API",
    description="API para gestión de partidos y recintos deportivos",
    version="2.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
)

app.include_router(auth.router)
app.include_router(equipos.router)
app.include_router(partidos.router)
app.include_router(recintos.router)


@app.exception_handler(PyMongoError)
async def handle_database_error(request, exc: PyMongoError):
    logger.error(
        "MongoDB request failed",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service is temporarily unavailable"},
    )


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Match to Match API",
        "version": "2.2.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    if not await ping_db():
        raise HTTPException(status_code=503, detail="Database unavailable")

    return {
        "api": "online",
        "database": "connected",
    }