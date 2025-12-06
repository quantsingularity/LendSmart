import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from core.logging import get_logger

logger = get_logger(__name__)


class LoanRiskModel:
    """
    AI Risk Model for LendSmart platform to assess loan risk and provide risk scores.
    Uses machine learning to predict the likelihood of loan default based on various features.
    """

    def __init__(self):
        """Initialize the risk model with default parameters"""
        self.model = None
        self.features = [
            "loan_amount",
            "interest_rate",
            "term_days",
            "borrower_credit_score",
            "borrower_income",
            "borrower_debt_to_income",
            "borrower_employment_years",
            "is_collateralized",
            "collateral_value",  # Explicitly include collateral_value
            "collateral_value_to_loan_ratio",
            "borrower_previous_loans",
            "borrower_previous_defaults",
        ]

    def preprocess_data(self, X):
        """
        Preprocess input data for model training or prediction

        Args:
            X (pd.DataFrame): Input features

        Returns:
            pd.DataFrame: Preprocessed features
        """
        # Create a copy to avoid modifying the original data
        X_processed = X.copy()

        # Ensure all required columns exist
        required_columns = [
            "loan_amount",
            "interest_rate",
            "term_days",
            "borrower_credit_score",
            "borrower_income",
            "borrower_debt_to_income",
            "borrower_employment_years",
            "is_collateralized",
            "borrower_previous_loans",
            "borrower_previous_defaults",
            "collateral_value",  # Ensure this is always present
        ]

        # Add missing columns with default values
        for col in required_columns:
            if col not in X_processed.columns:
                if col == "is_collateralized":
                    X_processed[col] = 0
                elif col == "collateral_value":
                    X_processed[col] = 0
                else:
                    X_processed[col] = np.nan

        # Handle missing values
        for col in X_processed.columns:
            if X_processed[col].dtype == "object":
                X_processed[col] = X_processed[col].fillna("unknown")
            else:
                X_processed[col] = X_processed[col].fillna(X_processed[col].median())

        # Convert boolean to int
        if "is_collateralized" in X_processed.columns:
            X_processed["is_collateralized"] = X_processed["is_collateralized"].astype(
                int
            )

        # Calculate collateral ratio
        X_processed["collateral_value_to_loan_ratio"] = (
            X_processed["collateral_value"] / X_processed["loan_amount"]
        )
        X_processed["collateral_value_to_loan_ratio"] = X_processed[
            "collateral_value_to_loan_ratio"
        ].fillna(0)

        return X_processed

    def train(self, X, y):
        """
        Train the risk model on historical loan data

        Args:
            X (pd.DataFrame): Features for training
            y (pd.Series): Target variable (1 for default, 0 for repaid)

        Returns:
            self: Trained model instance
        """
        # Preprocess the data
        X_processed = self.preprocess_data(X)

        # Ensure all features are present and in the correct order
        for feature in self.features:
            if feature not in X_processed.columns:
                X_processed[feature] = 0

        # Reorder columns to match self.features exactly
        X_processed = X_processed[self.features]

        # Split data into training and validation sets
        X_train, X_val, y_train, y_val = train_test_split(
            X_processed, y, test_size=0.2, random_state=42
        )

        # Create a pipeline with preprocessing and model
        pipeline = Pipeline(
            [
                ("scaler", StandardScaler()),
                ("classifier", RandomForestClassifier(random_state=42)),
            ]
        )

        # Define hyperparameters for grid search
        param_grid = {
            "classifier__n_estimators": [100, 200],
            "classifier__max_depth": [None, 10, 20],
            "classifier__min_samples_split": [2, 5, 10],
        }

        # Perform grid search to find best hyperparameters
        grid_search = GridSearchCV(
            pipeline, param_grid, cv=5, scoring="roc_auc", n_jobs=-1
        )
        grid_search.fit(X_train, y_train)

        # Get the best model
        self.model = grid_search.best_estimator_

        # Evaluate on validation set
        y_pred = self.model.predict(X_val)
        y_prob = self.model.predict_proba(X_val)[:, 1]

        # Print evaluation metrics
        logger.info("Model Evaluation on Validation Set:")
        logger.info(classification_report(y_val, y_pred))
        logger.info("Confusion Matrix:")
        logger.info(confusion_matrix(y_val, y_pred))
        logger.info(f"ROC AUC Score: {roc_auc_score(y_val, y_prob):.4f}")
        logger.info(f"Best Parameters: {grid_search.best_params_}")
        return self

    def predict_risk_score(self, loan_data):
        """
        Predict risk score for a loan application

        Args:
            loan_data (dict or pd.DataFrame): Loan application data

        Returns:
            float: Risk score between 0 and 100 (higher is better/less risky)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        # Convert dict to DataFrame if needed
        if isinstance(loan_data, dict):
            loan_data = pd.DataFrame([loan_data])

        # Create a DataFrame with exactly the features needed in the exact order
        # This ensures feature name consistency between training and prediction
        prediction_data = pd.DataFrame(index=loan_data.index)

        # Add each feature from the model's feature list
        for feature in self.features:
            if feature in loan_data.columns:
                prediction_data[feature] = loan_data[feature]
            elif (
                feature == "collateral_value_to_loan_ratio"
                and "collateral_value" in loan_data.columns
                and "loan_amount" in loan_data.columns
            ):
                prediction_data[feature] = (
                    loan_data["collateral_value"] / loan_data["loan_amount"]
                )
                prediction_data[feature] = prediction_data[feature].fillna(0)
            else:
                # Default values for missing features
                prediction_data[feature] = 0

        # Handle missing values
        for col in prediction_data.columns:
            if prediction_data[col].dtype == "object":
                prediction_data[col] = prediction_data[col].fillna("unknown")
            else:
                prediction_data[col] = prediction_data[col].fillna(0)

        # Convert boolean to int if needed
        if "is_collateralized" in prediction_data.columns:
            prediction_data["is_collateralized"] = prediction_data[
                "is_collateralized"
            ].astype(int)

        # Ensure columns are in the exact same order as self.features
        prediction_data = prediction_data[self.features]

        # Predict probability of not defaulting
        not_default_prob = self.model.predict_proba(prediction_data)[0, 0]

        # Convert to a 0-100 score (higher is better)
        risk_score = int(not_default_prob * 100)

        return risk_score

    def save_model(self, filepath):
        """
        Save the trained model to a file

        Args:
            filepath (str): Path to save the model
        """
        if self.model is None:
            raise ValueError("No trained model to save")

        joblib.dump(self.model, filepath)
        logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """
        Load a trained model from a file

        Args:
            filepath (str): Path to the saved model

        Returns:
            self: Model instance with loaded model
        """
        self.model = joblib.load(filepath)
        logger.info(f"Model loaded from {filepath}")
        return self

    def generate_synthetic_training_data(self, n_samples=1000):
        """
        Generate synthetic data for training when real data is not available

        Args:
            n_samples (int): Number of samples to generate

        Returns:
            tuple: (X, y) where X is features DataFrame and y is target Series
        """
        np.random.seed(42)

        # Generate synthetic features
        data = {
            "loan_amount": np.random.uniform(1000, 50000, n_samples),
            "interest_rate": np.random.uniform(1, 20, n_samples),
            "term_days": np.random.choice([30, 60, 90, 180, 365, 730], n_samples),
            "borrower_credit_score": np.random.normal(650, 100, n_samples),
            "borrower_income": np.random.lognormal(10, 1, n_samples),
            "borrower_debt_to_income": np.random.uniform(0, 0.6, n_samples),
            "borrower_employment_years": np.random.exponential(5, n_samples),
            "is_collateralized": np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
            "borrower_previous_loans": np.random.poisson(2, n_samples),
            "borrower_previous_defaults": np.random.poisson(0.5, n_samples),
        }

        # Create DataFrame
        X = pd.DataFrame(data)

        # Add collateral value for collateralized loans
        X["collateral_value"] = 0
        mask = X["is_collateralized"] == 1
        X.loc[mask, "collateral_value"] = X.loc[
            mask, "loan_amount"
        ] * np.random.uniform(1, 2, mask.sum())

        # Calculate collateral to loan ratio
        X["collateral_value_to_loan_ratio"] = X["collateral_value"] / X["loan_amount"]
        X["collateral_value_to_loan_ratio"].fillna(0, inplace=True)

        # Generate target variable based on features
        # Higher probability of default if:
        # - High loan amount
        # - High interest rate
        # - Low credit score
        # - High debt-to-income ratio
        # - Low employment years
        # - Not collateralized
        # - Previous defaults

        # Calculate default probability
        default_prob = (
            0.05  # base rate
            + 0.1 * (X["loan_amount"] > 30000).astype(int)
            + 0.1 * (X["interest_rate"] > 15).astype(int)
            + 0.2 * (X["borrower_credit_score"] < 600).astype(int)
            + 0.15 * (X["borrower_debt_to_income"] > 0.4).astype(int)
            + 0.1 * (X["borrower_employment_years"] < 1).astype(int)
            + 0.1 * (X["is_collateralized"] == 0).astype(int)
            + 0.2 * (X["borrower_previous_defaults"] > 0).astype(int)
            - 0.1 * (X["collateral_value_to_loan_ratio"] > 1.5).astype(int)
        )

        # Clip probabilities to [0, 0.95]
        default_prob = np.clip(default_prob, 0, 0.95)

        # Generate binary outcome
        y = np.random.binomial(1, default_prob)

        return X, pd.Series(y)
