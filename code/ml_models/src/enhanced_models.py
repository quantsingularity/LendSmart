"""
Enhanced Machine Learning Models for Credit Scoring

This module provides advanced machine learning models for credit scoring
that leverage both traditional credit data and alternative data sources.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import lightgbm as lgb
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import shap
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (GradientBoostingClassifier,
                              RandomForestClassifier, StackingClassifier,
                              VotingClassifier)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, average_precision_score,
                             classification_report, confusion_matrix, f1_score,
                             precision_recall_curve, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import (GridSearchCV, StratifiedKFold,
                                     cross_val_score, train_test_split)
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
# ML libraries
from sklearn.preprocessing import (OneHotEncoder, PowerTransformer,
                                   StandardScaler)
from sklearn.svm import SVC

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("ml_enhanced_models")


class EnhancedCreditScoringModel:
    """
    Enhanced credit scoring model that combines traditional and alternative data

    This model leverages advanced machine learning techniques and feature engineering
    to improve credit risk assessment accuracy.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the enhanced credit scoring model

        Args:
            config: Configuration dictionary for the model
        """
        self.config = config or {}
        self.model = None
        self.preprocessor = None
        self.feature_importance = {}
        self.model_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models"
        )
        os.makedirs(self.model_dir, exist_ok=True)

        # Default model parameters
        self.model_type = self.config.get("model_type", "ensemble")
        self.cv_folds = self.config.get("cv_folds", 5)
        self.random_state = self.config.get("random_state", 42)
        self.n_jobs = self.config.get("n_jobs", -1)

        # Feature groups
        self.traditional_features = []
        self.alternative_features = []
        self.categorical_features = []
        self.numeric_features = []

        # Explainability
        self.explainer = None

    def _identify_feature_types(self, X: pd.DataFrame) -> None:
        """
        Identify feature types in the dataset

        Args:
            X: Feature DataFrame
        """
        # Identify traditional credit features
        traditional_patterns = [
            "credit_score",
            "income",
            "debt",
            "loan_amount",
            "loan_term",
            "interest_rate",
            "payment_history",
            "utilization",
            "delinquency",
            "public_record",
            "inquiry",
            "employment",
            "housing",
        ]

        # Identify alternative data features
        alternative_patterns = [
            "digital_footprint",
            "transaction",
            "utility_payment",
            "education_employment",
            "social_media",
            "device",
            "behavioral",
            "psychometric",
            "geolocation",
            "alternative",
        ]

        self.traditional_features = []
        self.alternative_features = []

        for col in X.columns:
            if any(pattern in col.lower() for pattern in traditional_patterns):
                self.traditional_features.append(col)
            elif any(pattern in col.lower() for pattern in alternative_patterns):
                self.alternative_features.append(col)
            else:
                # If not clearly identified, default to traditional
                self.traditional_features.append(col)

        # Identify categorical and numeric features
        self.categorical_features = X.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()
        self.numeric_features = X.select_dtypes(include=["number"]).columns.tolist()

        logger.info(f"Identified {len(self.traditional_features)} traditional features")
        logger.info(f"Identified {len(self.alternative_features)} alternative features")
        logger.info(f"Identified {len(self.categorical_features)} categorical features")
        logger.info(f"Identified {len(self.numeric_features)} numeric features")

    def _create_preprocessor(self, X: pd.DataFrame) -> ColumnTransformer:
        """
        Create a preprocessor for feature transformation

        Args:
            X: Feature DataFrame

        Returns:
            ColumnTransformer for preprocessing
        """
        # Identify feature types
        self._identify_feature_types(X)

        # Create transformers for different feature types
        numeric_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", PowerTransformer(method="yeo-johnson", standardize=True)),
            ]
        )

        categorical_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
            ]
        )

        # Combine preprocessing steps
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, self.numeric_features),
                (
                    "cat",
                    categorical_transformer,
                    self.categorical_features if self.categorical_features else [],
                ),
            ]
        )

        return preprocessor

    def _create_model(self) -> Any:
        """
        Create the machine learning model based on configuration

        Returns:
            Configured model instance
        """
        if self.model_type == "rf":
            # Random Forest
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=None,
                min_samples_split=2,
                min_samples_leaf=1,
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=self.n_jobs,
            )
        elif self.model_type == "gb":
            # Gradient Boosting
            model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                random_state=self.random_state,
            )
        elif self.model_type == "xgb":
            # XGBoost
            model = xgb.XGBClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                subsample=0.8,
                colsample_bytree=0.8,
                objective="binary:logistic",
                random_state=self.random_state,
                n_jobs=self.n_jobs,
            )
        elif self.model_type == "lgb":
            # LightGBM
            model = lgb.LGBMClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                subsample=0.8,
                colsample_bytree=0.8,
                objective="binary",
                random_state=self.random_state,
                n_jobs=self.n_jobs,
            )
        elif self.model_type == "nn":
            # Neural Network
            model = MLPClassifier(
                hidden_layer_sizes=(100, 50),
                activation="relu",
                solver="adam",
                alpha=0.0001,
                batch_size="auto",
                learning_rate="adaptive",
                max_iter=200,
                random_state=self.random_state,
            )
        elif self.model_type == "stacking":
            # Stacking Ensemble
            estimators = [
                (
                    "rf",
                    RandomForestClassifier(
                        n_estimators=100, random_state=self.random_state
                    ),
                ),
                (
                    "gb",
                    GradientBoostingClassifier(
                        n_estimators=100, random_state=self.random_state
                    ),
                ),
                (
                    "xgb",
                    xgb.XGBClassifier(n_estimators=100, random_state=self.random_state),
                ),
            ]
            model = StackingClassifier(
                estimators=estimators,
                final_estimator=LogisticRegression(),
                cv=self.cv_folds,
                n_jobs=self.n_jobs,
            )
        elif self.model_type == "voting":
            # Voting Ensemble
            estimators = [
                (
                    "rf",
                    RandomForestClassifier(
                        n_estimators=100, random_state=self.random_state
                    ),
                ),
                (
                    "gb",
                    GradientBoostingClassifier(
                        n_estimators=100, random_state=self.random_state
                    ),
                ),
                (
                    "xgb",
                    xgb.XGBClassifier(n_estimators=100, random_state=self.random_state),
                ),
            ]
            model = VotingClassifier(
                estimators=estimators, voting="soft", n_jobs=self.n_jobs
            )
        else:
            # Default to Ensemble (combination of multiple models)
            # This is the most comprehensive option
            base_models = {
                "rf": RandomForestClassifier(
                    n_estimators=100,
                    max_depth=None,
                    min_samples_split=2,
                    class_weight="balanced",
                    random_state=self.random_state,
                    n_jobs=self.n_jobs,
                ),
                "gb": GradientBoostingClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3,
                    random_state=self.random_state,
                ),
                "xgb": xgb.XGBClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    objective="binary:logistic",
                    random_state=self.random_state,
                    n_jobs=self.n_jobs,
                ),
                "lgb": lgb.LGBMClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    objective="binary",
                    random_state=self.random_state,
                    n_jobs=self.n_jobs,
                ),
            }

            # Create a voting ensemble
            estimators = [(name, model) for name, model in base_models.items()]
            model = VotingClassifier(
                estimators=estimators, voting="soft", n_jobs=self.n_jobs
            )

        return model

    def _perform_feature_engineering(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Perform feature engineering on the dataset

        Args:
            X: Feature DataFrame

        Returns:
            DataFrame with engineered features
        """
        X_engineered = X.copy()

        # Create interaction features between traditional and alternative data
        if self.traditional_features and self.alternative_features:
            # Select a subset of important features from each group to avoid explosion
            trad_subset = (
                self.traditional_features[:5]
                if len(self.traditional_features) > 5
                else self.traditional_features
            )
            alt_subset = (
                self.alternative_features[:5]
                if len(self.alternative_features) > 5
                else self.alternative_features
            )

            # Create interaction features
            for trad_feat in trad_subset:
                if trad_feat in X_engineered.columns and X_engineered[
                    trad_feat
                ].dtype in ["int64", "float64"]:
                    for alt_feat in alt_subset:
                        if alt_feat in X_engineered.columns and X_engineered[
                            alt_feat
                        ].dtype in ["int64", "float64"]:
                            # Multiplication interaction
                            X_engineered[f"interaction_{trad_feat}_{alt_feat}"] = (
                                X_engineered[trad_feat] * X_engineered[alt_feat]
                            )

                            # Ratio interaction (with safeguards)
                            if (X_engineered[alt_feat] != 0).all():
                                X_engineered[f"ratio_{trad_feat}_to_{alt_feat}"] = (
                                    X_engineered[trad_feat] / X_engineered[alt_feat]
                                )

        # Create polynomial features for important numeric features
        important_numeric = [
            col
            for col in X_engineered.columns
            if col in self.numeric_features and "score" in col.lower()
        ]

        for col in important_numeric[:5]:  # Limit to avoid explosion
            if col in X_engineered.columns:
                X_engineered[f"{col}_squared"] = X_engineered[col] ** 2

        # Create aggregate features
        if len(self.alternative_features) > 1:
            alt_scores = [
                col
                for col in self.alternative_features
                if "score" in col.lower()
                and X_engineered[col].dtype in ["int64", "float64"]
            ]

            if alt_scores:
                X_engineered["alt_data_score_mean"] = X_engineered[alt_scores].mean(
                    axis=1
                )
                X_engineered["alt_data_score_min"] = X_engineered[alt_scores].min(
                    axis=1
                )
                X_engineered["alt_data_score_max"] = X_engineered[alt_scores].max(
                    axis=1
                )
                X_engineered["alt_data_score_range"] = (
                    X_engineered["alt_data_score_max"]
                    - X_engineered["alt_data_score_min"]
                )

        # Log transform for highly skewed numeric features
        skewed_features = []
        for col in self.numeric_features:
            if col in X_engineered.columns:
                # Check if the feature is skewed
                skewness = X_engineered[col].skew()
                if abs(skewness) > 1.0:
                    skewed_features.append(col)

        for col in skewed_features:
            # Ensure all values are positive
            if (X_engineered[col] > 0).all():
                X_engineered[f"{col}_log"] = np.log(X_engineered[col])
            elif (X_engineered[col] >= 0).all():
                X_engineered[f"{col}_log"] = np.log1p(X_engineered[col])

        logger.info(
            f"Feature engineering added {len(X_engineered.columns) - len(X.columns)} new features"
        )
        return X_engineered

    def train(
        self, X: pd.DataFrame, y: pd.Series, perform_feature_engineering: bool = True
    ) -> None:
        """
        Train the enhanced credit scoring model

        Args:
            X: Feature DataFrame
            y: Target Series (1 for default, 0 for repaid)
            perform_feature_engineering: Whether to perform feature engineering
        """
        logger.info("Starting enhanced credit scoring model training")

        # Perform feature engineering if requested
        if perform_feature_engineering:
            X = self._perform_feature_engineering(X)

        # Create preprocessor
        self.preprocessor = self._create_preprocessor(X)

        # Create model
        base_model = self._create_model()

        # Create pipeline
        pipeline = Pipeline(
            [("preprocessor", self.preprocessor), ("classifier", base_model)]
        )

        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=self.random_state, stratify=y
        )

        logger.info(
            f"Training set size: {X_train.shape}, Validation set size: {X_val.shape}"
        )

        # Define hyperparameter grid based on model type
        param_grid = {}

        if self.model_type == "rf":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__max_depth": [None, 10, 20],
                "classifier__min_samples_split": [2, 5, 10],
            }
        elif self.model_type == "gb":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__learning_rate": [0.01, 0.1],
                "classifier__max_depth": [3, 5, 7],
            }
        elif self.model_type == "xgb":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__learning_rate": [0.01, 0.1],
                "classifier__max_depth": [3, 5, 7],
                "classifier__subsample": [0.7, 0.8, 0.9],
            }
        elif self.model_type == "lgb":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__learning_rate": [0.01, 0.1],
                "classifier__max_depth": [3, 5, 7],
                "classifier__subsample": [0.7, 0.8, 0.9],
            }
        elif self.model_type == "nn":
            param_grid = {
                "classifier__hidden_layer_sizes": [(50, 25), (100, 50), (100, 50, 25)],
                "classifier__alpha": [0.0001, 0.001, 0.01],
                "classifier__learning_rate_init": [0.001, 0.01],
            }
        elif self.model_type in ["stacking", "voting", "ensemble"]:
            # For ensemble methods, we'll skip grid search as it's too computationally expensive
            param_grid = {}

        # Perform grid search if param_grid is not empty
        if param_grid:
            logger.info("Performing grid search for hyperparameter tuning")
            cv = StratifiedKFold(
                n_splits=self.cv_folds, shuffle=True, random_state=self.random_state
            )
            grid_search = GridSearchCV(
                pipeline,
                param_grid,
                cv=cv,
                scoring="roc_auc",
                n_jobs=self.n_jobs,
                verbose=1,
            )

            grid_search.fit(X_train, y_train)

            logger.info(f"Best parameters: {grid_search.best_params_}")
            self.model = grid_search.best_estimator_
        else:
            logger.info("Training model without grid search")
            pipeline.fit(X_train, y_train)
            self.model = pipeline

        # Evaluate on validation set
        y_pred = self.model.predict(X_val)
        y_prob = self.model.predict_proba(X_val)[:, 1]

        # Calculate metrics
        accuracy = accuracy_score(y_val, y_pred)
        precision = precision_score(y_val, y_pred, zero_division=0)
        recall = recall_score(y_val, y_pred, zero_division=0)
        f1 = f1_score(y_val, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_val, y_prob)
        avg_precision = average_precision_score(y_val, y_prob)

        logger.info("Validation metrics:")
        logger.info(f"  Accuracy: {accuracy:.4f}")
        logger.info(f"  Precision: {precision:.4f}")
        logger.info(f"  Recall: {recall:.4f}")
        logger.info(f"  F1 Score: {f1:.4f}")
        logger.info(f"  ROC AUC: {roc_auc:.4f}")
        logger.info(f"  Average Precision: {avg_precision:.4f}")

        # Print classification report
        logger.info("Classification Report:")
        logger.info("\n" + classification_report(y_val, y_pred))

        # Extract feature importance if available
        self._extract_feature_importance()

        # Create explainer
        self._create_explainer(X_train)

        logger.info("Model training completed")

    def _extract_feature_importance(self) -> None:
        """Extract feature importance from the trained model"""
        if self.model is None:
            logger.warning("Model not trained, cannot extract feature importance")
            return

        try:
            # Get the classifier from the pipeline
            classifier = self.model.named_steps["classifier"]

            # Check if the classifier has feature_importances_ attribute
            if hasattr(classifier, "feature_importances_"):
                # Get feature names from preprocessor
                feature_names = []

                # Get column transformer
                preprocessor = self.model.named_steps["preprocessor"]

                # Get feature names from preprocessor if available
                if hasattr(preprocessor, "get_feature_names_out"):
                    feature_names = preprocessor.get_feature_names_out()
                else:
                    # Fallback to generic feature names
                    feature_names = [
                        f"feature_{i}"
                        for i in range(len(classifier.feature_importances_))
                    ]

                # Create feature importance dictionary
                for i, feature in enumerate(feature_names):
                    self.feature_importance[feature] = classifier.feature_importances_[
                        i
                    ]

                # Sort by importance
                self.feature_importance = {
                    k: v
                    for k, v in sorted(
                        self.feature_importance.items(),
                        key=lambda item: item[1],
                        reverse=True,
                    )
                }

                logger.info("Feature importance extracted successfully")
            else:
                logger.info("Model does not provide feature importance")
        except Exception as e:
            logger.error(f"Error extracting feature importance: {e}")

    def _create_explainer(self, X_sample: pd.DataFrame) -> None:
        """
        Create a SHAP explainer for the model

        Args:
            X_sample: Sample data for initializing the explainer
        """
        if self.model is None:
            logger.warning("Model not trained, cannot create explainer")
            return

        try:
            # Process a small sample for the explainer
            X_processed = self.model.named_steps["preprocessor"].transform(
                X_sample.iloc[:100]
            )

            # Get the classifier from the pipeline
            classifier = self.model.named_steps["classifier"]

            # Create explainer based on model type
            if self.model_type in ["rf", "gb", "xgb", "lgb"]:
                self.explainer = shap.TreeExplainer(classifier, X_processed)
            else:
                # For other model types, use KernelExplainer
                self.explainer = shap.KernelExplainer(
                    classifier.predict_proba, X_processed
                )

            logger.info("SHAP explainer created successfully")
        except Exception as e:
            logger.error(f"Error creating SHAP explainer: {e}")

    def predict(
        self, X: pd.DataFrame, perform_feature_engineering: bool = True
    ) -> np.ndarray:
        """
        Predict default probability for new data

        Args:
            X: Feature DataFrame
            perform_feature_engineering: Whether to perform feature engineering

        Returns:
            Array of default probabilities
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        # Perform feature engineering if requested
        if perform_feature_engineering:
            X = self._perform_feature_engineering(X)

        # Make predictions
        y_prob = self.model.predict_proba(X)[:, 1]

        return y_prob

    def predict_with_explanation(
        self, X: pd.DataFrame, perform_feature_engineering: bool = True
    ) -> Tuple[np.ndarray, Dict]:
        """
        Predict with explanation for interpretability

        Args:
            X: Feature DataFrame
            perform_feature_engineering: Whether to perform feature engineering

        Returns:
            Tuple of (predictions, explanations)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        if self.explainer is None:
            logger.warning(
                "Explainer not available, returning predictions without explanations"
            )
            return self.predict(X, perform_feature_engineering), {}

        # Perform feature engineering if requested
        if perform_feature_engineering:
            X = self._perform_feature_engineering(X)

        # Make predictions
        y_prob = self.model.predict_proba(X)[:, 1]

        # Generate explanations
        try:
            # Process data through preprocessor
            X_processed = self.model.named_steps["preprocessor"].transform(X)

            # Get SHAP values
            shap_values = self.explainer.shap_values(X_processed)

            # If shap_values is a list (for multi-class), take the values for class 1 (default)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            # Create explanation dictionary
            explanations = {
                "shap_values": shap_values,
                "expected_value": (
                    self.explainer.expected_value
                    if not isinstance(self.explainer.expected_value, list)
                    else self.explainer.expected_value[1]
                ),
                "feature_names": (
                    self.model.named_steps["preprocessor"].get_feature_names_out()
                    if hasattr(
                        self.model.named_steps["preprocessor"], "get_feature_names_out"
                    )
                    else None
                ),
            }

            return y_prob, explanations
        except Exception as e:
            logger.error(f"Error generating explanations: {e}")
            return y_prob, {}

    def calculate_credit_score(self, default_prob: float) -> int:
        """
        Convert default probability to a credit score

        Args:
            default_prob: Probability of default (0-1)

        Returns:
            Credit score (300-850)
        """
        # Inverse relationship: higher default probability = lower score
        # Map from [0, 1] to [300, 850]
        score = int(850 - (default_prob * 550))

        # Ensure score is within valid range
        return max(300, min(850, score))

    def save_model(self, filepath: str = None) -> None:
        """
        Save the model to a file

        Args:
            filepath: Path to save the model, defaults to standard location
        """
        if self.model is None:
            logger.warning("No model to save")
            return

        if filepath is None:
            filepath = os.path.join(self.model_dir, "enhanced_credit_model.joblib")

        # Create a dictionary with all necessary components
        model_data = {
            "model": self.model,
            "feature_importance": self.feature_importance,
            "traditional_features": self.traditional_features,
            "alternative_features": self.alternative_features,
            "categorical_features": self.categorical_features,
            "numeric_features": self.numeric_features,
            "model_type": self.model_type,
            "timestamp": datetime.now().isoformat(),
        }

        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")

        # Save explainer separately if available
        if self.explainer is not None:
            explainer_path = os.path.join(
                self.model_dir, "enhanced_credit_explainer.joblib"
            )
            joblib.dump(self.explainer, explainer_path)
            logger.info(f"Explainer saved to {explainer_path}")

    def load_model(self, filepath: str = None) -> None:
        """
        Load the model from a file

        Args:
            filepath: Path to the saved model, defaults to standard location
        """
        if filepath is None:
            filepath = os.path.join(self.model_dir, "enhanced_credit_model.joblib")

        if not os.path.exists(filepath):
            logger.warning(f"Model file not found: {filepath}")
            return

        try:
            model_data = joblib.load(filepath)
            self.model = model_data["model"]
            self.feature_importance = model_data["feature_importance"]
            self.traditional_features = model_data["traditional_features"]
            self.alternative_features = model_data["alternative_features"]
            self.categorical_features = model_data["categorical_features"]
            self.numeric_features = model_data["numeric_features"]
            self.model_type = model_data["model_type"]

            logger.info(f"Model loaded from {filepath}")

            # Load explainer if available
            explainer_path = os.path.join(
                self.model_dir, "enhanced_credit_explainer.joblib"
            )
            if os.path.exists(explainer_path):
                self.explainer = joblib.load(explainer_path)
                logger.info(f"Explainer loaded from {explainer_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")

    def generate_model_report(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """
        Generate a comprehensive model performance report

        Args:
            X: Feature DataFrame
            y: Target Series

        Returns:
            Dictionary with report data
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        # Make predictions
        y_pred = self.model.predict(X)
        y_prob = self.model.predict_proba(X)[:, 1]

        # Calculate metrics
        accuracy = accuracy_score(y, y_pred)
        precision = precision_score(y, y_pred, zero_division=0)
        recall = recall_score(y, y_pred, zero_division=0)
        f1 = f1_score(y, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y, y_prob)
        avg_precision = average_precision_score(y, y_prob)

        # Calculate confusion matrix
        cm = confusion_matrix(y, y_pred)

        # Calculate cross-validation scores
        cv = StratifiedKFold(
            n_splits=self.cv_folds, shuffle=True, random_state=self.random_state
        )
        cv_scores = cross_val_score(self.model, X, y, cv=cv, scoring="roc_auc")

        # Generate report
        report = {
            "model_type": self.model_type,
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
                "roc_auc": roc_auc,
                "average_precision": avg_precision,
                "confusion_matrix": cm.tolist(),
                "cv_scores": cv_scores.tolist(),
                "cv_mean": cv_scores.mean(),
                "cv_std": cv_scores.std(),
            },
            "feature_importance": self.feature_importance,
            "timestamp": datetime.now().isoformat(),
            "version": "1.0",
        }

        return report

    def plot_feature_importance(self, top_n: int = 20, save_path: str = None) -> None:
        """
        Plot feature importance

        Args:
            top_n: Number of top features to plot
            save_path: Path to save the plot
        """
        if not self.feature_importance:
            logger.warning("No feature importance available")
            return

        # Get top N features
        top_features = list(self.feature_importance.items())[:top_n]
        features = [item[0] for item in top_features]
        importances = [item[1] for item in top_features]

        # Create plot
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(features)), importances, align="center")
        plt.yticks(range(len(features)), features)
        plt.xlabel("Importance")
        plt.ylabel("Feature")
        plt.title(f"Top {top_n} Feature Importance")
        plt.tight_layout()

        # Save or show plot
        if save_path:
            plt.savefig(save_path)
            logger.info(f"Feature importance plot saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_roc_curve(
        self, X: pd.DataFrame, y: pd.Series, save_path: str = None
    ) -> None:
        """
        Plot ROC curve

        Args:
            X: Feature DataFrame
            y: Target Series
            save_path: Path to save the plot
        """
        if self.model is None:
            logger.warning("Model not trained, cannot plot ROC curve")
            return

        # Make predictions
        y_prob = self.model.predict_proba(X)[:, 1]

        # Calculate ROC curve
        fpr, tpr, _ = roc_curve(y, y_prob)
        roc_auc = roc_auc_score(y, y_prob)

        # Create plot
        plt.figure(figsize=(10, 8))
        plt.plot(
            fpr,
            tpr,
            color="darkorange",
            lw=2,
            label=f"ROC curve (area = {roc_auc:.2f})",
        )
        plt.plot([0, 1], [0, 1], color="navy", lw=2, linestyle="--")
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("Receiver Operating Characteristic (ROC) Curve")
        plt.legend(loc="lower right")
        plt.grid(True)

        # Save or show plot
        if save_path:
            plt.savefig(save_path)
            logger.info(f"ROC curve plot saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_precision_recall_curve(
        self, X: pd.DataFrame, y: pd.Series, save_path: str = None
    ) -> None:
        """
        Plot precision-recall curve

        Args:
            X: Feature DataFrame
            y: Target Series
            save_path: Path to save the plot
        """
        if self.model is None:
            logger.warning("Model not trained, cannot plot precision-recall curve")
            return

        # Make predictions
        y_prob = self.model.predict_proba(X)[:, 1]

        # Calculate precision-recall curve
        precision, recall, _ = precision_recall_curve(y, y_prob)
        avg_precision = average_precision_score(y, y_prob)

        # Create plot
        plt.figure(figsize=(10, 8))
        plt.plot(
            recall,
            precision,
            color="blue",
            lw=2,
            label=f"Precision-Recall curve (AP = {avg_precision:.2f})",
        )
        plt.xlabel("Recall")
        plt.ylabel("Precision")
        plt.title("Precision-Recall Curve")
        plt.legend(loc="lower left")
        plt.grid(True)

        # Save or show plot
        if save_path:
            plt.savefig(save_path)
            logger.info(f"Precision-recall curve plot saved to {save_path}")
        else:
            plt.show()

        plt.close()

    def plot_shap_summary(
        self, X: pd.DataFrame, max_display: int = 20, save_path: str = None
    ) -> None:
        """
        Plot SHAP summary

        Args:
            X: Feature DataFrame
            max_display: Maximum number of features to display
            save_path: Path to save the plot
        """
        if self.model is None or self.explainer is None:
            logger.warning("Model or explainer not available, cannot plot SHAP summary")
            return

        try:
            # Process data through preprocessor
            X_processed = self.model.named_steps["preprocessor"].transform(X)

            # Calculate SHAP values
            shap_values = self.explainer.shap_values(X_processed)

            # If shap_values is a list (for multi-class), take the values for class 1 (default)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            # Create plot
            plt.figure(figsize=(12, 10))
            shap.summary_plot(
                shap_values,
                X_processed,
                feature_names=(
                    self.model.named_steps["preprocessor"].get_feature_names_out()
                    if hasattr(
                        self.model.named_steps["preprocessor"], "get_feature_names_out"
                    )
                    else None
                ),
                max_display=max_display,
                show=False,
            )

            # Save or show plot
            if save_path:
                plt.savefig(save_path, bbox_inches="tight")
                logger.info(f"SHAP summary plot saved to {save_path}")
            else:
                plt.show()

            plt.close()
        except Exception as e:
            logger.error(f"Error plotting SHAP summary: {e}")


class ModelIntegrator:
    """
    Integrates traditional credit scoring with alternative data scoring

    This class combines the enhanced credit scoring model with alternative data
    to provide a comprehensive credit risk assessment.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the model integrator

        Args:
            config: Configuration dictionary for the integrator
        """
        self.config = config or {}
        self.enhanced_model = None
        self.alt_data_weight = self.config.get("alt_data_weight", 0.3)
        self.trad_data_weight = 1.0 - self.alt_data_weight

        # Initialize models
        self._init_models()

    def _init_models(self) -> None:
        """Initialize models"""
        self.enhanced_model = EnhancedCreditScoringModel(
            self.config.get("enhanced_model", {})
        )

    def train(
        self, X_traditional: pd.DataFrame, X_alternative: pd.DataFrame, y: pd.Series
    ) -> None:
        """
        Train the integrated model

        Args:
            X_traditional: DataFrame with traditional credit features
            X_alternative: DataFrame with alternative data features
            y: Target Series (1 for default, 0 for repaid)
        """
        # Combine traditional and alternative features
        X_combined = pd.concat([X_traditional, X_alternative], axis=1)

        # Train enhanced model
        self.enhanced_model.train(X_combined, y)

    def predict(
        self, X_traditional: pd.DataFrame, X_alternative: pd.DataFrame
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Predict default probability and credit score

        Args:
            X_traditional: DataFrame with traditional credit features
            X_alternative: DataFrame with alternative data features

        Returns:
            Tuple of (credit_score, detailed_assessment)
        """
        if self.enhanced_model.model is None:
            raise ValueError("Model not trained. Call train() first.")

        # Combine traditional and alternative features
        X_combined = pd.concat([X_traditional, X_alternative], axis=1)

        # Get predictions with explanation
        default_prob, explanations = self.enhanced_model.predict_with_explanation(
            X_combined
        )

        # Calculate credit score
        credit_score = self.enhanced_model.calculate_credit_score(default_prob[0])

        # Create detailed assessment
        assessment = {
            "credit_score": credit_score,
            "default_probability": float(default_prob[0]),
            "explanations": explanations,
            "timestamp": datetime.now().isoformat(),
        }

        return credit_score, assessment

    def save_models(self, base_dir: str = None) -> None:
        """
        Save all models

        Args:
            base_dir: Base directory to save models
        """
        if base_dir is None:
            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models"
            )

        os.makedirs(base_dir, exist_ok=True)

        # Save enhanced model
        self.enhanced_model.save_model(
            os.path.join(base_dir, "enhanced_credit_model.joblib")
        )

    def load_models(self, base_dir: str = None) -> None:
        """
        Load all models

        Args:
            base_dir: Base directory to load models from
        """
        if base_dir is None:
            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models"
            )

        # Load enhanced model
        self.enhanced_model.load_model(
            os.path.join(base_dir, "enhanced_credit_model.joblib")
        )


