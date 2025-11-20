import logging
import os
from datetime import datetime

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(
            os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "model_training.log"
            )
        ),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("model_training")

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
DATA_DIR = os.path.join(BASE_DIR, "..", "resources", "datasets")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "processed_data")
PREPROCESSOR_PATH = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "credit_scoring_model.joblib")
METRICS_REPORT_PATH = os.path.join(SAVED_MODELS_DIR, "model_evaluation_report.txt")
CONFUSION_MATRIX_PATH = os.path.join(SAVED_MODELS_DIR, "confusion_matrix.png")
FEATURE_IMPORTANCE_PATH = os.path.join(SAVED_MODELS_DIR, "feature_importance.png")

# Ensure directories exist
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)


def load_data():
    """
    Load raw data from CSV files.
    Returns:
        tuple: (borrowers_df, transactions_df) - DataFrames containing borrower and transaction data
    """
    logger.info("Loading raw data...")

    try:
        borrowers_path = os.path.join(DATA_DIR, "borrower_data.csv")
        transactions_path = os.path.join(DATA_DIR, "loan_transactions.csv")

        if not os.path.exists(borrowers_path) or not os.path.exists(transactions_path):
            logger.warning("Data files not found. Creating synthetic data...")
            borrowers_df, transactions_df = create_synthetic_data()
            return borrowers_df, transactions_df

        borrowers_df = pd.read_csv(borrowers_path)
        transactions_df = pd.read_csv(transactions_path)

        # Check if data is placeholder or too small
        if len(borrowers_df) < 100 or "Placeholder" in str(borrowers_df.iloc[0]):
            logger.warning("Data appears to be placeholder. Creating synthetic data...")
            borrowers_df, transactions_df = create_synthetic_data()

        logger.info(
            f"Loaded {len(borrowers_df)} borrower records and {len(transactions_df)} transaction records"
        )
        return borrowers_df, transactions_df

    except Exception as e:
        logger.error(f"Error loading data: {e}")
        logger.info("Creating synthetic data instead...")
        borrowers_df, transactions_df = create_synthetic_data()
        return borrowers_df, transactions_df


