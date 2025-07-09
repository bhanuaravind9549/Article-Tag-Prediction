from flask import Flask, request, jsonify
import pandas as pd
import joblib, json
from flask_cors import CORS
from utils.text_cleaning import preprocess_text
from utils.prediction import predict_tags

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Load model and vectorizer
model = joblib.load("model/model.pkl")
vectorizer = joblib.load("model/tfidf_vectorizer.pkl")
with open("model/target_cols.json", "r") as f:
    TARGET_COLS = json.load(f)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Backend running"})

@app.route("/predict", methods=["POST"])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    try:
        df = pd.read_csv(file)
        if 'ABSTRACT' not in df.columns:
            return jsonify({"error": "CSV must contain an 'ABSTRACT' column"}), 400

        df['cleaned'] = df['ABSTRACT'].apply(preprocess_text)
        df['Predicted_Tags'] = predict_tags(df['cleaned'], model, vectorizer, TARGET_COLS)

        return jsonify(df[['ABSTRACT', 'Predicted_Tags']].to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
