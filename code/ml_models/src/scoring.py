"""
Alternative Data Scoring Module for LendSmart

This module provides scoring algorithms and models for alternative data sources
to enhance traditional credit scoring with non-traditional data points.
"""

import logging
import os
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import MinMaxScaler, StandardScaler

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("alternative_data_scoring")


class AlternativeDataScorer:
    """
    Base class for scoring alternative data

    Provides common functionality for all alternative data scoring algorithms
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the scorer with configuration

        Args:
            config: Configuration dictionary for the scorer
        """
        self.config = config or {}
        self.name = self.__class__.__name__
        self.model_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models"
        )
        os.makedirs(self.model_dir, exist_ok=True)

    def preprocess_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess features for scoring

        Args:
            data: DataFrame with features

        Returns:
            Preprocessed DataFrame
        """
        # Default implementation - override in subclasses
        return data

    def score(self, data: pd.DataFrame) -> float:
        """
        Calculate score from alternative data

        Args:
            data: DataFrame with alternative data features

        Returns:
            Score value (typically 0-100, higher is better)
        """
        # Default implementation - override in subclasses
        raise NotImplementedError("Subclasses must implement score method")

    def save_model(self, filepath: str) -> None:
        """
        Save the scoring model to a file

        Args:
            filepath: Path to save the model
        """
        # Default implementation - override in subclasses if needed

    def load_model(self, filepath: str) -> None:
        """
        Load the scoring model from a file

        Args:
            filepath: Path to the saved model
        """
        # Default implementation - override in subclasses if needed


class DigitalFootprintScorer(AlternativeDataScorer):
    """
    Scorer for digital footprint data

    Analyzes digital presence and behavior to assess creditworthiness
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.weights = self.config.get(
            "weights",
            {
                "email_domain_age_days": 0.10,
                "email_account_age_days": 0.15,
                "device_age_months": 0.05,
                "social_media_accounts": 0.10,
                "social_media_followers": 0.05,
                "digital_subscription_count": 0.10,
                "has_professional_email": 0.15,
                "device_price_category_score": 0.10,
                "typical_online_hours_score": 0.05,
                "typical_geolocation_stability": 0.15,
            },
        )
        self.scaler = MinMaxScaler()
        self.scaler_fitted = False

    def preprocess_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess digital footprint features

        Args:
            data: DataFrame with digital footprint features

        Returns:
            Preprocessed DataFrame
        """
        # Extract relevant columns with digital_footprint prefix
        df_cols = [col for col in data.columns if col.startswith("digital_footprint_")]

        if not df_cols:
            logger.warning("No digital footprint features found in data")
            return pd.DataFrame()

        df_data = data[df_cols].copy()

        # Remove prefix for easier processing
        df_data.columns = [col.replace("digital_footprint_", "") for col in df_cols]

        # Handle missing values
        for col in df_data.columns:
            if df_data[col].dtype == "object":
                df_data[col] = df_data[col].fillna("unknown")
            else:
                df_data[col] = df_data[col].fillna(0)

        # Convert boolean columns to int if needed
        if "has_professional_email" in df_data.columns:
            df_data["has_professional_email"] = df_data[
                "has_professional_email"
            ].astype(int)

        return df_data

    def score(self, data: pd.DataFrame) -> float:
        """
        Calculate digital footprint score

        Args:
            data: DataFrame with digital footprint features

        Returns:
            Score from 0-100 (higher is better)
        """
        # Preprocess features
        df_data = self.preprocess_features(data)

        if df_data.empty:
            logger.warning("No digital footprint data available for scoring")
            return 50.0  # Default neutral score

        # Extract features used in scoring
        score_features = {}

        for feature, weight in self.weights.items():
            if feature in df_data.columns:
                value = df_data[feature].iloc[0]

                # Normalize certain features
                if feature == "email_domain_age_days":
                    # Cap at 10 years (3650 days)
                    value = min(value, 3650) / 3650
                elif feature == "email_account_age_days":
                    # Cap at 5 years (1825 days)
                    value = min(value, 1825) / 1825
                elif feature == "device_age_months":
                    # Inverse relationship - newer is better, cap at 60 months
                    value = 1 - (min(value, 60) / 60)
                elif feature == "social_media_accounts":
                    # Cap at 5 accounts
                    value = min(value, 5) / 5
                elif feature == "social_media_followers":
                    # Log scale, cap at 5000
                    value = np.log1p(min(value, 5000)) / np.log1p(5000)
                elif feature == "digital_subscription_count":
                    # Cap at 10 subscriptions
                    value = min(value, 10) / 10

                score_features[feature] = value
            else:
                logger.warning(f"Feature {feature} not found in digital footprint data")
                score_features[feature] = 0.0

        # Calculate weighted score
        weighted_score = 0.0
        total_weight = 0.0

        for feature, value in score_features.items():
            weight = self.weights.get(feature, 0.0)
            weighted_score += value * weight
            total_weight += weight

        if total_weight > 0:
            normalized_score = weighted_score / total_weight
        else:
            normalized_score = 0.5  # Default neutral score

        # Convert to 0-100 scale
        final_score = normalized_score * 100

        logger.info(f"Digital footprint score: {final_score:.2f}")
        return final_score


class TransactionDataScorer(AlternativeDataScorer):
    """
    Scorer for transaction and cash flow data

    Analyzes financial behavior and stability based on transaction history
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.model = None
        self.scaler = StandardScaler()
        self.feature_importance = {}

        # Default feature weights if no model is trained
        self.weights = self.config.get(
            "weights",
            {
                "income_stability": 0.20,
                "expense_to_income_ratio": 0.15,
                "debt_service_ratio": 0.15,
                "savings_rate": 0.10,
                "late_payment_frequency": 0.10,
                "overdraft_frequency": 0.10,
                "cash_buffer_months": 0.10,
                "recurring_bill_payment_consistency": 0.10,
            },
        )

    def preprocess_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess transaction data features

        Args:
            data: DataFrame with transaction data features

        Returns:
            Preprocessed DataFrame
        """
        # Extract relevant columns with transaction prefix
        tx_cols = [col for col in data.columns if col.startswith("transaction_")]

        if not tx_cols:
            logger.warning("No transaction data features found in data")
            return pd.DataFrame()

        tx_data = data[tx_cols].copy()

        # Remove prefix for easier processing
        tx_data.columns = [col.replace("transaction_", "") for col in tx_cols]

        # Handle missing values
        for col in tx_data.columns:
            if tx_data[col].dtype == "object":
                tx_data[col] = tx_data[col].fillna("unknown")
            else:
                tx_data[col] = tx_data[col].fillna(
                    tx_data[col].median() if len(tx_data) > 1 else 0
                )

        # Feature transformations
        if "late_payment_frequency" in tx_data.columns:
            # Inverse relationship - lower is better
            tx_data["late_payment_frequency"] = 1 - tx_data["late_payment_frequency"]

        if "overdraft_frequency" in tx_data.columns:
            # Inverse relationship - lower is better
            tx_data["overdraft_frequency"] = 1 - tx_data["overdraft_frequency"]

        if "expense_to_income_ratio" in tx_data.columns:
            # Cap at 1.0 (expenses = income)
            tx_data["expense_to_income_ratio"] = tx_data[
                "expense_to_income_ratio"
            ].clip(0, 1)
            # Inverse relationship - lower is better
            tx_data["expense_to_income_ratio"] = 1 - tx_data["expense_to_income_ratio"]

        return tx_data

    def train(self, data: pd.DataFrame, target: pd.Series) -> None:
        """
        Train a model on transaction data

        Args:
            data: DataFrame with transaction features
            target: Series with target values (e.g., repayment status)
        """
        # Preprocess features
        tx_data = self.preprocess_features(data)

        if tx_data.empty:
            logger.warning("No transaction data available for training")
            return

        # Scale features
        X = self.scaler.fit_transform(tx_data)

        # Train a Random Forest model
        self.model = RandomForestRegressor(
            n_estimators=100, max_depth=5, random_state=42
        )
        self.model.fit(X, target)

        # Store feature importance
        for i, col in enumerate(tx_data.columns):
            self.feature_importance[col] = self.model.feature_importances_[i]

        logger.info(f"Transaction data model trained with {len(tx_data)} samples")
        logger.info(f"Feature importance: {self.feature_importance}")

    def score(self, data: pd.DataFrame) -> float:
        """
        Calculate transaction data score

        Args:
            data: DataFrame with transaction data features

        Returns:
            Score from 0-100 (higher is better)
        """
        # Preprocess features
        tx_data = self.preprocess_features(data)

        if tx_data.empty:
            logger.warning("No transaction data available for scoring")
            return 50.0  # Default neutral score

        if self.model:
            # Use trained model for scoring
            X = self.scaler.transform(tx_data)
            score = self.model.predict(X)[0]

            # Ensure score is in 0-1 range
            score = np.clip(score, 0, 1)

            # Convert to 0-100 scale
            final_score = score * 100
        else:
            # Use weighted scoring if no model is available
            score_features = {}

            for feature, weight in self.weights.items():
                if feature in tx_data.columns:
                    value = tx_data[feature].iloc[0]
                    score_features[feature] = value
                else:
                    logger.warning(f"Feature {feature} not found in transaction data")
                    score_features[feature] = 0.0

            # Calculate weighted score
            weighted_score = 0.0
            total_weight = 0.0

            for feature, value in score_features.items():
                weight = self.weights.get(feature, 0.0)
                weighted_score += value * weight
                total_weight += weight

            if total_weight > 0:
                normalized_score = weighted_score / total_weight
            else:
                normalized_score = 0.5  # Default neutral score

            # Convert to 0-100 scale
            final_score = normalized_score * 100

        logger.info(f"Transaction data score: {final_score:.2f}")
        return final_score

    def save_model(self, filepath: str = None) -> None:
        """
        Save the scoring model to a file

        Args:
            filepath: Path to save the model, defaults to standard location
        """
        if self.model is None:
            logger.warning("No model to save")
            return

        if filepath is None:
            filepath = os.path.join(self.model_dir, "transaction_scorer.joblib")

        # Create a dictionary with all necessary components
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "feature_importance": self.feature_importance,
        }

        joblib.dump(model_data, filepath)
        logger.info(f"Transaction data model saved to {filepath}")

    def load_model(self, filepath: str = None) -> None:
        """
        Load the scoring model from a file

        Args:
            filepath: Path to the saved model, defaults to standard location
        """
        if filepath is None:
            filepath = os.path.join(self.model_dir, "transaction_scorer.joblib")

        if not os.path.exists(filepath):
            logger.warning(f"Model file not found: {filepath}")
            return

        try:
            model_data = joblib.load(filepath)
            self.model = model_data["model"]
            self.scaler = model_data["scaler"]
            self.feature_importance = model_data["feature_importance"]
            logger.info(f"Transaction data model loaded from {filepath}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")


class UtilityPaymentScorer(AlternativeDataScorer):
    """
    Scorer for utility payment data

    Analyzes utility payment history to assess payment reliability
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.weights = self.config.get(
            "weights",
            {
                "overall_utility_payment_consistency": 0.30,
                "utility_missed_payments_count": 0.20,
                "avg_days_late_when_late": 0.15,
                "utility_payment_trend_score": 0.15,
                "utility_history_length_months": 0.10,
                "utility_accounts_count": 0.10,
            },
        )

    def preprocess_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess utility payment features

        Args:
            data: DataFrame with utility payment features

        Returns:
            Preprocessed DataFrame
        """
        # Extract relevant columns with utility_payment prefix
        up_cols = [col for col in data.columns if col.startswith("utility_payment_")]

        if not up_cols:
            logger.warning("No utility payment features found in data")
            return pd.DataFrame()

        up_data = data[up_cols].copy()

        # Remove prefix for easier processing
        up_data.columns = [col.replace("utility_payment_", "") for col in up_cols]

        # Handle missing values
        for col in up_data.columns:
            if up_data[col].dtype == "object":
                up_data[col] = up_data[col].fillna("unknown")
            else:
                up_data[col] = up_data[col].fillna(
                    up_data[col].median() if len(up_data) > 1 else 0
                )

        # Feature transformations
        if "utility_missed_payments_count" in up_data.columns:
            # Normalize by history length if available
            if (
                "utility_history_length_months" in up_data.columns
                and up_data["utility_history_length_months"].iloc[0] > 0
            ):
                history_length = up_data["utility_history_length_months"].iloc[0]
                missed_rate = (
                    up_data["utility_missed_payments_count"].iloc[0] / history_length
                )
                # Inverse relationship - lower is better
                up_data["missed_payment_rate"] = 1 - np.clip(missed_rate, 0, 1)
            else:
                # Assume 24 months if history length not available
                missed_rate = up_data["utility_missed_payments_count"].iloc[0] / 24
                # Inverse relationship - lower is better
                up_data["missed_payment_rate"] = 1 - np.clip(missed_rate, 0, 1)

        if "avg_days_late_when_late" in up_data.columns:
            # Normalize to 0-1 scale (0-30 days)
            days_late_norm = up_data["avg_days_late_when_late"] / 30
            # Inverse relationship - lower is better
            up_data["days_late_score"] = 1 - np.clip(days_late_norm, 0, 1)

        if "utility_history_length_months" in up_data.columns:
            # Normalize to 0-1 scale (0-36 months)
            up_data["history_length_score"] = np.clip(
                up_data["utility_history_length_months"] / 36, 0, 1
            )

        return up_data

    def score(self, data: pd.DataFrame) -> float:
        """
        Calculate utility payment score

        Args:
            data: DataFrame with utility payment features

        Returns:
            Score from 0-100 (higher is better)
        """
        # Preprocess features
        up_data = self.preprocess_features(data)

        if up_data.empty:
            logger.warning("No utility payment data available for scoring")
            return 50.0  # Default neutral score

        # Extract features used in scoring
        score_features = {}

        for feature, weight in self.weights.items():
            if feature in up_data.columns:
                value = up_data[feature].iloc[0]
                score_features[feature] = value
            elif (
                feature == "utility_missed_payments_count"
                and "missed_payment_rate" in up_data.columns
            ):
                # Use transformed feature instead
                value = up_data["missed_payment_rate"].iloc[0]
                score_features[feature] = value
            elif (
                feature == "avg_days_late_when_late"
                and "days_late_score" in up_data.columns
            ):
                # Use transformed feature instead
                value = up_data["days_late_score"].iloc[0]
                score_features[feature] = value
            elif (
                feature == "utility_history_length_months"
                and "history_length_score" in up_data.columns
            ):
                # Use transformed feature instead
                value = up_data["history_length_score"].iloc[0]
                score_features[feature] = value
            else:
                logger.warning(f"Feature {feature} not found in utility payment data")
                score_features[feature] = 0.0

        # Calculate weighted score
        weighted_score = 0.0
        total_weight = 0.0

        for feature, value in score_features.items():
            weight = self.weights.get(feature, 0.0)
            weighted_score += value * weight
            total_weight += weight

        if total_weight > 0:
            normalized_score = weighted_score / total_weight
        else:
            normalized_score = 0.5  # Default neutral score

        # Convert to 0-100 scale
        final_score = normalized_score * 100

        logger.info(f"Utility payment score: {final_score:.2f}")
        return final_score


class EducationEmploymentScorer(AlternativeDataScorer):
    """
    Scorer for education and employment data

    Analyzes educational background and employment history to assess stability and potential
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.weights = self.config.get(
            "weights",
            {
                "education_level_score": 0.15,
                "employment_years": 0.20,
                "job_stability_score": 0.20,
                "industry_stability": 0.10,
                "job_level_score": 0.15,
                "company_size_score": 0.05,
                "career_growth_trajectory": 0.10,
                "skill_demand_score": 0.05,
            },
        )
        self.model = None

    def preprocess_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess education and employment features

        Args:
            data: DataFrame with education and employment features

        Returns:
            Preprocessed DataFrame
        """
        # Extract relevant columns with education_employment prefix
        ee_cols = [
            col for col in data.columns if col.startswith("education_employment_")
        ]

        if not ee_cols:
            logger.warning("No education/employment features found in data")
            return pd.DataFrame()

        ee_data = data[ee_cols].copy()

        # Remove prefix for easier processing
        ee_data.columns = [col.replace("education_employment_", "") for col in ee_cols]

        # Handle missing values
        for col in ee_data.columns:
            if ee_data[col].dtype == "object":
                ee_data[col] = ee_data[col].fillna("unknown")
            else:
                ee_data[col] = ee_data[col].fillna(
                    ee_data[col].median() if len(ee_data) > 1 else 0
                )

        # Feature transformations
        if "employment_years" in ee_data.columns:
            # Normalize to 0-1 scale (0-20 years)
            ee_data["employment_years_score"] = np.clip(
                ee_data["employment_years"] / 20, 0, 1
            )

        return ee_data

    def train(self, data: pd.DataFrame, target: pd.Series) -> None:
        """
        Train a model on education and employment data

        Args:
            data: DataFrame with education and employment features
            target: Series with target values (e.g., repayment status)
        """
        # Preprocess features
        ee_data = self.preprocess_features(data)

        if ee_data.empty:
            logger.warning("No education/employment data available for training")
            return

        # Select only numeric columns for training
        numeric_cols = ee_data.select_dtypes(include=["number"]).columns.tolist()
        X = ee_data[numeric_cols].values

        # Train a Ridge regression model
        self.model = Ridge(alpha=1.0)
        self.model.fit(X, target)

        logger.info(f"Education/employment model trained with {len(ee_data)} samples")

    def score(self, data: pd.DataFrame) -> float:
        """
        Calculate education and employment score

        Args:
            data: DataFrame with education and employment features

        Returns:
            Score from 0-100 (higher is better)
        """
        # Preprocess features
        ee_data = self.preprocess_features(data)

        if ee_data.empty:
            logger.warning("No education/employment data available for scoring")
            return 50.0  # Default neutral score

        if self.model:
            # Use trained model for scoring
            numeric_cols = ee_data.select_dtypes(include=["number"]).columns.tolist()
            X = ee_data[numeric_cols].values
            score = self.model.predict(X)[0]

            # Ensure score is in 0-1 range
            score = np.clip(score, 0, 1)

            # Convert to 0-100 scale
            final_score = score * 100
        else:
            # Use weighted scoring if no model is available
            score_features = {}

            for feature, weight in self.weights.items():
                if feature in ee_data.columns:
                    value = ee_data[feature].iloc[0]
                    score_features[feature] = value
                elif (
                    feature == "employment_years"
                    and "employment_years_score" in ee_data.columns
                ):
                    # Use transformed feature instead
                    value = ee_data["employment_years_score"].iloc[0]
                    score_features[feature] = value
                else:
                    logger.warning(
                        f"Feature {feature} not found in education/employment data"
                    )
                    score_features[feature] = 0.0

            # Calculate weighted score
            weighted_score = 0.0
            total_weight = 0.0

            for feature, value in score_features.items():
                weight = self.weights.get(feature, 0.0)
                weighted_score += value * weight
                total_weight += weight

            if total_weight > 0:
                normalized_score = weighted_score / total_weight
            else:
                normalized_score = 0.5  # Default neutral score

            # Convert to 0-100 scale
            final_score = normalized_score * 100

        logger.info(f"Education/employment score: {final_score:.2f}")
        return final_score

    def save_model(self, filepath: str = None) -> None:
        """
        Save the scoring model to a file

        Args:
            filepath: Path to save the model, defaults to standard location
        """
        if self.model is None:
            logger.warning("No model to save")
            return

        if filepath is None:
            filepath = os.path.join(
                self.model_dir, "education_employment_scorer.joblib"
            )

        joblib.dump(self.model, filepath)
        logger.info(f"Education/employment model saved to {filepath}")

    def load_model(self, filepath: str = None) -> None:
        """
        Load the scoring model from a file

        Args:
            filepath: Path to the saved model, defaults to standard location
        """
        if filepath is None:
            filepath = os.path.join(
                self.model_dir, "education_employment_scorer.joblib"
            )

        if not os.path.exists(filepath):
            logger.warning(f"Model file not found: {filepath}")
            return

        try:
            self.model = joblib.load(filepath)
            logger.info(f"Education/employment model loaded from {filepath}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")


class AlternativeDataScoreAggregator:
    """
    Aggregates scores from multiple alternative data sources

    Combines individual scores into a comprehensive alternative data score
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the score aggregator

        Args:
            config: Configuration dictionary for the aggregator
        """
        self.config = config or {}
        self.scorers = {}
        self.weights = self.config.get(
            "weights",
            {
                "digital_footprint": 0.20,
                "transaction": 0.35,
                "utility_payment": 0.25,
                "education_employment": 0.20,
            },
        )

        # Initialize default scorers
        self._init_default_scorers()

    def _init_default_scorers(self) -> None:
        """Initialize default scorers"""
        self.register_scorer(
            "digital_footprint",
            DigitalFootprintScorer(self.config.get("digital_footprint", {})),
        )
        self.register_scorer(
            "transaction", TransactionDataScorer(self.config.get("transaction", {}))
        )
        self.register_scorer(
            "utility_payment",
            UtilityPaymentScorer(self.config.get("utility_payment", {})),
        )
        self.register_scorer(
            "education_employment",
            EducationEmploymentScorer(self.config.get("education_employment", {})),
        )

    def register_scorer(self, name: str, scorer: AlternativeDataScorer) -> None:
        """
        Register a new scorer

        Args:
            name: Name for the scorer
            scorer: Scorer instance
        """
        self.scorers[name] = scorer
        logger.info(f"Registered scorer: {name}")

    def get_scorer(self, name: str) -> Optional[AlternativeDataScorer]:
        """
        Get a registered scorer by name

        Args:
            name: Name of the scorer

        Returns:
            Scorer instance or None if not found
        """
        return self.scorers.get(name)

    def calculate_scores(self, data: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate individual scores from all registered scorers

        Args:
            data: DataFrame with alternative data features

        Returns:
            Dictionary mapping scorer names to their scores
        """
        scores = {}

        for name, scorer in self.scorers.items():
            try:
                logger.info(f"Calculating score from {name}")
                score = scorer.score(data)
                scores[name] = score
            except Exception as e:
                logger.error(f"Error calculating score from {name}: {e}")
                scores[name] = 50.0  # Default neutral score

        return scores

    def aggregate_score(
        self, individual_scores: Dict[str, float] = None, data: pd.DataFrame = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Aggregate individual scores into a comprehensive score

        Args:
            individual_scores: Dictionary mapping scorer names to their scores
            data: DataFrame with alternative data features (used if individual_scores not provided)

        Returns:
            Tuple of (aggregate_score, individual_scores)
        """
        if individual_scores is None:
            if data is None:
                logger.error("Either individual_scores or data must be provided")
                return 50.0, {}

            individual_scores = self.calculate_scores(data)

        # Calculate weighted aggregate score
        weighted_score = 0.0
        total_weight = 0.0

        for name, score in individual_scores.items():
            weight = self.weights.get(name, 0.0)
            weighted_score += score * weight
            total_weight += weight

        if total_weight > 0:
            aggregate_score = weighted_score / total_weight
        else:
            aggregate_score = 50.0  # Default neutral score

        logger.info(f"Aggregate alternative data score: {aggregate_score:.2f}")
        logger.info(f"Individual scores: {individual_scores}")

        return aggregate_score, individual_scores

    def generate_score_report(
        self, aggregate_score: float, individual_scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Generate a detailed score report

        Args:
            aggregate_score: Aggregate alternative data score
            individual_scores: Dictionary mapping scorer names to their scores

        Returns:
            Dictionary with score report details
        """
        # Map score to risk level
        if aggregate_score >= 80:
            risk_level = "Very Low"
            approval_recommendation = "Strong Approve"
        elif aggregate_score >= 70:
            risk_level = "Low"
            approval_recommendation = "Approve"
        elif aggregate_score >= 60:
            risk_level = "Moderate"
            approval_recommendation = "Conditionally Approve"
        elif aggregate_score >= 50:
            risk_level = "Moderate-High"
            approval_recommendation = "Review Required"
        elif aggregate_score >= 40:
            risk_level = "High"
            approval_recommendation = "Conditionally Decline"
        else:
            risk_level = "Very High"
            approval_recommendation = "Decline"

        # Generate report
        report = {
            "aggregate_score": aggregate_score,
            "risk_level": risk_level,
            "approval_recommendation": approval_recommendation,
            "individual_scores": individual_scores,
            "score_weights": self.weights,
            "timestamp": pd.Timestamp.now().isoformat(),
            "version": "1.0",
        }

        return report