def create_synthetic_data(n_borrowers=1000, n_transactions=5000):
    """
    Create synthetic data for model training when real data is unavailable.

    Args:
        n_borrowers (int): Number of borrower records to generate
        n_transactions (int): Number of transaction records to generate

    Returns:
        tuple: (borrowers_df, transactions_df) - DataFrames containing synthetic data
    """
    logger.info(
        f"Generating synthetic data with {n_borrowers} borrowers and {n_transactions} transactions"
    )
    np.random.seed(42)

    # Generate borrower data
    borrower_ids = [f"B{i:06d}" for i in range(1, n_borrowers + 1)]

    borrowers_df = pd.DataFrame(
        {
            "borrower_id": borrower_ids,
            "age": np.random.randint(18, 70, n_borrowers),
            "income": np.random.normal(50000, 20000, n_borrowers).clip(20000, 150000),
            "credit_score": np.random.normal(700, 100, n_borrowers).clip(300, 850),
            "employment_years": np.random.exponential(5, n_borrowers).clip(0, 40),
            "existing_debt": np.random.normal(15000, 10000, n_borrowers).clip(0, None),
            "home_ownership": np.random.choice(
                ["RENT", "OWN", "MORTGAGE"], n_borrowers
            ),
            "education": np.random.choice(
                ["High School", "Bachelor", "Master", "PhD"], n_borrowers
            ),
            "marital_status": np.random.choice(
                ["Single", "Married", "Divorced"], n_borrowers
            ),
            "num_dependents": np.random.randint(0, 5, n_borrowers),
        }
    )

    # Calculate debt-to-income ratio
    borrowers_df["debt_to_income"] = (
        borrowers_df["existing_debt"] / borrowers_df["income"]
    ).clip(0, 1)

    # Generate transaction data
    transaction_ids = [f"T{i:06d}" for i in range(1, n_transactions + 1)]
    borrower_ids_for_transactions = np.random.choice(borrower_ids, n_transactions)

    # Dates between 2020-01-01 and 2023-12-31
    start_date = pd.Timestamp("2020-01-01")
    end_date = pd.Timestamp("2023-12-31")
    days_range = (end_date - start_date).days
    random_days = np.random.randint(0, days_range, n_transactions)
    transaction_dates = [start_date + pd.Timedelta(days=days) for days in random_days]

    # Loan amounts between 1000 and 50000
    loan_amounts = np.random.normal(10000, 8000, n_transactions).clip(1000, 50000)

    # Interest rates between 3% and 25%
    interest_rates = np.random.normal(10, 5, n_transactions).clip(3, 25)

    # Loan terms in months (6, 12, 24, 36, 48, 60)
    loan_terms = np.random.choice([6, 12, 24, 36, 48, 60], n_transactions)

    # Generate default probability based on borrower features
    # Join with borrower data to get features
    temp_df = pd.DataFrame(
        {
            "borrower_id": borrower_ids_for_transactions,
            "loan_amount": loan_amounts,
            "interest_rate": interest_rates,
            "loan_term": loan_terms,
        }
    )

    temp_df = temp_df.merge(borrowers_df, on="borrower_id", how="left")

    # Calculate default probability
    default_prob = (
        -0.1 * (temp_df["income"] / 10000)  # Higher income reduces default risk
        + -0.2
        * (temp_df["credit_score"] / 100)  # Higher credit score reduces default risk
        + 0.15
        * (temp_df["loan_amount"] / 10000)  # Higher loan amount increases default risk
        + -0.1 * temp_df["employment_years"]  # Longer employment reduces default risk
        + 0.3
        * temp_df["debt_to_income"]  # Higher debt-to-income increases default risk
        + 0.1
        * (temp_df["interest_rate"] / 10)  # Higher interest rate increases default risk
        + 0.05 * (temp_df["loan_term"] / 12)  # Longer term increases default risk
    )

    # Normalize and convert to probability
    default_prob = 1 / (1 + np.exp(-default_prob))

    # Generate default labels (0 = repaid, 1 = defaulted)
    default = (np.random.random(n_transactions) < default_prob).astype(int)

    # Create transactions DataFrame
    transactions_df = pd.DataFrame(
        {
            "transaction_id": transaction_ids,
            "borrower_id": borrower_ids_for_transactions,
            "loan_date": transaction_dates,
            "loan_amount": loan_amounts,
            "interest_rate": interest_rates,
            "loan_term": loan_terms,
            "loan_purpose": np.random.choice(
                [
                    "Debt Consolidation",
                    "Home Improvement",
                    "Business",
                    "Education",
                    "Other",
                ],
                n_transactions,
            ),
            "default": default,
        }
    )

    # Save synthetic data
    borrowers_path = os.path.join(DATA_DIR, "borrower_data.csv")
    transactions_path = os.path.join(DATA_DIR, "loan_transactions.csv")

    os.makedirs(os.path.dirname(borrowers_path), exist_ok=True)

    borrowers_df.to_csv(borrowers_path, index=False)
    transactions_df.to_csv(transactions_path, index=False)

    logger.info(f"Synthetic data saved to {borrowers_path} and {transactions_path}")

    return borrowers_df, transactions_df


