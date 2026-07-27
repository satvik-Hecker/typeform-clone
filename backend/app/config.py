from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central app config, overridable via environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./typeform.db"
    # Comma-separated list of allowed origins for the frontend. The deployed Vercel origin is
    # baked in here as a default so CORS works even if the CORS_ORIGINS env var isn't set on
    # the host — an explicit env var still overrides this entirely (see cors_origin_list below).
    cors_origins: str = "http://localhost:3000,https://typeform-clone-liard.vercel.app"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
