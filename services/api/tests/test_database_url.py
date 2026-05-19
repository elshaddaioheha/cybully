from app.core.database_url import async_database_url, sync_database_url


def test_async_database_url_accepts_supabase_sslmode() -> None:
    result = async_database_url(
        "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require"
    )

    assert result.startswith("postgresql+asyncpg://")
    assert "ssl=require" in result
    assert "sslmode" not in result


def test_sync_database_url_uses_psycopg_and_sslmode() -> None:
    result = sync_database_url(
        "postgresql+asyncpg://postgres:secret@db.example.supabase.co:5432/postgres?ssl=require"
    )

    assert result.startswith("postgresql+psycopg://")
    assert "sslmode=require" in result
    assert "ssl=require" not in result