def feature_engineering(borrowers_df, transactions_df):
    """
    Perform feature engineering by merging borrower and transaction data
    and creating additional features.

    Args:
        borrowers_df (DataFrame): Borrower data
        transactions_df (DataFrame): Transaction data

    Returns:
        DataFrame: Merged dataset with engineered features
    """
    logger.info("Performing feature engineering...")

    try:
        # Merge datasets
        merged_df = transactions_df.merge(borrowers_df, on="borrower_id", how="left")

        # Create additional features

        # Payment to income ratio
        merged_df["payment_to_income"] = (
            merged_df["loan_amount"] / merged_df["loan_term"]
        ) / merged_df["income"]

        # Total loan burden
        merged_df["total_loan_burden"] = (
            merged_df["loan_amount"] + merged_df["existing_debt"]
        )

        # Loan amount to income ratio
        merged_df["loan_to_income"] = merged_df["loan_amount"] / merged_df["income"]

        # Interest burden
        merged_df["interest_burden"] = (
            merged_df["loan_amount"]
            * (merged_df["interest_rate"] / 100)
            * (merged_df["loan_term"] / 12)
        )

        # Age groups
        merged_df["age_group"] = pd.cut(
            merged_df["age"],
            bins=[0, 25, 35, 45, 55, 100],
            labels=["18-25", "26-35", "36-45", "46-55", "56+"],
        )

        # Credit score groups
        merged_df["credit_score_group"] = pd.cut(
            merged_df["credit_score"],
            bins=[300, 580, 670, 740, 800, 850],
            labels=["Poor", "Fair", "Good", "Very Good", "Excellent"],
        )

        # Rename target column for clarity
        merged_df = merged_df.rename(columns={"default": "target"})

        # Drop unnecessary columns
        merged_df = merged_df.drop(["transaction_id", "borrower_id"], axis=1)

        # Convert loan_date to datetime if it's not already
        if not pd.api.types.is_datetime64_any_dtype(merged_df["loan_date"]):
            merged_df["loan_date"] = pd.to_datetime(merged_df["loan_date"])

        # Extract date features
        merged_df["loan_year"] = merged_df["loan_date"].dt.year
        merged_df["loan_month"] = merged_df["loan_date"].dt.month
        merged_df["loan_day_of_week"] = merged_df["loan_date"].dt.dayofweek

        # Drop the original date column
        merged_df = merged_df.drop("loan_date", axis=1)

        logger.info(f"Feature engineering complete. Dataset shape: {merged_df.shape}")

        # Save the engineered dataset
        engineered_data_path = os.path.join(PROCESSED_DATA_DIR, "engineered_data.csv")
        merged_df.to_csv(engineered_data_path, index=False)
        logger.info(f"Engineered data saved to {engineered_data_path}")

        return merged_df

    except Exception as e:
        logger.error(f"Error during feature engineering: {e}")
        return None


def preprocess_data(data_df):
    """
    Preprocess the data for model training.

    Args:
        data_df (DataFrame): Dataset with features and target

    Returns:
        tuple: (X_train, X_test, y_train, y_test, preprocessor) - Preprocessed data and preprocessor object
    """
    logger.info("Preprocessing data...")

    try:
        if data_df is None or data_df.empty:
            logger.error("No data available for preprocessing")
            return None, None, None, None, None

        if "target" not in data_df.columns:
            logger.error("Target column 'target' not found in dataset")
            return None, None, None, None, None

        # Split features and target
        X = data_df.drop("target", axis=1)
        y = data_df["target"]

        # Identify column types
        numeric_features = X.select_dtypes(
            include=["int64", "float64"]
        ).columns.tolist()
        categorical_features = X.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()

        logger.info(f"Numeric features: {numeric_features}")
        logger.info(f"Categorical features: {categorical_features}")

        # Create preprocessing pipelines
        numeric_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )

        categorical_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]
        )

        # Combine preprocessing steps
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, numeric_features),
                ("cat", categorical_transformer, categorical_features),
            ]
        )

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        logger.info(
            f"Training set size: {X_train.shape}, Test set size: {X_test.shape}"
        )

        # Fit and transform the training data
        X_train_processed = preprocessor.fit_transform(X_train)

        # Transform the test data
        X_test_processed = preprocessor.transform(X_test)

        # Save the preprocessor
        joblib.dump(preprocessor, PREPROCESSOR_PATH)
        logger.info(f"Preprocessor saved to {PREPROCESSOR_PATH}")

        # Save feature names for later use
        feature_names = numeric_features + categorical_features
        with open(os.path.join(SAVED_MODELS_DIR, "feature_names.txt"), "w") as f:
            for feature in feature_names:
                f.write(f"{feature}\n")

        return X_train_processed, X_test_processed, y_train, y_test, preprocessor

    except Exception as e:
        logger.error(f"Error during data preprocessing: {e}")
        return None, None, None, None, None


