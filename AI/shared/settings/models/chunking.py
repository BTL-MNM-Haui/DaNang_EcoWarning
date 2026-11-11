from __future__ import annotations

from shared.base import BaseModel


class ChunkSettings(BaseModel):
    size: int
    overlap: int
