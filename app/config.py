"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ─────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./petster.db"

    # ── Azure AI Vision ──────────────────────────────────────────────────
    azure_vision_endpoint: str = ""
    azure_vision_key: str = ""

    # ── App ──────────────────────────────────────────────────────────────
    app_name: str = "Petster API"
    debug: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