def train_and_evaluate_model(X_train, y_train, X_test, y_test):
    """
    Train multiple models, evaluate them, and select the best one.

    Args:
        X_train: Training features
        y_train: Training target
        X_test: Test features
        y_test: Test target

    Returns:
        tuple: (best_model, all_metrics) - Best model and evaluation metrics for all models
    """
    if X_train is None or y_train is None or X_test is None or y_test is None:
        logger.error("Missing training or testing data. Cannot train model.")
        return None, None

    if X_train.shape[0] == 0 or X_test.shape[0] == 0:
        logger.error("Training or testing data is empty. Cannot train model.")
        return None, None

    logger.info("Starting model training and evaluation...")

    # Define models to try
    models = {
        "LogisticRegression": LogisticRegression(
            solver="liblinear", random_state=42, class_weight="balanced", max_iter=1000
        ),
        "RandomForestClassifier": RandomForestClassifier(
            random_state=42, class_weight="balanced", n_jobs=-1
        ),
        "GradientBoostingClassifier": GradientBoostingClassifier(random_state=42),
    }

    # Hyperparameter grids for GridSearchCV
    param_grids = {
        "LogisticRegression": {"C": [0.01, 0.1, 1, 10], "penalty": ["l1", "l2"]},
        "RandomForestClassifier": {
            "n_estimators": [100, 200],
            "max_depth": [None, 10, 20],
            "min_samples_split": [2, 5],
            "min_samples_leaf": [1, 2, 4],
        },
        "GradientBoostingClassifier": {
            "n_estimators": [100, 200],
            "learning_rate": [0.01, 0.1],
            "max_depth": [3, 5],
        },
    }

    best_model = None
    best_model_name = ""
    best_roc_auc = 0.0
    all_metrics = {}

    for model_name, model in models.items():
        logger.info(f"\n--- Training {model_name} ---")
        try:
            # GridSearchCV for hyperparameter tuning
            if model_name in param_grids:
                logger.info(f"Performing GridSearchCV for {model_name}...")
                # Stratified K-Fold for classification tasks, especially with imbalanced datasets
                cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
                grid_search = GridSearchCV(
                    model,
                    param_grids[model_name],
                    cv=cv_strategy,
                    scoring="roc_auc",
                    n_jobs=-1,
                    verbose=1,
                )
                grid_search.fit(X_train, y_train)
                logger.info(
                    f"Best parameters for {model_name}: {grid_search.best_params_}"
                )
                current_model = grid_search.best_estimator_
            else:
                current_model = model
                current_model.fit(X_train, y_train)

            # Make predictions
            y_pred_train = current_model.predict(X_train)
            y_pred_test = current_model.predict(X_test)
            y_pred_proba_test = current_model.predict_proba(X_test)[
                :, 1
            ]  # Probabilities for ROC AUC

            # Evaluate model
            metrics = {
                "train_accuracy": accuracy_score(y_train, y_pred_train),
                "test_accuracy": accuracy_score(y_test, y_pred_test),
                "precision": precision_score(y_test, y_pred_test, zero_division=0),
                "recall": recall_score(y_test, y_pred_test, zero_division=0),
                "f1_score": f1_score(y_test, y_pred_test, zero_division=0),
                "roc_auc": roc_auc_score(y_test, y_pred_proba_test),
            }
            all_metrics[model_name] = metrics

            logger.info(f"Metrics for {model_name}:")
            for metric, value in metrics.items():
                logger.info(f"  {metric}: {value:.4f}")

            logger.info(f"\nClassification Report for {model_name} on Test Set:")
            logger.info(classification_report(y_test, y_pred_test, zero_division=0))

            cm = confusion_matrix(y_test, y_pred_test)
            logger.info(f"Confusion Matrix for {model_name} on Test Set:")
            logger.info(cm)

            if metrics["roc_auc"] > best_roc_auc:
                best_roc_auc = metrics["roc_auc"]
                best_model = current_model
                best_model_name = model_name

                # Save confusion matrix for the best model
                plt.figure(figsize=(10, 8))
                sns.heatmap(
                    cm,
                    annot=True,
                    fmt="d",
                    cmap="Blues",
                    xticklabels=["Non-Default", "Default"],
                    yticklabels=["Non-Default", "Default"],
                )
                plt.title(f"Confusion Matrix - {best_model_name} (Test Set)")
                plt.xlabel("Predicted Label")
                plt.ylabel("True Label")
                plt.savefig(CONFUSION_MATRIX_PATH)
                plt.close()
                logger.info(f"Confusion matrix plot saved to {CONFUSION_MATRIX_PATH}")

                # Save feature importance if available
                if hasattr(current_model, "feature_importances_"):
                    # Load feature names
                    try:
                        with open(
                            os.path.join(SAVED_MODELS_DIR, "feature_names.txt"), "r"
                        ) as f:
                            feature_names = [line.strip() for line in f.readlines()]

                        # Get feature importances
                        importances = current_model.feature_importances_

                        # If using ColumnTransformer, the feature names might be different
                        # This is a simplified approach; in practice, you'd need to extract the feature names from the preprocessor
                        if len(importances) != len(feature_names):
                            logger.warning(
                                f"Feature importance length ({len(importances)}) doesn't match feature names length ({len(feature_names)})"
                            )
                            feature_indices = range(len(importances))
                            feature_names = [f"Feature {i}" for i in feature_indices]

                        # Sort features by importance
                        indices = np.argsort(importances)[::-1]

                        # Plot feature importance
                        plt.figure(figsize=(12, 8))
                        plt.title(f"Feature Importance - {best_model_name}")
                        plt.bar(
                            range(min(20, len(indices))),
                            importances[indices[:20]],
                            align="center",
                        )
                        plt.xticks(
                            range(min(20, len(indices))),
                            [feature_names[i] for i in indices[:20]],
                            rotation=90,
                        )
                        plt.tight_layout()
                        plt.savefig(FEATURE_IMPORTANCE_PATH)
                        plt.close()
                        logger.info(
                            f"Feature importance plot saved to {FEATURE_IMPORTANCE_PATH}"
                        )
                    except Exception as e:
                        logger.error(f"Error creating feature importance plot: {e}")

        except Exception as e:
            logger.error(f"Error training or evaluating {model_name}: {e}")
            all_metrics[model_name] = {"error": str(e)}
            continue  # Try next model

    if best_model:
        logger.info(
            f"\n--- Best Model: {best_model_name} with ROC AUC: {best_roc_auc:.4f} ---"
        )
        # Save the best model
        joblib.dump(best_model, MODEL_PATH)
        logger.info(f"Best model ({best_model_name}) saved to {MODEL_PATH}")

        # Save model metadata
        model_metadata = {
            "model_name": best_model_name,
            "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "roc_auc": best_roc_auc,
            "metrics": all_metrics[best_model_name],
        }

        with open(os.path.join(SAVED_MODELS_DIR, "model_metadata.txt"), "w") as f:
            for key, value in model_metadata.items():
                f.write(f"{key}: {value}\n")
    else:
        logger.error("\n--- No model was successfully trained or selected as best. ---")

    return best_model, all_metrics


