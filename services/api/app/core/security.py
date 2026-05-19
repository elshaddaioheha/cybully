from __future__ import annotations

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    expected = get_settings().backend_internal_token
    if not expected or x_internal_token == expected:
        return
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid internal API token.",
    )

