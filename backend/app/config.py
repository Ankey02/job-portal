from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = "dev-secret-change-me-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./jobportal.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Optional: AI feedback through Google Gemini. Leave the key empty to turn it off.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    max_resume_bytes: int = 2 * 1024 * 1024

    # Optional: real emails. Leave smtp_host empty to print emails in the terminal instead.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = ""

    @field_validator("database_url")
    @classmethod
    def fix_postgres_scheme(cls, value: str) -> str:
        # Some hosts give "postgres://..." but SQLAlchemy only accepts "postgresql://..."
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
