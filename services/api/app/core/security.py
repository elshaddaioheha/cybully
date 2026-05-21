from __future__ import annotations

from dataclasses import dataclass

import httpx
from fastapi import Depends, Header, HTTPException, status

from app.core.config import get_settings


@dataclass
class AuthContext:
    auth_mode: str
    user_id: str | None = None
    email: str | None = None


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    if not token:
        return None
    return token


async def _fetch_supabase_user(token: str, apikey: str) -> dict | None:
    settings = get_settings()
    if not settings.supabase_url:
        return None
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": apikey,
            },
        )
    if response.status_code != 200:
        return None
    payload = response.json()
    if not isinstance(payload, dict):
        return None
    return payload


async def require_internal_token(
    x_internal_token: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
    apikey: str | None = Header(default=None),
) -> AuthContext:
    settings = get_settings()
    expected = (settings.backend_internal_token or "").strip()
    if expected and x_internal_token == expected:
        return AuthContext(auth_mode="internal")

    token = _bearer_token(authorization)
    verification_key = settings.auth_key_for_verification or apikey
    if token and verification_key and settings.supabase_url:
        user = await _fetch_supabase_user(token=token, apikey=verification_key)
        if user and user.get("id"):
            return AuthContext(
                auth_mode="supabase",
                user_id=str(user.get("id")),
                email=user.get("email"),
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid API credentials.",
    )


async def require_moderator_token(
    auth: AuthContext = Depends(require_internal_token),
) -> AuthContext:
    if auth.auth_mode == "internal":
        return auth

    settings = get_settings()
    moderator_emails = {email.lower() for email in settings.moderator_emails}
    if auth.email and auth.email.lower() in moderator_emails:
        return auth

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Moderator access required.",
    )
