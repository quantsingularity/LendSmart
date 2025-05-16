import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
from sklearn.pipeline import Pipeline # Not strictly needed here if preprocessor is separate
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "processed_data") # If preprocessed data was saved
PREPROCESSOR_PATH = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "credit_scoring_model.joblib")
METRICS_REPORT_PATH = os.path.join(SAVED_MODELS_DIR, "model_evaluation_report.txt")
CONFUSION_MATRIX_PATH = os.path.join(SAVED_MODELS_DIR, "confusion_matrix.png")

# Ensure saved_models directory exists
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

# --- Data Loading --- (Assuming data_preprocessing.py was run and preprocessor saved)
# For training, we need the output of data_preprocessing.py
# This script will assume that X_train_processed, X_test_processed, y_train, y_test
# are available. For a standalone script, you might load them from saved files
# or re-run parts of preprocessing if needed.

# Placeholder function to simulate loading preprocessed data
# In a real pipeline, this would load from files or be passed from the previous step.
def load_preprocessed_data(X_train_path=None, X_test_path=None, y_train_path=None, y_test_path=None):
    """
    Loads preprocessed data. 
    This is a placeholder. In a real pipeline, you would load data saved by data_preprocessing.py
    or ensure that data_preprocessing.py returns these values to be used here.
    For this example, we will call the preprocessing script and get the data.
    """
    print("Attempting to load or generate preprocessed data...")
    try:
        # This is a simplified way to integrate; ideally, data_preprocessing.py
        # would be a module you import and call, or it saves data to disk that you load here.
        from data_preprocessing import main as run_preprocessing
        from data_preprocessing import load_data, feature_engineering, preprocess_data
        
        borrowers, transactions = load_data()
        if borrowers is None or transactions is None or borrowers.empty or transactions.empty:
            print("Failed to load raw data in model_training.py. Exiting.")
            return None, None, None, None, None

        merged_df = feature_engineering(borrowers, transactions)
        if merged_df is None or merged_df.empty or "target" not in merged_df.columns:
            print("Feature engineering failed or target is missing in model_training.py. Exiting.")
            return None, None, None, None, None

        X_train_p, X_test_p, y_train_data, y_test_data, preprocessor = preprocess_data(merged_df)
        
        if X_train_p is None: # Check if preprocessing failed
            print("Data preprocessing failed during the call from model_training.py. Exiting.")
            return None, None, None, None, None

        print("Preprocessed data obtained successfully.")
        # Ensure consistent types (e.g. numpy array for X, pandas Series for y)
        if isinstance(X_train_p, pd.DataFrame):
            X_train_p = X_train_p.values
        if isinstance(X_test_p, pd.DataFrame):
            X_test_p = X_test_p.values
        if not isinstance(y_train_data, pd.Series):
            y_train_data = pd.Series(y_train_data)
        if not isinstance(y_test_data, pd.Series):
            y_test_data = pd.Series(y_test_data)
            
        return X_train_p, X_test_p, y_train_data, y_test_data, preprocessor

    except ImportError:
        print("Error: data_preprocessing.py not found or cannot be imported.")
        print("Please ensure data_preprocessing.py is in the same directory or accessible.")
        return None, None, None, None, None
    except Exception as e:
        print(f"An error occurred while trying to get preprocessed data: {e}")
        return None, None, None, None, None

