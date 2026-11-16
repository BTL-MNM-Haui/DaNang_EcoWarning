import pytest
from fastapi.testclient import TestClient

from AI.server import create_app


@pytest.fixture(scope='session')
def client():
    with TestClient(create_app()) as client:
        yield client


@pytest.fixture
def point():
    # First data row from Pluvial_Flood_Dataset.xlsx, not a Da Nang observation.
    return {
        'point_id': 'dataset-row-2',
        'features': {
            'X': 3.90944444444444, 'Y': 7.44305555555555,
            'Slope': 46.6861419677734, 'Curvature': -3888000000,
            'Aspect': 45, 'TWI': -3.25036787986755, 'FA': 147,
            'Drainage': 228.8528, 'Rainfall': 101.51561643835623,
        },
    }
