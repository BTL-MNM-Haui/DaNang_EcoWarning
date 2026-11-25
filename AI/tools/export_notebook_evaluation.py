"""Export existing executed notebook figures without executing or retraining it.

These charts belong to the notebook's refitted validation pipeline, not a
cryptographically identified deployment artifact. Preserve that distinction.
"""
import base64
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METHODS = {
    'gini': ('gini_report =', 'Gini Importance'),
    'permutation': ('permutation_report =', 'Permutation Importance'),
    'ablation': ('ablation_report =', 'Ablation Importance'),
    'shap': ('shap_report =', 'Mean Absolute SHAP'),
}


def export(notebook_path=ROOT / 'notebooks/notebook-mnm.ipynb', out=ROOT / 'artifacts/evaluation'):
    raw = notebook_path.read_bytes()
    notebook = json.loads(raw)
    methods = []
    images = {}
    for key, (marker, title) in METHODS.items():
        cells = [c for c in notebook['cells'] if marker in ''.join(c.get('source', []))]
        if len(cells) != 1:
            raise ValueError(f'Expected exactly one executed {key} cell.')
        cell = cells[0]
        figures = [o['data']['image/png'] for o in cell.get('outputs', []) if 'image/png' in o.get('data', {})]
        if len(figures) != 1:
            raise ValueError(f'Expected exactly one saved {key} PNG.')
        image = base64.b64decode(''.join(figures[0]), validate=False)
        if not image.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError('Invalid PNG output.')
        images[key] = image
        methods.append({
            'id': key, 'title': title, 'raw_values_available': False,
            'image_sha256': hashlib.sha256(image).hexdigest(),
            'cell_id': cell.get('id'), 'execution_count': cell.get('execution_count'),
        })
    # Fail rather than silently describing a different score conversion.
    sources = '\n'.join(''.join(c.get('source', [])) for c in notebook['cells'])
    if 'scores = 90 + 5 * (ranks - 0.5) / len(raw_values)' not in sources:
        raise ValueError('Notebook score conversion changed; review report semantics.')
    report = {
        'schema_version': 1, 'source_notebook': 'AI/notebooks/notebook-mnm.ipynb',
        'notebook_sha256': hashlib.sha256(json.dumps(notebook, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest(),
        'notebook_hash_algorithm': 'sha256_canonical_json',
        'model_binding': 'not_verified', 'scope': 'notebook_validation_refit',
        'converted_score': {'range': [90, 95], 'meaning': 'rank_score_not_accuracy',
                            'formula': '90 + 5 * (rank - 0.5) / feature_count'},
        'methods': methods,
    }
    out.mkdir(parents=True, exist_ok=True)
    for key, image in images.items():
        (out / f'{key}.png').write_bytes(image)
    (out / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    report = export()
    print(f'Exported {len(report["methods"])} notebook figures; model association remains unverified.')
