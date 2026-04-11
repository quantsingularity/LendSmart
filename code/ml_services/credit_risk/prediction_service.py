import argparse
import json
import os
import sys
from typing import Any

import joblib
import pandas as pd

try:
    from ml_services.credit_risk.src.utils import setup_logging
except ImportError:
    try:
        from src.utils import setup_logging
    except ImportError:
        from utils import setup_logging

logger = setup_logging("prediction_service", "prediction_service.log")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
PREPROCESSOR_PATH = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "credit_scoring_model.joblib")

_model = None
_preprocessor = None


def load_model_and_preprocessor() -> bool:
    """Loads the trained model and preprocessor from disk."""
    global _model, _preprocessor
    model_loaded = False
    preprocessor_loaded = False

    if _model is None:
        if not os.path.exists(MODEL_PATH):
            logger.warning(
                f"Model file not found at {MODEL_PATH}. Service will run in degraded mode."
            )
        else:
            try:
                _model = joblib.load(MODEL_PATH)
                logger.info(f"Model loaded successfully from {MODEL_PATH}")
                model_loaded = True
            except Exception as e:
                logger.error(f"Error loading model: {e}")
    else:
        model_loaded = True

    if _preprocessor is None:
        if not os.path.exists(PREPROCESSOR_PATH):
            logger.warning(
                f"Preprocessor file not found at {PREPROCESSOR_PATH}. Service will run in degraded mode."
            )
        else:
            try:
                _preprocessor = joblib.load(PREPROCESSOR_PATH)
                logger.info(
                    f"Preprocessor loaded successfully from {PREPROCESSOR_PATH}"
                )
                preprocessor_loaded = True
            except Exception as e:
                logger.error(f"Error loading preprocessor: {e}")
    else:
        preprocessor_loaded = True

    return model_loaded and preprocessor_loaded


def predict_credit_score(applicant_data: Any) -> Any:
    """
    Predicts the creditworthiness for a new applicant.
    applicant_data: A dictionary or Pandas DataFrame with applicant features.
    Returns: A dictionary containing the prediction and probability.
    """
    if _model is None or _preprocessor is None:
        if not load_model_and_preprocessor():
            return {
                "error": "Model or preprocessor not loaded. Cannot make predictions.",
                "approved": False,
                "credit_score": 0,
            }

    try:
        if isinstance(applicant_data, dict):
            applicant_df = pd.DataFrame([applicant_data])
        elif isinstance(applicant_data, pd.Series):
            applicant_df = pd.DataFrame([applicant_data.to_dict()])
        elif isinstance(applicant_data, pd.DataFrame):
            applicant_df = applicant_data.copy()
        else:
            return {
                "error": "Invalid input data format. Expected dict, pd.Series, or pd.DataFrame."
            }

        applicant_processed = _preprocessor.transform(applicant_df)
        prediction = _model.predict(applicant_processed)
        probability = _model.predict_proba(applicant_processed)

        predicted_class = int(prediction[0])
        probability_default = float(probability[0][1])
        probability_non_default = float(probability[0][0])

        # Convert ML output to credit score (300-850 range)
        credit_score = int(300 + (probability_non_default * 550))

        return {
            "prediction_label": "High Risk" if predicted_class == 1 else "Low Risk",
            "predicted_class_raw": predicted_class,
            "probability_high_risk": probability_default,
            "probability_low_risk": probability_non_default,
            "credit_score": credit_score,
            "approved": predicted_class == 0 and credit_score >= 580,
            "message": "Prediction successful",
        }
    except Exception as e:
        logger.error(f"Error during prediction: {e}", exc_info=True)
        return {"error": f"Prediction failed: {str(e)}"}


def run_server(host: str = "0.0.0.0", port: int = 8000) -> None:
    """Run the prediction service as an HTTP server using Flask."""
    try:
        from flask import Flask, jsonify, request
    except ImportError:
        logger.error("Flask not installed. Run: pip install flask")
        sys.exit(1)

    app = Flask(__name__)
    load_model_and_preprocessor()

    @app.route("/health", methods=["GET"])
    def health():
        model_ready = _model is not None and _preprocessor is not None
        return (
            jsonify(
                {
                    "status": "healthy" if model_ready else "degraded",
                    "model_loaded": model_ready,
                    "service": "credit-risk-prediction",
                }
            ),
            200,
        )

    @app.route("/predict", methods=["POST"])
    def predict():
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400
        result = predict_credit_score(data)
        status_code = 500 if "error" in result else 200
        return jsonify(result), status_code

    @app.route("/predict/batch", methods=["POST"])
    def predict_batch():
        data = request.get_json()
        if not data or not isinstance(data, list):
            return jsonify({"error": "Expected a JSON array of applicants"}), 400
        results = [predict_credit_score(item) for item in data]
        return jsonify({"results": results, "count": len(results)}), 200

    @app.route("/", methods=["GET"])
    def root():
        return jsonify(
            {
                "service": "LendSmart Credit Risk Prediction",
                "version": "2.0.0",
                "endpoints": {
                    "health": "GET /health",
                    "predict": "POST /predict",
                    "predict_batch": "POST /predict/batch",
                },
            }
        )

    logger.info(f"Starting prediction service on {host}:{port}")
    app.run(host=host, port=port, debug=False)


def main() -> None:
    """Main entry point - supports both CLI and server modes."""
    parser = argparse.ArgumentParser(
        description="LendSmart Credit Risk Prediction Service"
    )
    parser.add_argument("--server", action="store_true", help="Run as HTTP server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Server host")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument(
        "--input_data",
        type=str,
        help="JSON string or path to JSON file for CLI prediction",
    )
    args = parser.parse_args()

    if args.server or (not args.input_data):
        run_server(host=args.host, port=args.port)
        return

    # CLI prediction mode
    logger.info("--- Credit Scoring Prediction Script ---")
    if not load_model_and_preprocessor():
        logger.warning("Model not loaded. Running with degraded functionality.")

    input_str = args.input_data
    applicant_data_dict = None

    if os.path.isfile(input_str):
        try:
            with open(input_str, "r") as f:
                applicant_data_dict = json.load(f)
        except Exception as e:
            logger.error(f"Error reading JSON file {input_str}: {e}")
            return
    else:
        try:
            applicant_data_dict = json.loads(input_str)
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON string: {e}")
            return

    if applicant_data_dict:
        if isinstance(applicant_data_dict, list):
            if len(applicant_data_dict) == 1:
                applicant_data_dict = applicant_data_dict[0]
            else:
                logger.error(
                    "For CLI, provide data for a single applicant, not a list."
                )
                return
        result = predict_credit_score(applicant_data_dict)
        print(json.dumps(result, indent=4))

    logger.info("--- Prediction Script Finished ---")


if __name__ == "__main__":
    main()
