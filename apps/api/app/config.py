import os
import warnings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://protocols:protocols-dev-password@localhost:5432/protocols"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8081", "http://localhost:19006"]

    # Rate limiting
    rate_limit_default: str = "120/minute"
    rate_limit_auth: str = "10/minute"
    rate_limit_enabled: bool = True

    # AI (Claude API)
    anthropic_api_key: str = ""
    ai_model: str = "claude-sonnet-4-20250514"

    # Weather
    weather_api_base_url: str = "https://api.open-meteo.com/v1/forecast"
    weather_request_timeout_seconds: float = 5.0

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {"env_prefix": "PROTOCOLS_", "env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

_INSECURE_DEFAULTS = {
    "jwt_secret_key": "change-me-in-production",
}


def _check_insecure_defaults() -> None:
    is_production = os.getenv("PROTOCOLS_ENVIRONMENT", "").lower() == "production"
    for field, default_val in _INSECURE_DEFAULTS.items():
        if getattr(settings, field) == default_val:
            msg = f"PROTOCOLS_{field.upper()} is using the insecure default value."
            if is_production:
                raise RuntimeError(msg)
            else:
                warnings.warn(msg, stacklevel=1)


_check_insecure_defaults()
