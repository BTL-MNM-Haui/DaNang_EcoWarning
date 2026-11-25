import hashlib
import json

import joblib
import numpy as np
import pytest

from AI.domain.flood import FEATURE_NAMES
from AI.infra.flood_evaluation import notebook_chart, notebook_report, METHOD_IDS
from AI.shared.settings.flood import FloodSettings
from AI.tools.export_notebook_evaluation import export


def test_importance_is_from_deployed_artifact_not_converted_rank(client):
    data = client.get('/api/v1/flood/evaluation').json()
    fitted = joblib.load(FloodSettings().model_path)
    rows = data['global_importance']['values']
    assert [r['feature'] for r in rows] == list(FEATURE_NAMES)
    np.testing.assert_allclose([r['importance'] for r in rows], fitted.named_steps['classifier'].feature_importances_)
    assert sum(r['importance'] for r in rows) == pytest.approx(1)
    assert data['model_version'] == client.get('/api/v1/flood/model').json()['model_version']
    assert data['validated_for_da_nang'] is False


def test_snapshot_provenance_and_images(client):
    report = client.get('/api/v1/flood/evaluation').json()['notebook_report']
    assert report['status'] == 'available'
    assert report['model_binding'] == 'not_verified'
    assert report['converted_score']['meaning'] == 'rank_score_not_accuracy'
    for method in report['methods']:
        r = client.get('/api/v1/flood/evaluation/charts/' + method['id'])
        assert r.status_code == 200
        assert r.headers['content-type'] == 'image/png'
        assert hashlib.sha256(r.content).hexdigest() == method['image_sha256']
        assert method['raw_values_available'] is False
    assert client.get('/api/v1/flood/evaluation/charts/unknown').status_code == 404


def test_export_is_reproducible_and_never_executes_notebook(tmp_path):
    report = export(out=tmp_path)
    assert report == notebook_report()
    for key in METHOD_IDS:
        assert (tmp_path / f'{key}.png').read_bytes() == notebook_chart(key)


def test_corrupt_snapshot_is_not_served(tmp_path):
    export(out=tmp_path)
    (tmp_path / 'shap.png').write_bytes(b'not an image')
    with pytest.raises(ValueError):
        notebook_chart('shap', tmp_path)
    with pytest.raises(KeyError):
        notebook_chart('../metadata', tmp_path)
    data = json.loads((tmp_path / 'report.json').read_text())
    data['notebook_sha256'] = 'different'
    (tmp_path / 'report.json').write_text(json.dumps(data))
    with pytest.raises(ValueError):
        notebook_report(tmp_path)


def test_evaluation_does_not_change_prediction(client, point):
    before = client.post('/api/v1/flood/predict', json=point).json()
    client.get('/api/v1/flood/evaluation')
    assert client.post('/api/v1/flood/predict', json=point).json() == before


def test_missing_report_is_explicit_without_breaking_inference(client, point, monkeypatch):
    import AI.infra.flood_evaluation as reports
    def unavailable(*args):
        raise ValueError('report out of date')
    monkeypatch.setattr(reports, 'notebook_report', unavailable)
    data = client.get('/api/v1/flood/evaluation').json()
    assert data['notebook_report']['status'] == 'unavailable'
    assert len(data['global_importance']['values']) == 9
    assert client.get('/api/v1/flood/evaluation/charts/gini').status_code == 503
    assert client.post('/api/v1/flood/predict', json=point).status_code == 200
