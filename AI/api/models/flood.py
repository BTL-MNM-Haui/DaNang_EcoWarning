from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from AI.domain.flood import MAX_BATCH_SIZE

FeatureValue = Annotated[
    float, Field(strict=True, allow_inf_nan=False, le=3.4028234663852886e38),
] | None


class FloodFeatures(BaseModel):
    """Every key is required. Explicit null or GIS NoData means imputation."""

    model_config = ConfigDict(extra='forbid')

    X: FeatureValue
    Y: FeatureValue
    Slope: FeatureValue
    Curvature: FeatureValue
    Aspect: FeatureValue
    TWI: FeatureValue
    FA: FeatureValue
    Drainage: FeatureValue
    Rainfall: FeatureValue

    @model_validator(mode='after')
    def reject_empty_point(self):
        values = self.model_dump().values()
        if all(v is None or v == -9999 or v <= -1e30 for v in values):
            raise ValueError('At least one feature must contain a usable value.')
        return self


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    point_id: str | None = Field(default=None, max_length=128)
    features: FloodFeatures


class BatchPredictionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    points: list[PredictionRequest] = Field(min_length=1, max_length=MAX_BATCH_SIZE)


class PredictionResponse(BaseModel):
    point_id: str | None
    prediction: Literal[0, 1]
    label: Literal['No_Flood', 'Flood']
    flood_probability: float = Field(ge=0, le=1)
    imputed_features: list[str]
    model_version: str
    scope: Literal['pluvial_flood_susceptibility'] = 'pluvial_flood_susceptibility'


class BatchPredictionResponse(BaseModel):
    predictions: list[PredictionResponse]
    count: int
