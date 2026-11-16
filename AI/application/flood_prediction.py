from AI.api.models.flood import PredictionRequest, PredictionResponse
from AI.domain.flood import LABELS
from AI.infra.flood_model import FloodModel


class FloodPredictionService:
    def __init__(self, model: FloodModel):
        self.model = model

    def predict(self, points: list[PredictionRequest]) -> list[PredictionResponse]:
        # Build one matrix and call the pipeline once for the entire batch.
        classes, probabilities, missing = self.model.predict(
            [point.features.model_dump() for point in points],
        )
        return [
            PredictionResponse(
                point_id=point.point_id,
                prediction=prediction,
                label=LABELS[prediction],
                flood_probability=probability,
                imputed_features=imputed,
                model_version=self.model.version,
            )
            for point, prediction, probability, imputed in zip(
                points, classes, probabilities, missing, strict=True,
            )
        ]