# Helper function to generate synthetic data for testing
def generate_synthetic_data(
    n_samples: int = 1000, include_alternative: bool = True
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generate synthetic data for testing

    Args:
        n_samples: Number of samples to generate
        include_alternative: Whether to include alternative data features

    Returns:
        Tuple of (X, y) where X is features DataFrame and y is target Series
    """
    np.random.seed(42)

    # Generate traditional credit features
    trad_data = {
        "loan_amount": np.random.uniform(1000, 50000, n_samples),
        "interest_rate": np.random.uniform(1, 20, n_samples),
        "term_days": np.random.choice([30, 60, 90, 180, 365, 730], n_samples),
        "credit_score": np.random.normal(650, 100, n_samples),
        "income": np.random.lognormal(10, 1, n_samples),
        "debt_to_income": np.random.uniform(0, 0.6, n_samples),
        "employment_years": np.random.exponential(5, n_samples),
        "is_collateralized": np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
        "previous_loans": np.random.poisson(2, n_samples),
        "previous_defaults": np.random.poisson(0.5, n_samples),
    }

    # Add collateral value for collateralized loans
    trad_data["collateral_value"] = 0
    mask = trad_data["is_collateralized"] == 1
    trad_data["collateral_value"][mask] = trad_data["loan_amount"][
        mask
    ] * np.random.uniform(1, 2, mask.sum())

    # Create DataFrame for traditional data
    X_trad = pd.DataFrame(trad_data)

    # Generate alternative data features if requested
    if include_alternative:
        # Digital footprint features
        digital_data = {
            "digital_footprint_email_domain_age_days": np.random.randint(
                30, 5000, n_samples
            ),
            "digital_footprint_device_age_months": np.random.randint(1, 60, n_samples),
            "digital_footprint_social_media_accounts": np.random.randint(
                0, 6, n_samples
            ),
            "digital_footprint_has_professional_email": np.random.binomial(
                1, 0.7, n_samples
            ),
            "digital_footprint_device_price_category_score": np.random.choice(
                [0.3, 0.6, 0.9], n_samples
            ),
        }

        # Transaction data features
        transaction_data = {
            "transaction_income_stability": np.random.uniform(0.3, 1.0, n_samples),
            "transaction_expense_to_income_ratio": np.random.uniform(
                0.3, 0.9, n_samples
            ),
            "transaction_savings_rate": np.random.uniform(0, 0.3, n_samples),
            "transaction_late_payment_frequency": np.random.uniform(0, 0.2, n_samples),
            "transaction_cash_buffer_months": np.random.uniform(0, 6, n_samples),
        }

        # Utility payment features
        utility_data = {
            "utility_payment_overall_utility_payment_consistency": np.random.uniform(
                0.7, 1.0, n_samples
            ),
            "utility_payment_utility_missed_payments_count": np.random.randint(
                0, 5, n_samples
            ),
            "utility_payment_utility_payment_trend_score": np.random.choice(
                [0.3, 0.7, 0.9], n_samples
            ),
        }

        # Education and employment features
        edu_emp_data = {
            "education_employment_education_level_score": np.random.choice(
                [0.2, 0.4, 0.6, 0.8, 1.0], n_samples
            ),
            "education_employment_job_stability_score": np.random.uniform(
                0.3, 1.0, n_samples
            ),
            "education_employment_industry_stability": np.random.uniform(
                0.3, 1.0, n_samples
            ),
        }

        # Combine all alternative data
        alt_data = {**digital_data, **transaction_data, **utility_data, **edu_emp_data}
        X_alt = pd.DataFrame(alt_data)

        # Combine traditional and alternative data
        X = pd.concat([X_trad, X_alt], axis=1)
    else:
        X = X_trad

    # Generate target variable based on features
    # Higher probability of default if:
    # - High loan amount
    # - High interest rate
    # - Low credit score
    # - High debt-to-income ratio
    # - Low employment years
    # - Not collateralized
    # - Previous defaults
    # - Low income stability (if alternative data included)
    # - High late payment frequency (if alternative data included)

    # Calculate default probability
    default_prob = (
        0.05  # base rate
        + 0.1 * (X_trad["loan_amount"] > 30000).astype(int)
        + 0.1 * (X_trad["interest_rate"] > 15).astype(int)
        + 0.2 * (X_trad["credit_score"] < 600).astype(int)
        + 0.15 * (X_trad["debt_to_income"] > 0.4).astype(int)
        + 0.1 * (X_trad["employment_years"] < 1).astype(int)
        + 0.1 * (X_trad["is_collateralized"] == 0).astype(int)
        + 0.2 * (X_trad["previous_defaults"] > 0).astype(int)
    )

    if include_alternative:
        default_prob += (
            0.1 * (X_alt["transaction_income_stability"] < 0.5).astype(int)
            + 0.1 * (X_alt["transaction_late_payment_frequency"] > 0.1).astype(int)
            + 0.1
            * (
                X_alt["utility_payment_overall_utility_payment_consistency"] < 0.8
            ).astype(int)
            + 0.05
            * (X_alt["education_employment_job_stability_score"] < 0.5).astype(int)
        )

    # Clip probabilities to [0, 0.95]
    default_prob = np.clip(default_prob, 0, 0.95)

    # Generate binary outcome
    y = np.random.binomial(1, default_prob)

    return X, pd.Series(y)
