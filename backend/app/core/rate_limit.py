"""
A deliberately tiny, dependency-free rate limiter.

Why not a library (e.g. slowapi): the project brief calls for "rate
limiting where appropriate" for a single-process academic prototype
that must have zero required paid/external dependencies. A fixed-window
counter per client IP, held in memory, is easy to read start-to-finish in
a viva and is more than sufficient at this scale. It intentionally does
NOT try to be distributed/multi-worker-safe -- see docs/limitations.md.
"""
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings

WINDOW_SECONDS = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        bucket = self._hits[client_ip]

        while bucket and now - bucket[0] > WINDOW_SECONDS:
            bucket.popleft()

        if len(bucket) >= settings.RATE_LIMIT_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down and try again shortly."},
            )

        bucket.append(now)
        return await call_next(request)
