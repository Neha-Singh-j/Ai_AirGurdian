"""Application configuration via environment variables."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AirGuardian AI"
    APP_VERSION: str = "1.0.0"
    # Default: SQLite for local dev. Switch to PostgreSQL by setting DATABASE_URL only:
    # postgresql+asyncpg://airguardian:airguardian@localhost:5432/airguardian
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/airguardian.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: str = ""
    USE_MOCK_DATA: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    FAISS_INDEX_PATH: str = "data/faiss/policy_index"
    REPORTS_DIR: str = "data/reports"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