def train_and_evaluate_model(X_train, y_train, X_test, y_test):
    """Trains a model, evaluates it, and returns the best model and its metrics."""
    if X_train is None or y_train is None or X_test is None or y_test is None:
        print("Missing training or testing data. Cannot train model.")
        return None, None
    
    if X_train.shape[0] == 0 or X_test.shape[0] == 0:
        print("Training or testing data is empty. Cannot train model.")
        return None, None

    print("Starting model training and evaluation...")
    
    # Define models to try
    # Using simple models for demonstration. Hyperparameters can be tuned with GridSearchCV.
    models = {
        "LogisticRegression": LogisticRegression(solver=\"liblinear\", random_state=42, class_weight=\"balanced\"),
        "RandomForestClassifier": RandomForestClassifier(random_state=42, class_weight=\"balanced\"),
        # "GradientBoostingClassifier": GradientBoostingClassifier(random_state=42) # Can be slow without tuning
    }

    # Hyperparameter grids for GridSearchCV (example for Logistic Regression)
    param_grids = {
        "LogisticRegression": {
            "C": [0.01, 0.1, 1, 10],
            "penalty": ["l1", "l2"]
        },
        "RandomForestClassifier": {
            "n_estimators": [50, 100],
            "max_depth": [None, 10, 20],
            "min_samples_split": [2, 5]
        }
    }

    best_model = None
    best_model_name = ""
    best_roc_auc = 0.0
    all_metrics = {}

    for model_name, model in models.items():
        print(f"\n--- Training {model_name} ---")
        try:
            # GridSearchCV for hyperparameter tuning
            if model_name in param_grids:
                print(f"Performing GridSearchCV for {model_name}...")
                # Stratified K-Fold for classification tasks, especially with imbalanced datasets
                cv_strategy = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
                grid_search = GridSearchCV(model, param_grids[model_name], cv=cv_strategy, scoring="roc_auc", n_jobs=-1, verbose=1)
                grid_search.fit(X_train, y_train)
                print(f"Best parameters for {model_name}: {grid_search.best_params_}")
                current_model = grid_search.best_estimator_
            else:
                current_model = model
                current_model.fit(X_train, y_train)

            # Make predictions
            y_pred_train = current_model.predict(X_train)
            y_pred_test = current_model.predict(X_test)
            y_pred_proba_test = current_model.predict_proba(X_test)[:, 1] # Probabilities for ROC AUC

            # Evaluate model
            metrics = {
                "train_accuracy": accuracy_score(y_train, y_pred_train),
                "test_accuracy": accuracy_score(y_test, y_pred_test),
                "precision": precision_score(y_test, y_pred_test, zero_division=0),
                "recall": recall_score(y_test, y_pred_test, zero_division=0),
                "f1_score": f1_score(y_test, y_pred_test, zero_division=0),
                "roc_auc": roc_auc_score(y_test, y_pred_proba_test)
            }
            all_metrics[model_name] = metrics

            print(f"Metrics for {model_name}:")
            for metric, value in metrics.items():
                print(f"  {metric}: {value:.4f}")
            
            print(f"\nClassification Report for {model_name} on Test Set:")
            print(classification_report(y_test, y_pred_test, zero_division=0))
            
            cm = confusion_matrix(y_test, y_pred_test)
            print(f"Confusion Matrix for {model_name} on Test Set:")
            print(cm)

            if metrics["roc_auc"] > best_roc_auc:
                best_roc_auc = metrics["roc_auc"]
                best_model = current_model
                best_model_name = model_name
                # Save confusion matrix for the best model so far
                plt.figure(figsize=(8, 6))
                sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["Non-Default", "Default"], yticklabels=["Non-Default", "Default"])
                plt.title(f"Confusion Matrix - {best_model_name} (Test Set)")
                plt.xlabel("Predicted Label")
                plt.ylabel("True Label")
                plt.savefig(CONFUSION_MATRIX_PATH)
                plt.close()
                print(f"Confusion matrix plot saved to {CONFUSION_MATRIX_PATH}")

        except Exception as e:
            print(f"Error training or evaluating {model_name}: {e}")
            if "Only one class present in y_true. ROC AUC score is not defined in that case." in str(e):
                print("Skipping ROC AUC due to single class in y_true during a fold or split.")
                # Fallback or alternative metric might be needed if this happens consistently.
            all_metrics[model_name] = {"error": str(e)}
            continue # Try next model

    if best_model:
        print(f"\n--- Best Model: {best_model_name} with ROC AUC: {best_roc_auc:.4f} ---")
        # Save the best model
        joblib.dump(best_model, MODEL_PATH)
        print(f"Best model ({best_model_name}) saved to {MODEL_PATH}")
    else:
        print("\n--- No model was successfully trained or selected as best. ---")

    return best_model, all_metrics

def save_evaluation_report(metrics_dict):
    """Saves the evaluation metrics to a text file."""
    with open(METRICS_REPORT_PATH, "w") as f:
        f.write("=== Model Evaluation Report ===\n\n")
        for model_name, metrics in metrics_dict.items():
            f.write(f"--- {model_name} ---\n")
            if "error" in metrics:
                f.write(f"  Error: {metrics["error"]}\n")
            else:
                for metric_name, value in metrics.items():
                    f.write(f"  {metric_name}: {value:.4f}\n")
            f.write("\n")
    print(f"Model evaluation report saved to {METRICS_REPORT_PATH}")

def main():
    """Main function to run the model training and evaluation pipeline."""
    print("--- Starting Model Training Script ---")
    
    # Load preprocessed data
    # This is a simplified way to get data from the preprocessing step.
    # In a more robust pipeline, data_preprocessing.py might save files that this script loads,
    # or they could be part of a larger orchestrator (like Airflow, Kubeflow Pipelines, or a simple Python script).
    X_train, X_test, y_train, y_test, preprocessor = load_preprocessed_data()

    if X_train is None or X_test is None or y_train is None or y_test is None:
        print("Failed to load preprocessed data. Model training cannot proceed.")
        # Try to load preprocessor separately if it exists, as predict.py might need it
        if os.path.exists(PREPROCESSOR_PATH):
            print(f"Preprocessor found at {PREPROCESSOR_PATH}, it might still be usable by predict.py.")
        else:
            print(f"Preprocessor not found at {PREPROCESSOR_PATH}. predict.py might fail.")
        return

    if not preprocessor:
        print("Warning: Preprocessor object was not loaded/returned. Predictions might fail if it_s needed.")
        # Attempt to load if exists
        if os.path.exists(PREPROCESSOR_PATH):
            try:
                preprocessor = joblib.load(PREPROCESSOR_PATH)
                print(f"Successfully loaded preprocessor from {PREPROCESSOR_PATH}")
            except Exception as e:
                print(f"Failed to load preprocessor from {PREPROCESSOR_PATH}: {e}")
        else:
            print(f"Preprocessor file not found at {PREPROCESSOR_PATH}")

    # Train and evaluate model(s)
    best_model, all_metrics = train_and_evaluate_model(X_train, y_train, X_test, y_test)

    if best_model and all_metrics:
        save_evaluation_report(all_metrics)
        print("--- Model Training Script Finished Successfully ---")
    else:
        print("--- Model Training Script Finished With Issues (No best model selected or metrics missing) ---")

if __name__ == "__main__":
    main()

