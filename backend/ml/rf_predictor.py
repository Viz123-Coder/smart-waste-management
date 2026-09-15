import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "waste_fill_model.pkl")

_model = None

FEATURES = [
    "NUMBER_OF_HOUSES",
    "RESIDENTS",
    "BIN_CAPACITY_KG",
    "WASTE_GENERATION_KG_DAY",
    "DAYS_SINCE_COLLECTION",
    "RAIN",
    "TEMPERATURE_C",
    "DAY_OF_WEEK",
]


def _get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_fill_level(data: dict) -> dict:
    model = _get_model()

    # Build a single-row DataFrame with the SAME column names/order
    # that train_model.py used - the pipeline's ColumnTransformer
    # requires named columns, and OneHotEncoder handles "Yes"/"No" as-is.
    row = {
        "NUMBER_OF_HOUSES": float(data["NUMBER_OF_HOUSES"]),
        "RESIDENTS": float(data["RESIDENTS"]),
        "BIN_CAPACITY_KG": float(data["BIN_CAPACITY_KG"]),
        "WASTE_GENERATION_KG_DAY": float(data["WASTE_GENERATION_KG_DAY"]),
        "DAYS_SINCE_COLLECTION": float(data["DAYS_SINCE_COLLECTION"]),
        "RAIN": str(data.get("RAIN", "No")),
        "TEMPERATURE_C": float(data["TEMPERATURE_C"]),
        "DAY_OF_WEEK": int(data["DAY_OF_WEEK"]),
    }

    X = pd.DataFrame([row], columns=FEATURES)

    prediction = model.predict(X)[0]
    result = {"fill_level": str(prediction)}

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0]
        classes = model.classes_
        result["confidence"] = {str(cls): round(float(p), 3) for cls, p in zip(classes, proba)}

    return result