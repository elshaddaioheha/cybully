from __future__ import annotations

from sqlalchemy.engine import make_url


def async_database_url(raw_url: str) -> str:
    url = make_url(raw_url)
    query = dict(url.query)

    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+asyncpg")

    sslmode = query.pop("sslmode", None)
    if sslmode and "ssl" not in query:
        query["ssl"] = "require" if sslmode in {"require", "verify-ca", "verify-full"} else str(sslmode)

    return url.set(query=query).render_as_string(hide_password=False)


def sync_database_url(raw_url: str) -> str:
    url = make_url(raw_url)
    query = dict(url.query)

    if url.drivername in {"postgresql", "postgresql+asyncpg"}:
        url = url.set(drivername="postgresql+psycopg")

    ssl = query.pop("ssl", None)
    if ssl and "sslmode" not in query:
        query["sslmode"] = "require" if str(ssl).lower() in {"true", "require"} else str(ssl)

    return url.set(query=query).render_as_string(hide_password=False)

