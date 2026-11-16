import copy
import json

import joblib
import numpy as np
import pytest
from fastapi.testclient import TestClient
from sklearn.dummy import DummyClassifier

from AI.domain.flood import FEATURE_NAMES, MAX_BATCH_SIZE
from AI.server import create_app
from AI.shared.settings.flood import FloodSettings

PREDICT = '/api/v1/flood/predict'


def test_health_and_metadata(client):
    assert client.get('/health/live').status_code == 200
    ready = client.get('/health/ready')
    assert ready.status_code == 200
    info = client.get('/api/v1/flood/model').json()
    assert info['feature_order'] == list(FEATURE_NAMES)
    assert info['model_version'] == ready.json()['model_version']
    assert info['labels'] == {'0': 'No_Flood', '1': 'Flood'}


def test_matches_original_pipeline(client, point):
    model = joblib.load(FloodSettings().model_path)
    model.set_params(classifier__n_jobs=1)
    features = np.array([[point['features'][key] for key in FEATURE_NAMES]])
    response = client.post(PREDICT, json=point)
    assert response.status_code == 200
    data = response.json()
    assert data['prediction'] == int(model.predict(features)[0])
    assert data['flood_probability'] == pytest.approx(model.predict_proba(features)[0, 1])
    assert data['prediction'] == 1  # Dataset label: Very_High -> binary Flood.
    assert data['label'] == 'Flood'
    assert data['point_id'] == point['point_id']
    assert data['imputed_features'] == []


def test_no_flood_example(client):
    from pathlib import Path

    example = Path(__file__).resolve().parents[2] / 'examples' / 'no_flood.json'
    response = client.post(PREDICT, json=json.loads(example.read_text()))
    assert response.status_code == 200
    assert response.json()['prediction'] == 0
    assert response.json()['label'] == 'No_Flood'


def test_json_key_order_does_not_change_prediction(client, point):
    original = client.post(PREDICT, json=point).json()
    point['features'] = dict(reversed(list(point['features'].items())))
    assert client.post(PREDICT, json=point).json() == original


def test_batch_matches_individual_and_preserves_order(client, point):
    other = copy.deepcopy(point)
    other['point_id'] = 'missing-rainfall'
    other['features']['Rainfall'] = None
    points = [point, other]
    result = client.post(PREDICT + '/batch', json={'points': points})
    assert result.status_code == 200
    assert result.json()['count'] == 2
    assert result.json()['predictions'] == [client.post(PREDICT, json=p).json() for p in points]


@pytest.mark.parametrize('missing_value', [None, -9999, -3.4028234663852886e38])
def test_nodata_uses_fitted_training_median(client, point, missing_value):
    point['features']['Rainfall'] = missing_value
    actual = client.post(PREDICT, json=point)
    assert actual.status_code == 200
    assert actual.json()['imputed_features'] == ['Rainfall']
    fitted = joblib.load(FloodSettings().model_path)
    point['features']['Rainfall'] = float(fitted.named_steps['imputer'].statistics_[-1])
    expected = client.post(PREDICT, json=point).json()
    assert actual.json()['flood_probability'] == expected['flood_probability']
    assert actual.json()['prediction'] == expected['prediction']


@pytest.mark.parametrize('value', ['100', True, [], {}, 1e100])
def test_rejects_non_numeric_features(client, point, value):
    point['features']['Rainfall'] = value
    assert client.post(PREDICT, json=point).status_code == 422


@pytest.mark.parametrize('token', ['NaN', 'Infinity', '-Infinity'])
def test_rejects_non_finite_json(client, point, token):
    # Send raw JSON because HTTPX correctly refuses to encode non-finite floats.
    raw = json.dumps(point).replace('101.51561643835623', token)
    assert client.post(PREDICT, content=raw, headers={'Content-Type': 'application/json'}).status_code == 422


def test_rejects_missing_or_unknown_feature(client, point):
    point['features'].pop('Rainfall')
    assert client.post(PREDICT, json=point).status_code == 422
    point['features']['rainfall'] = 100
    assert client.post(PREDICT, json=point).status_code == 422


def test_rejects_unknown_request_field(client, point):
    point['model_path'] = '/tmp/other.pkl'
    assert client.post(PREDICT, json=point).status_code == 422


@pytest.mark.parametrize('value', [None, -9999, -1e35])
def test_rejects_point_without_any_valid_feature(client, point, value):
    point['features'] = dict.fromkeys(FEATURE_NAMES, value)
    assert client.post(PREDICT, json=point).status_code == 422


@pytest.mark.parametrize('size', [0, MAX_BATCH_SIZE + 1])
def test_batch_size_limit(client, point, size):
    assert client.post(PREDICT + '/batch', json={'points': [point] * size}).status_code == 422


def test_unavailable_service_is_not_a_negative_prediction(client, point):
    service = client.app.state.flood_service
    client.app.state.flood_service = None
    try:
        assert client.get('/health/ready').status_code == 503
        assert client.post(PREDICT, json=point).status_code == 503
    finally:
        client.app.state.flood_service = service


def test_missing_model_fails_startup(tmp_path):
    with pytest.raises(FileNotFoundError):
        with TestClient(create_app(FloodSettings(model_path=tmp_path / 'missing.pkl'))):
            pass


def test_corrupt_model_fails_startup(tmp_path):
    path = tmp_path / 'corrupt.pkl'
    path.write_bytes(b'not a model')
    with pytest.raises(Exception):
        with TestClient(create_app(FloodSettings(model_path=path))):
            pass


def test_wrong_model_fails_startup(tmp_path):
    path = tmp_path / 'wrong.pkl'
    joblib.dump(DummyClassifier().fit([[1], [2]], [0, 1]), path)
    with pytest.raises(ValueError, match='Pipeline'):
        with TestClient(create_app(FloodSettings(model_path=path))):
            pass


def test_internal_failure_does_not_leak_details(client, point, monkeypatch):
    def fail(points):
        raise RuntimeError('private file path /tmp/secret.pkl')

    monkeypatch.setattr(client.app.state.flood_service, 'predict', fail)
    error_client = TestClient(client.app, raise_server_exceptions=False)
    response = error_client.post(PREDICT, json=point)
    assert response.status_code == 500
    assert 'secret' not in response.text
