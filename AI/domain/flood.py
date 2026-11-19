"""Feature contract recovered from notebook-mnm.ipynb and its dataset."""

FEATURE_NAMES = (
    'X', 'Y', 'Slope', 'Curvature', 'Aspect', 'TWI', 'FA', 'Drainage', 'Rainfall',
)
LABELS = {0: 'No_Flood', 1: 'Flood'}
MAX_BATCH_SIZE = 1000
MODEL_LIMITATION = (
    'Experimental susceptibility model; not validated for Da Nang. '
    'Training CRS, feature units and rainfall accumulation period must be '
    'confirmed before operational use. This is not a time-specific flood forecast.'
)