def save_evaluation_report(metrics_dict):
    """
    Save the evaluation metrics to a text file.

    Args:
        metrics_dict (dict): Dictionary containing metrics for each model
    """
    with open(METRICS_REPORT_PATH, "w") as f:
        f.write("=== Model Evaluation Report ===\n\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        for model_name, metrics in metrics_dict.items():
            f.write(f"--- {model_name} ---\n")
            if "error" in metrics:
                f.write(f"  Error: {metrics['error']}\n")
            else:
                for metric_name, value in metrics.items():
                    f.write(f"  {metric_name}: {value:.4f}\n")
            f.write("\n")
    logger.info(f"Model evaluation report saved to {METRICS_REPORT_PATH}")


def main():
    """Main function to run the model training and evaluation pipeline."""
    logger.info("=== Starting Model Training Script ===")

    # Load data
    borrowers_df, transactions_df = load_data()

    if borrowers_df is None or transactions_df is None:
        logger.error("Failed to load data. Model training cannot proceed.")
        return

    # Perform feature engineering
    merged_df = feature_engineering(borrowers_df, transactions_df)

    if merged_df is None:
        logger.error("Feature engineering failed. Model training cannot proceed.")
        return

    # Preprocess data
    X_train, X_test, y_train, y_test, preprocessor = preprocess_data(merged_df)

    if X_train is None:
        logger.error("Data preprocessing failed. Model training cannot proceed.")
        return

    # Train and evaluate models
    best_model, all_metrics = train_and_evaluate_model(X_train, y_train, X_test, y_test)

    if best_model and all_metrics:
        save_evaluation_report(all_metrics)
        logger.info("=== Model Training Script Finished Successfully ===")
    else:
        logger.error("=== Model Training Script Finished With Issues ===")


if __name__ == "__main__":
    main()
