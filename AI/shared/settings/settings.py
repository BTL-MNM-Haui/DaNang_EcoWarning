from __future__ import annotations

from dotenv import find_dotenv
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

from .models.chunking import ChunkSettings
from .models.embedding import EmbSettings
from .models.qdrant import QdantSettings

load_dotenv(find_dotenv('.env'), override=True)


class Settings(BaseSettings):
    """Application settings loaded from environment variables or a .env file."""

    chunking: ChunkSettings
    embedding: EmbSettings
    qdrant: QdantSettings

    class Config:
        """Configuration for loading environment variables."""

        env_nested_delimiter = '__'
