import pandas as pd
import numpy as np
import joblib
import os
import json
import argparse

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
PREPROCESSOR_PATH = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "credit_scoring_model.joblib")

# Global cache for model and preprocessor to avoid reloading on every call in a server context
_model = None
_preprocessor = None

def load_model_and_preprocessor():
    """Loads the trained model and preprocessor from disk."""
    global _model, _preprocessor
    model_loaded = False
    preprocessor_loaded = False

    if _model is None:
        if not os.path.exists(MODEL_PATH):
            print(f"Error: Model file not found at {MODEL_PATH}")
        else:
            try:
                _model = joblib.load(MODEL_PATH)
                print(f"Model loaded successfully from {MODEL_PATH}")
                model_loaded = True
            except Exception as e:
                print(f"Error loading model: {e}")
    else:
        model_loaded = True # Already in cache

    if _preprocessor is None:
        if not os.path.exists(PREPROCESSOR_PATH):
            print(f"Error: Preprocessor file not found at {PREPROCESSOR_PATH}")
        else:
            try:
                _preprocessor = joblib.load(PREPROCESSOR_PATH)
                print(f"Preprocessor loaded successfully from {PREPROCESSOR_PATH}")
                preprocessor_loaded = True
            except Exception as e:
                print(f"Error loading preprocessor: {e}")
    else:
        preprocessor_loaded = True # Already in cache
        
    return model_loaded and preprocessor_loaded

def predict_credit_score(applicant_data):
    """
    Predicts the creditworthiness for a new applicant.
    applicant_data: A dictionary or Pandas DataFrame row with applicant features.
                    The structure should match the input expected by the preprocessor.
    Returns: A dictionary containing the prediction and probability.
    """
    if _model is None or _preprocessor is None:
        if not load_model_and_preprocessor():
            return {"error": "Model or preprocessor not loaded. Cannot make predictions."}

    try:
        # Convert input data to DataFrame
        if isinstance(applicant_data, dict):
            applicant_df = pd.DataFrame([applicant_data])
        elif isinstance(applicant_data, pd.Series):
            applicant_df = pd.DataFrame(applicant_data).T
        elif isinstance(applicant_data, pd.DataFrame):
            applicant_df = applicant_data
        else:
            return {"error": "Invalid input data format. Expected dict, pd.Series, or pd.DataFrame."}

        print(f"Original applicant data:\n{applicant_df}")

        # Preprocess the applicant data
        # Ensure the columns in applicant_df match what the preprocessor was trained on.
        # The preprocessor expects specific column names for numerical and categorical features.
        # If applicant_df is missing columns the preprocessor expects, it will fail.
        # If it has extra columns, they might be dropped or passed through depending on `remainder` setting.
        
        # It_s crucial that the `applicant_df` has the same columns (and order, ideally, though
        # ColumnTransformer handles order if names are consistent) as the X_features DataFrame
        # used to fit the preprocessor in `data_preprocessing.py`.
        
        # Example: Extracting feature names from preprocessor if possible
        # This is complex because the preprocessor might have been fitted on a DataFrame
        # with many columns. The input `applicant_data` must provide all of them.
        # For simplicity, we assume `applicant_df` is already structured correctly.

        applicant_processed = _preprocessor.transform(applicant_df)
        print(f"Processed applicant data shape: {applicant_processed.shape}")

        # Make prediction
        prediction = _model.predict(applicant_processed)
        probability = _model.predict_proba(applicant_processed)

        # Assuming binary classification (0: Good, 1: Bad/Default)
        # The interpretation of 0 and 1 depends on how the target was encoded.
        # Let_s assume 1 means higher risk / default.
        predicted_class = int(prediction[0])
        probability_default = float(probability[0][1]) # Probability of class 1
        probability_non_default = float(probability[0][0]) # Probability of class 0

        return {
            "prediction_label": "High Risk" if predicted_class == 1 else "Low Risk",
            "predicted_class_raw": predicted_class,
            "probability_high_risk": probability_default,
            "probability_low_risk": probability_non_default,
            "message": "Prediction successful"
        }

    except Exception as e:
        print(f"Error during prediction: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Prediction failed: {str(e)}"}

def main():
    """Main function for command-line interface to make predictions."""
    parser = argparse.ArgumentParser(description="Predict creditworthiness for an applicant.")
    parser.add_argument("--input_data", type=str, required=False,
                        help="JSON string or path to a JSON file containing applicant data.")
    
    args = parser.parse_args()

    print("--- Credit Scoring Prediction Script ---")

    if not load_model_and_preprocessor():
        print("Exiting due to failure in loading model or preprocessor.")
        return

    if args.input_data:
        input_str = args.input_data
        applicant_data_dict = None
        if os.path.isfile(input_str):
            try:
                with open(input_str, "r") as f:
                    applicant_data_dict = json.load(f)
                print(f"Loaded applicant data from file: {input_str}")
            except Exception as e:
                print(f"Error reading JSON file {input_str}: {e}")
                return
        else:
            try:
                applicant_data_dict = json.loads(input_str)
                print("Loaded applicant data from JSON string.")
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON string: {e}")
                print("Please provide a valid JSON string or a path to a JSON file.")
                return
        
        if applicant_data_dict:
            # Ensure the dict is a single record, not a list of records for this CLI example
            if isinstance(applicant_data_dict, list):
                if len(applicant_data_dict) == 1:
                    applicant_data_dict = applicant_data_dict[0]
                else:
                    print("Error: For CLI, please provide data for a single applicant, not a list.")
                    return
            
            result = predict_credit_score(applicant_data_dict)
            print("\nPrediction Result:")
            print(json.dumps(result, indent=4))
        else:
            print("No applicant data provided or failed to parse.")

    else:
        # Example usage with dummy data if no input is provided
        print("\nNo input data provided. Running with an example...")
        # IMPORTANT: This dummy data MUST have the same features/columns 
        # that the preprocessor was trained on in data_preprocessing.py.
        # The actual column names depend on your `borrower_data.csv` and `feature_engineering` steps.
        # Let_s assume some common features for demonstration.
        # You MUST replace these with actual feature names from your `X_features.columns` in `preprocess_data`.
        example_applicant = {
            "annual_income": 60000,
            "total_debt": 15000,
            "credit_history_length_months": 120,
            "num_open_credit_lines": 5,
            "employment_length_years": 5,
            "loan_purpose_category": "debt_consolidation", # Example categorical feature
            # Add ALL other features the model expects, including those from transaction aggregation if any
            # e.g., from transaction_summary in feature_engineering:
            # "loan_amount_sum": 50000, 
            # "loan_amount_mean": 10000,
            # "loan_amount_count": 5,
            # "interest_rate_mean": 0.07,
            # "defaulted_sum": 0,
            # "defaulted_mean": 0.0
        }
        print(f"Example Applicant Data:\n{json.dumps(example_applicant, indent=2)}")
        
        # To make this example runnable, we need to know the *exact* features the preprocessor expects.
        # This is a common failure point if not handled carefully.
        # For now, this example will likely fail unless `example_applicant` perfectly matches the schema.
        print("\nNote: The example prediction below might fail if the dummy data fields do not perfectly match the features the model was trained on.") 
        print("You should provide actual data via --input_data for a meaningful prediction.")
        result = predict_credit_score(example_applicant)
        print("\nExample Prediction Result:")
        print(json.dumps(result, indent=4))

    print("\n--- Prediction Script Finished ---")

if __name__ == "__main__":
    main()

