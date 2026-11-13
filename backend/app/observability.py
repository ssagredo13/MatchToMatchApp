import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone


request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)

_LOG_FIELDS = (
    "event",
    "method",
    "path",
    "status_code",
    "duration_ms",
    "entity_type",
    "entity_id",
)


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_context.get(),
        }
        for field in _LOG_FIELDS:
            value = getattr(record, field, None)
            if value is not None:
                entry[field] = value
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False, default=str)


def configure_logging() -> None:
    root_logger = logging.getLogger()
    if not any(getattr(handler, "_match_to_match_json", False) for handler in root_logger.handlers):
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonLogFormatter())
        handler._match_to_match_json = True
        root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
