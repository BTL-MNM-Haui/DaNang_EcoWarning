import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# `python -m server` runs from AI/, while application imports use the AI package.
if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from AI.api.routers.flood import router
from AI.application.flood_prediction import FloodPredictionService
from AI.infra.flood_model import FloodModel
from AI.shared.settings.flood import FloodSettings

logger = logging.getLogger(__name__)


def create_app(settings: FloodSettings | None = None) -> FastAPI:
    settings = settings or FloodSettings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Fail startup for an absent/corrupt/incompatible model; never return fake predictions.
        app.state.flood_service = FloodPredictionService(
            FloodModel(settings.model_path, settings.model_n_jobs),
        )
        logger.info('Loaded flood model %s', app.state.flood_service.model.version)
        try:
            yield
        finally:
            app.state.flood_service = None

    app = FastAPI(
        title='Da Nang EcoWarning — Flood AI', version='1.0.0', lifespan=lifespan,
        description='Internal BE API for experimental pluvial flood susceptibility.',
    )
    app.include_router(router)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError):
        # Do not echo raw input: NaN/Infinity in invalid JSON cannot be serialized
        # by JSONResponse, and an error should not become a server failure.
        return JSONResponse(status_code=422, content={
            'detail': [
                {key: error[key] for key in ('type', 'loc', 'msg')}
                for error in exc.errors()
            ],
        })

    @app.get('/health/live', tags=['Health'])
    def liveness():
        return {'status': 'ok'}

    @app.get('/health/ready', tags=['Health'])
    def readiness(request: Request):
        service = getattr(request.app.state, 'flood_service', None)
        if service is None:
            raise HTTPException(status_code=503, detail='Flood model is not ready.')
        return {'status': 'ready', 'model_version': service.model.version}

    @app.exception_handler(Exception)
    async def internal_error(request: Request, exc: Exception):
        logger.error('Flood API failed: %s', request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={'detail': 'Prediction failed. Please contact the service operator.'},
        )

    return app


app = create_app()


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='127.0.0.1', port=8000)
