from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def _ancestor_chain(path: Path) -> tuple[Path, ...]:
    return (path, *path.parents)


def _find_api_root(config_file: Path) -> Path:
    for candidate in _ancestor_chain(config_file.parent):
        if (candidate / "pyproject.toml").is_file() and (candidate / "app").is_dir():
            return candidate
    if len(config_file.parents) >= 3:
        return config_file.parents[2]
    return config_file.parent


def _find_repo_root(api_root: Path) -> Path:
    for candidate in _ancestor_chain(api_root.parent):
        if (candidate / ".git").exists():
            return candidate
        if (
            (candidate / "package.json").is_file()
            and (candidate / "apps").is_dir()
            and (candidate / "services").is_dir()
        ):
            return candidate
    return api_root


def default_env_files() -> tuple[str, ...]:
    config_file = Path(__file__).resolve()
    api_root = _find_api_root(config_file)
    repo_root = _find_repo_root(api_root)

    candidates = (
        repo_root / ".env",
        repo_root / ".env.local",
        api_root / ".env",
        api_root / ".env.local",
    )
    deduplicated: list[str] = []
    seen: set[str] = set()
    for path in candidates:
        path_str = str(path)
        if path_str in seen:
            continue
        seen.add(path_str)
        deduplicated.append(path_str)
    return tuple(deduplicated)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=default_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    allowed_cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    backend_internal_token: str = "dev-internal-token"
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_secret_key: str | None = None

    database_url: str = "postgresql+asyncpg://cybully:cybully@localhost:5432/cybully"
    rabbitmq_url: str = "amqp://cybully:cybully@localhost:5672/"
    pipeline_mode: str = "queue"
    scorer_provider: str = "auto"

    inference_task_queue: str = "inference_task_queue"
    persistence_queue: str = "persistence_queue"
    alert_dispatch_queue: str = "alert_dispatch_queue"

    detoxify_model_name: str = "unbiased"
    model_inference_device: str = "cpu"

    risk_threshold_medium: float = 0.4
    risk_threshold_high: float = 0.7
    risk_weight_intent: float = 0.25
    risk_weight_repetition: float = 0.25
    risk_weight_aggression: float = 0.5
    repetition_window_hours: int = 48
    repetition_decay: float = 0.7

    admin_notification_email: str = "moderation@example.com"

    @field_validator("allowed_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("pipeline_mode")
    @classmethod
    def validate_pipeline_mode(cls, value: str) -> str:
        if value not in {"queue", "direct"}:
            raise ValueError("pipeline_mode must be queue or direct")
        return value

    @field_validator("scorer_provider")
    @classmethod
    def validate_scorer_provider(cls, value: str) -> str:
        if value not in {"auto", "heuristic", "detoxify"}:
            raise ValueError("scorer_provider must be auto, heuristic, or detoxify")
        return value

    @property
    def auth_key_for_verification(self) -> str | None:
        return self.supabase_publishable_key or self.supabase_secret_key

    @property
    def risk_weight_total(self) -> float:
        return self.risk_weight_intent + self.risk_weight_repetition + self.risk_weight_aggression


@lru_cache
def get_settings() -> Settings:
    return Settings()
