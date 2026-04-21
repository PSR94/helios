from pathlib import Path
from typing import Optional

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


API_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = API_DIR.parents[1]
DEFAULT_METADATA_DB = PROJECT_ROOT / "datasets" / "helios_meta.db"
DEFAULT_ANALYTICS_DB = PROJECT_ROOT / "datasets" / "helios_analytics.duckdb"


class Settings(BaseSettings):
    APP_NAME: str = "HELIOS API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ENABLE_DOCS: bool = True
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1", "testserver"]
    
    # Metadata DB
    DATABASE_URL: str = f"sqlite:///{DEFAULT_METADATA_DB}"
    
    # Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Analytics Engine
    DUCKDB_PATH: str = str(DEFAULT_ANALYTICS_DB)
    
    # Model Provider
    LLM_PROVIDER: str = "openai"
    LLM_API_BASE: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4-turbo-preview"

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        extra="ignore",
    )

    @property
    def project_root(self) -> Path:
        return PROJECT_ROOT

    @property
    def duckdb_path(self) -> Path:
        return Path(self.DUCKDB_PATH).expanduser().resolve()

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @field_validator("ALLOWED_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_csv_list(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.is_production:
            if "*" in self.ALLOWED_ORIGINS:
                raise ValueError("Wildcard CORS origins are not allowed in production.")
            if "*" in self.ALLOWED_HOSTS:
                raise ValueError("Wildcard hosts are not allowed in production.")
        return self

settings = Settings()
