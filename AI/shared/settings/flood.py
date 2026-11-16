from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

AI_ROOT = Path(__file__).resolve().parents[2]


class FloodSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix='FLOOD_', env_file=AI_ROOT / '.env', extra='ignore',
    )

    model_path: Path = AI_ROOT / 'artifacts' / 'best_model.pkl'
    # Limit parallelism per worker; each Uvicorn worker loads its own model.
    model_n_jobs: int = Field(default=1, ge=1)
