import hashlib
import warnings
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.exceptions import InconsistentVersionWarning
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.utils.validation import check_is_fitted

from AI.domain.flood import FEATURE_NAMES


class FloodModel:
    def __init__(self, path: Path, n_jobs: int = 1):
        # Only load the deployment artifact, never a path provided in a request.
        with warnings.catch_warnings():
            warnings.simplefilter('error', InconsistentVersionWarning)
            pipeline = joblib.load(path)
        if not isinstance(pipeline, Pipeline):
            raise ValueError('Expected a fitted scikit-learn Pipeline.')
        if [name for name, _ in pipeline.steps] != ['imputer', 'classifier']:
            raise ValueError('Expected imputer -> classifier pipeline.')
        imputer = pipeline.named_steps['imputer']
        classifier = pipeline.named_steps['classifier']
        if not isinstance(imputer, SimpleImputer) or imputer.strategy != 'median':
            raise ValueError('Expected the training median imputer.')
        if not isinstance(classifier, RandomForestClassifier):
            raise ValueError('Expected a RandomForestClassifier.')
        check_is_fitted(imputer)
        check_is_fitted(classifier)
        if pipeline.n_features_in_ != len(FEATURE_NAMES):
            raise ValueError('Model must accept exactly nine features.')
        if not np.array_equal(classifier.classes_, [0, 1]):
            raise ValueError('Expected binary model classes [0, 1].')
        if not np.isfinite(imputer.statistics_).all():
            raise ValueError('Each feature must have a fitted median.')
        pipeline.set_params(classifier__n_jobs=n_jobs)
        self.pipeline = pipeline
        self.version = 'sha256:' + hashlib.sha256(path.read_bytes()).hexdigest()
        self.positive_class_index = list(classifier.classes_).index(1)
        # Smoke-test before making the application ready.
        self.predict([dict(zip(FEATURE_NAMES, imputer.statistics_, strict=True))])

    def predict(self, rows: list[dict]) -> tuple[list[int], list[float], list[list[str]]]:
        # The notebook trained on ndarray: JSON key order must never affect inference.
        matrix = np.asarray(
            [[row[name] for name in FEATURE_NAMES] for row in rows], dtype=np.float64,
        )
        missing = ~np.isfinite(matrix) | (matrix == -9999) | (matrix <= -1e30)
        matrix[missing] = np.nan
        classes = self.pipeline.predict(matrix)
        probabilities = self.pipeline.predict_proba(matrix)[:, self.positive_class_index]
        if not np.isfinite(probabilities).all() or ((probabilities < 0) | (probabilities > 1)).any():
            raise ValueError('Model returned invalid probabilities.')
        imputed = [
            [name for name, is_missing in zip(FEATURE_NAMES, row, strict=True) if is_missing]
            for row in missing
        ]
        return classes.astype(int).tolist(), probabilities.tolist(), imputed
