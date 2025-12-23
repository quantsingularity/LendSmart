import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from .utils import setup_logging

logger = setup_logging("loan_risk_model", "risk_assessment.log")


class LoanRiskModel:
    """
    AI Risk Model for LendSmart platform to assess loan risk and provide risk scores.
    Uses machine learning to predict the likelihood of loan default based on various features.
    """

    def __init__(self) -> Any:
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
            "collateral_value",
            "collateral_value_to_loan_ratio",
            "borrower_previous_loans",
            "borrower_previous_defaults",
        ]

    def preprocess_data(self, X: Any) -> Any:
        """
        Preprocess input data for model training or prediction

        Args:
            X (pd.DataFrame): Input features

        Returns:
            pd.DataFrame: Preprocessed features
        """
        X_processed = X.copy()
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
            "collateral_value",
        ]
        for col in required_columns:
            if col not in X_processed.columns:
                if col == "is_collateralized":
                    X_processed[col] = 0
                elif col == "collateral_value":
                    X_processed[col] = 0
                else:
                    X_processed[col] = np.nan
        for col in X_processed.columns:
            if X_processed[col].dtype == "object":
                X_processed[col] = X_processed[col].fillna("unknown")
            else:
                X_processed[col] = X_processed[col].fillna(X_processed[col].median())
        if "is_collateralized" in X_processed.columns:
            X_processed["is_collateralized"] = X_processed["is_collateralized"].astype(
                int
            )
        X_processed["collateral_value_to_loan_ratio"] = (
            X_processed["collateral_value"] / X_processed["loan_amount"]
        )
        X_processed["collateral_value_to_loan_ratio"] = X_processed[
            "collateral_value_to_loan_ratio"
        ].fillna(0)
        return X_processed

    def train(self, X: Any, y: Any) -> Any:
        """
        Train the risk model on historical loan data

        Args:
            X (pd.DataFrame): Features for training
            y (pd.Series): Target variable (1 for default, 0 for repaid)

        Returns:
            self: Trained model instance
        """
        X_processed = self.preprocess_data(X)
        for feature in self.features:
            if feature not in X_processed.columns:
                X_processed[feature] = 0
        X_processed = X_processed[self.features]
        X_train, X_val, y_train, y_val = train_test_split(
            X_processed, y, test_size=0.2, random_state=42
        )
        pipeline = Pipeline(
            [
                ("scaler", StandardScaler()),
                ("classifier", RandomForestClassifier(random_state=42)),
            ]
        )
        param_grid = {
            "classifier__n_estimators": [100, 200],
            "classifier__max_depth": [None, 10, 20],
            "classifier__min_samples_split": [2, 5, 10],
        }
        grid_search = GridSearchCV(
            pipeline, param_grid, cv=5, scoring="roc_auc", n_jobs=-1
        )
        grid_search.fit(X_train, y_train)
        self.model = grid_search.best_estimator_
        y_pred = self.model.predict(X_val)
        y_prob = self.model.predict_proba(X_val)[:, 1]
        logger.info("Model Evaluation on Validation Set:")
        logger.info(classification_report(y_val, y_pred))
        logger.info("Confusion Matrix:")
        logger.info(confusion_matrix(y_val, y_pred))
        logger.info(f"ROC AUC Score: {roc_auc_score(y_val, y_prob):.4f}")
        logger.info(f"Best Parameters: {grid_search.best_params_}")
        return self

    def predict_risk_score(self, loan_data: Any) -> Any:
        """
        Predict risk score for a loan application

        Args:
            loan_data (dict or pd.DataFrame): Loan application data

        Returns:
            float: Risk score between 0 and 100 (higher is better/less risky)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        if isinstance(loan_data, dict):
            loan_data = pd.DataFrame([loan_data])
        prediction_data = pd.DataFrame(index=loan_data.index)
        for feature in self.features:
            if feature in loan_data.columns:
                prediction_data[feature] = loan_data[feature]
            elif (
                feature == "collateral_value_to_loan_ratio"
                and "collateral_value" in loan_data.columns
                and ("loan_amount" in loan_data.columns)
            ):
                prediction_data[feature] = (
                    loan_data["collateral_value"] / loan_data["loan_amount"]
                )
                prediction_data[feature] = prediction_data[feature].fillna(0)
            else:
                prediction_data[feature] = 0
        for col in prediction_data.columns:
            if prediction_data[col].dtype == "object":
                prediction_data[col] = prediction_data[col].fillna("unknown")
            else:
                prediction_data[col] = prediction_data[col].fillna(0)
        if "is_collateralized" in prediction_data.columns:
            prediction_data["is_collateralized"] = prediction_data[
                "is_collateralized"
            ].astype(int)
        prediction_data = prediction_data[self.features]
        not_default_prob = self.model.predict_proba(prediction_data)[0, 0]
        risk_score = int(not_default_prob * 100)
        return risk_score

    def save_model(self, filepath: Any) -> Any:
        """
        Save the trained model to a file

        Args:
            filepath (str): Path to save the model
        """
        if self.model is None:
            raise ValueError("No trained model to save")
        joblib.dump(self.model, filepath)
        logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: Any) -> Any:
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

    def generate_synthetic_training_data(self, n_samples: Any = 1000) -> Any:
        """
        Generate synthetic data for training when real data is not available

        Args:
            n_samples (int): Number of samples to generate

        Returns:
            tuple: (X, y) where X is features DataFrame and y is target Series
        """
        np.random.seed(42)
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
        X = pd.DataFrame(data)
        X["collateral_value"] = 0
        mask = X["is_collateralized"] == 1
        X.loc[mask, "collateral_value"] = X.loc[
            mask, "loan_amount"
        ] * np.random.uniform(1, 2, mask.sum())
        X["collateral_value_to_loan_ratio"] = X["collateral_value"] / X["loan_amount"]
        X["collateral_value_to_loan_ratio"].fillna(0, inplace=True)
        default_prob = (
            0.05
            + 0.1 * (X["loan_amount"] > 30000).astype(int)
            + 0.1 * (X["interest_rate"] > 15).astype(int)
            + 0.2 * (X["borrower_credit_score"] < 600).astype(int)
            + 0.15 * (X["borrower_debt_to_income"] > 0.4).astype(int)
            + 0.1 * (X["borrower_employment_years"] < 1).astype(int)
            + 0.1 * (X["is_collateralized"] == 0).astype(int)
            + 0.2 * (X["borrower_previous_defaults"] > 0).astype(int)
            - 0.1 * (X["collateral_value_to_loan_ratio"] > 1.5).astype(int)
        )
        default_prob = np.clip(default_prob, 0, 0.95)
        y = np.random.binomial(1, default_prob)
        return (X, pd.Series(y))
