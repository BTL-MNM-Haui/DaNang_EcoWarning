from __future__ import annotations

__all__ = ['Settings']


def __getattr__(name):
    # Keep the legacy indexing settings available without importing their
    # dependencies or loading their .env file when the flood API starts.
    if name == 'Settings':
        from .settings import Settings
        return Settings
    raise AttributeError(name)
