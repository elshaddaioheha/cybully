import pytest
from fastapi import HTTPException

from app.core import security
from app.core.config import get_settings
from app.core.security import AuthContext


@pytest.mark.anyio
async def test_require_moderator_token_allows_configured_email(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "moderator_emails", ["admin@example.com"])
    auth = AuthContext(auth_mode="supabase", user_id="user-1", email="ADMIN@example.com")

    assert await security.require_moderator_token(auth) is auth


@pytest.mark.anyio
async def test_require_moderator_token_rejects_normal_user(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "moderator_emails", ["admin@example.com"])
    auth = AuthContext(auth_mode="supabase", user_id="user-1", email="user@example.com")

    with pytest.raises(HTTPException) as exc_info:
        await security.require_moderator_token(auth)

    assert exc_info.value.status_code == 403


@pytest.mark.anyio
async def test_require_moderator_token_allows_internal_token() -> None:
    auth = AuthContext(auth_mode="internal")

    assert await security.require_moderator_token(auth) is auth
