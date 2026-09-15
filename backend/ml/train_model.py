import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load dataset
df = pd.read_csv("apartment_bins_ml_dataset.csv")

# Features used by the model
features = [
    "NUMBER_OF_HOUSES",
    "RESIDENTS",
    "BIN_CAPACITY_KG",
    "WASTE_GENERATION_KG_DAY",
    "DAYS_SINCE_COLLECTION",
    "RAIN",
    "TEMPERATURE_C",
    "DAY_OF_WEEK"
]

X = df[features]
y = df["FILL_LEVEL"]

# Convert RAIN text into numbers automatically
preprocessor = ColumnTransformer(
    transformers=[
        ("rain", OneHotEncoder(handle_unknown="ignore"), ["RAIN"])
    ],
    remainder="passthrough"
)

# ML model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Complete pipeline
pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", model)
])

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Train
pipeline.fit(X_train, y_train)

# Test
predictions = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("Model trained successfully!")
print("Accuracy:", round(accuracy * 100, 2), "%")

# Save model
joblib.dump(pipeline, "waste_fill_model.pkl")

print("Model saved as waste_fill_model.pkl")