# main.py
import logging
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.config import settings
from app.database import avisos_col, client, equipos_col, partidos_col, ping_db, usuarios_col
from app.observability import configure_logging, request_id_context
from app.routes import auth, avisos, equipos, partidos, recintos

configure_logging()
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
        await avisos_col.create_index("expiresAt", expireAfterSeconds=0)
        await avisos_col.create_index([("activo", 1), ("fecha", 1), ("hora", 1)])
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


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid4())
    context_token = request_id_context.set(request_id)
    started_at = perf_counter()
    response = None
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        log_entry = {
            "event": "api.request.completed" if response.status_code < 400 else "api.request.failed",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round((perf_counter() - started_at) * 1000, 2),
        }
        if response.status_code >= 500:
            logger.error("API request returned an error", extra=log_entry)
        elif response.status_code >= 400:
            logger.warning("API request was rejected", extra=log_entry)
        else:
            logger.info("API request completed", extra=log_entry)
        return response
    finally:
        if response is None:
            logger.error(
                "api.request.failed",
                extra={
                    "event": "api.request.failed",
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round((perf_counter() - started_at) * 1000, 2),
                },
            )
        request_id_context.reset(context_token)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
    expose_headers=["X-Request-ID"],
)

app.include_router(auth.router)
app.include_router(avisos.router)
app.include_router(equipos.router)
app.include_router(partidos.router)
app.include_router(recintos.router)


@app.exception_handler(PyMongoError)
async def handle_database_error(request, exc: PyMongoError):
    logger.error(
        "database.request.failed",
        extra={
            "event": "database.request.failed",
            "method": request.method,
            "path": request.url.path,
        },
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service is temporarily unavailable"},
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.error(
        "api.request.unhandled_exception",
        extra={
            "event": "api.request.unhandled_exception",
            "method": request.method,
            "path": request.url.path,
        },
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id_context.get(),
        },
        headers={"X-Request-ID": request_id_context.get() or ""},
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