"""Read-only model diagnostics and provenance-checked notebook snapshots."""
import hashlib
import json
from pathlib import Path

from AI.domain.flood import FEATURE_NAMES

REPORT_ROOT = Path(__file__).resolve().parents[1] / 'artifacts/evaluation'
METHOD_IDS = ('gini', 'permutation', 'ablation', 'shap')


def notebook_report(root=REPORT_ROOT):
    report = json.loads((root / 'report.json').read_text(encoding='utf-8'))
    if report.get('schema_version') != 1 or report.get('model_binding') != 'not_verified':
        raise ValueError('Unsupported notebook report.')
    if [m['id'] for m in report['methods']] != list(METHOD_IDS):
        raise ValueError('Invalid report methods.')
    notebook = Path(__file__).resolve().parents[1] / 'notebooks/notebook-mnm.ipynb'
    content = json.loads(notebook.read_text(encoding='utf-8'))
    digest = hashlib.sha256(json.dumps(content, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    if digest != report['notebook_sha256']:
        raise ValueError('Notebook changed after export.')
    return report


def evaluation(model):
    classifier = model.pipeline.named_steps['classifier']
    rows = [{'feature': name, 'importance': float(value)} for name, value in
            zip(FEATURE_NAMES, classifier.feature_importances_, strict=True)]
    try:
        report = {'status': 'available', **notebook_report()}
    except (OSError, ValueError, KeyError, TypeError):
        report = {'status': 'unavailable', 'reason': 'Notebook report missing or out of date.'}
    return {
        'model_version': model.version, 'validated_for_da_nang': False,
        'global_importance': {'method': 'gini', 'scope': 'serving_model_global',
                              'values': rows, 'normalization': 'sum_to_one_or_zero'},
        'notebook_report': report,
    }


def notebook_chart(chart_id, root=REPORT_ROOT):
    if chart_id not in METHOD_IDS:
        raise KeyError(chart_id)
    report = notebook_report(root)
    method = next(m for m in report['methods'] if m['id'] == chart_id)
    data = (root / f'{chart_id}.png').read_bytes()
    if not data.startswith(b'\x89PNG\r\n\x1a\n') or hashlib.sha256(data).hexdigest() != method['image_sha256']:
        raise ValueError('Notebook chart integrity failed.')
    return data
