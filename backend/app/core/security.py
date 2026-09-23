"""
NEW FILE -- password hashing + JWT helpers for the auth feature.

Kept separate from app/core/config.py and the rest of core/ on purpose:
this is the one module that touches secrets and cryptography, so it's the
one place worth reading carefully in a security review.

Password hashing uses bcrypt directly (not passlib) -- passlib's bcrypt
backend has known compatibility warnings with recent bcrypt releases, and
the plain `bcrypt` package's API is only two functions, so there is no
real simplicity trade-off from skipping the extra dependency layer.

JWT uses PyJWT with a single symmetric secret (HS256). This is a
stateless-token design: logout is a client-side "forget the token"
action, not a server-side revocation -- see docs/auth-notes.md in this
update package for why that trade-off was made and what a production
upgrade path (short-lived tokens + refresh tokens, or a revocation list)
would look like.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

BCRYPT_MAX_BYTES = 72  # bcrypt silently ignores bytes beyond this -- enforced via schema max_length instead


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError (or a subclass) on any invalid/expired token --
    callers should catch that broadly rather than inspecting error subtypes."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
