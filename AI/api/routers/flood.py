from fastapi import APIRouter, HTTPException, Request

from AI.api.models.flood import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)
from AI.application.flood_prediction import FloodPredictionService
from AI.domain.flood import FEATURE_NAMES, LABELS, MAX_BATCH_SIZE, MODEL_LIMITATION

router = APIRouter(prefix='/api/v1/flood', tags=['Flood prediction'])


def get_service(request: Request) -> FloodPredictionService:
    service = getattr(request.app.state, 'flood_service', None)
    if service is None:
        raise HTTPException(status_code=503, detail='Flood model is not ready.')
    return service


@router.get('/model')
def model_info(request: Request):
    service = get_service(request)
    return {
        'model_version': service.model.version,
        'algorithm': 'RandomForestClassifier',
        'feature_order': FEATURE_NAMES,
        'labels': LABELS,
        'max_batch_size': MAX_BATCH_SIZE,
        'scope': 'pluvial_flood_susceptibility',
        'limitation': MODEL_LIMITATION,
    }


@router.post('/predict', response_model=PredictionResponse)
def predict(payload: PredictionRequest, request: Request):
    return get_service(request).predict([payload])[0]


@router.post('/predict/batch', response_model=BatchPredictionResponse)
def predict_batch(payload: BatchPredictionRequest, request: Request):
    predictions = get_service(request).predict(payload.points)
    return BatchPredictionResponse(predictions=predictions, count=len(predictions))
