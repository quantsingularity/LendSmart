import argparse
import json
import os
import joblib
import pandas as pd
from core.logging import get_logger

logger = get_logger(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
PREPROCESSOR_PATH = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "credit_scoring_model.joblib")
_model = None
_preprocessor = None


def load_model_and_preprocessor() -> Any:
    """Loads the trained model and preprocessor from disk."""
    global _model, _preprocessor
    model_loaded = False
    preprocessor_loaded = False
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            logger.info(f"Error: Model file not found at {MODEL_PATH}")
        else:
            try:
                _model = joblib.load(MODEL_PATH)
                logger.info(f"Model loaded successfully from {MODEL_PATH}")
                model_loaded = True
            except Exception as e:
                logger.info(f"Error loading model: {e}")
    else:
        model_loaded = True
    if _preprocessor is None:
        if not os.path.exists(PREPROCESSOR_PATH):
            logger.info(f"Error: Preprocessor file not found at {PREPROCESSOR_PATH}")
        else:
            try:
                _preprocessor = joblib.load(PREPROCESSOR_PATH)
                logger.info(
                    f"Preprocessor loaded successfully from {PREPROCESSOR_PATH}"
                )
                preprocessor_loaded = True
            except Exception as e:
                logger.info(f"Error loading preprocessor: {e}")
    else:
        preprocessor_loaded = True
    return model_loaded and preprocessor_loaded


def predict_credit_score(applicant_data: Any) -> Any:
    """
    Predicts the creditworthiness for a new applicant.
    applicant_data: A dictionary or Pandas DataFrame row with applicant features.
                    The structure should match the input expected by the preprocessor.
    Returns: A dictionary containing the prediction and probability.
    """
    if _model is None or _preprocessor is None:
        if not load_model_and_preprocessor():
            return {
                "error": "Model or preprocessor not loaded. Cannot make predictions."
            }
    try:
        if isinstance(applicant_data, dict):
            applicant_df = pd.DataFrame([applicant_data])
        elif isinstance(applicant_data, pd.Series):
            applicant_df = pd.DataFrame(applicant_data).T
        elif isinstance(applicant_data, pd.DataFrame):
            applicant_df = applicant_data
        else:
            return {
                "error": "Invalid input data format. Expected dict, pd.Series, or pd.DataFrame."
            }
        logger.info(f"Original applicant data:\n{applicant_df}")
        applicant_processed = _preprocessor.transform(applicant_df)
        logger.info(f"Processed applicant data shape: {applicant_processed.shape}")
        prediction = _model.predict(applicant_processed)
        probability = _model.predict_proba(applicant_processed)
        predicted_class = int(prediction[0])
        probability_default = float(probability[0][1])
        probability_non_default = float(probability[0][0])
        return {
            "prediction_label": "High Risk" if predicted_class == 1 else "Low Risk",
            "predicted_class_raw": predicted_class,
            "probability_high_risk": probability_default,
            "probability_low_risk": probability_non_default,
            "message": "Prediction successful",
        }
    except Exception as e:
        logger.info(f"Error during prediction: {e}")
        import traceback

        traceback.print_exc()
        return {"error": f"Prediction failed: {str(e)}"}


def main() -> Any:
    """Main function for command-line interface to make predictions."""
    parser = argparse.ArgumentParser(
        description="Predict creditworthiness for an applicant."
    )
    parser.add_argument(
        "--input_data",
        type=str,
        required=False,
        help="JSON string or path to a JSON file containing applicant data.",
    )
    args = parser.parse_args()
    logger.info("--- Credit Scoring Prediction Script ---")
    if not load_model_and_preprocessor():
        logger.info("Exiting due to failure in loading model or preprocessor.")
        return
    if args.input_data:
        input_str = args.input_data
        applicant_data_dict = None
        if os.path.isfile(input_str):
            try:
                with open(input_str, "r") as f:
                    applicant_data_dict = json.load(f)
                logger.info(f"Loaded applicant data from file: {input_str}")
            except Exception as e:
                logger.info(f"Error reading JSON file {input_str}: {e}")
                return
        else:
            try:
                applicant_data_dict = json.loads(input_str)
                logger.info("Loaded applicant data from JSON string.")
            except json.JSONDecodeError as e:
                logger.info(f"Error decoding JSON string: {e}")
                logger.info(
                    "Please provide a valid JSON string or a path to a JSON file."
                )
                return
        if applicant_data_dict:
            if isinstance(applicant_data_dict, list):
                if len(applicant_data_dict) == 1:
                    applicant_data_dict = applicant_data_dict[0]
                else:
                    logger.info(
                        "Error: For CLI, please provide data for a single applicant, not a list."
                    )
                    return
            result = predict_credit_score(applicant_data_dict)
            logger.info("\nPrediction Result:")
            logger.info(json.dumps(result, indent=4))
        else:
            logger.info("No applicant data provided or failed to parse.")
    else:
        logger.info("\nNo input data provided. Running with an example...")
        example_applicant = {
            "annual_income": 60000,
            "total_debt": 15000,
            "credit_history_length_months": 120,
            "num_open_credit_lines": 5,
            "employment_length_years": 5,
            "loan_purpose_category": "debt_consolidation",
        }
        logger.info(
            f"Example Applicant Data:\n{json.dumps(example_applicant, indent=2)}"
        )
        logger.info(
            "\nNote: The example prediction below might fail if the dummy data fields do not perfectly match the features the model was trained on."
        )
        logger.info(
            "You should provide actual data via --input_data for a meaningful prediction."
        )
        result = predict_credit_score(example_applicant)
        logger.info("\nExample Prediction Result:")
        logger.info(json.dumps(result, indent=4))
    logger.info("\n--- Prediction Script Finished ---")


if __name__ == "__main__":
    main()
