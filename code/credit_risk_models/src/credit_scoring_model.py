"""
Machine Learning Models for Credit Scoring

This module provides machine learning models for credit scoring that leverage both
traditional credit data and alternative data sources. It includes preprocessing,
feature engineering, training, evaluation, SHAP explanations, plotting, and model
persistence utilities.
"""

import logging
from .utils import setup_logging, load_data, feature_engineering
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import joblib
import lightgbm as lgb
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    StackingClassifier,
    VotingClassifier,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, PowerTransformer

# Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = setup_logging("ml_models", "model_training.log")


class CreditScoringModel:
    """
    Credit scoring model that combines traditional and alternative data.

    The class provides:
      - automatic feature type identification
      - preprocessing pipelines (numeric + categorical)
      - optional feature engineering
      - multiple model choices (rf, gb, xgb, lgb, nn, stacking, voting, ensemble)
      - hyperparameter grid search
      - SHAP explainer creation and plotting utilities
      - model save/load
      - reporting utilities
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initialize the credit scoring model.

        Args:
            config: optional configuration dictionary. Supported keys:
                - model_type: str, one of ("rf","gb","xgb","lgb","nn","stacking","voting","ensemble")
                - cv_folds: int, folds for grid-search / stacking
                - random_state: int
                - n_jobs: int
        """
        self.config: Dict[str, Any] = config or {}
        self.model: Optional[Pipeline] = None
        self.preprocessor: Optional[ColumnTransformer] = None
        self.feature_importance: Dict[str, float] = {}
        self.model_dir: str = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "models"
        )
        os.makedirs(self.model_dir, exist_ok=True)

        self.model_type: str = str(self.config.get("model_type", "ensemble"))
        self.cv_folds: int = int(self.config.get("cv_folds", 5))
        self.random_state: int = int(self.config.get("random_state", 42))
        self.n_jobs: int = int(self.config.get("n_jobs", -1))

        self.traditional_features: List[str] = []
        self.alternative_features: List[str] = []
        self.categorical_features: List[str] = []
        self.numeric_features: List[str] = []

        self.explainer: Optional[Any] = None

    def _identify_feature_types(self, X: pd.DataFrame) -> None:
        """
        Identify traditional, alternative, numeric and categorical features based on column names and dtypes.

        Args:
            X: DataFrame of features.
        """
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
            low = col.lower()
            if any(p in low for p in traditional_patterns):
                self.traditional_features.append(col)
            elif any(p in low for p in alternative_patterns):
                self.alternative_features.append(col)
            else:
                # default to traditional if nothing matches
                self.traditional_features.append(col)

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
        Build ColumnTransformer with numeric and categorical pipelines.

        Args:
            X: DataFrame used to identify feature groups.

        Returns:
            ColumnTransformer instance.
        """
        self._identify_feature_types(X)

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
        Instantiate the classifier based on self.model_type.

        Returns:
            An sklearn-compatible estimator instance (not the full pipeline).
        """
        mt = self.model_type.lower()
        if mt == "rf":
            return RandomForestClassifier(
                n_estimators=100,
                max_depth=None,
                min_samples_split=2,
                min_samples_leaf=1,
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=self.n_jobs,
            )
        if mt == "gb":
            return GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                random_state=self.random_state,
            )
        if mt == "xgb":
            return xgb.XGBClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                subsample=0.8,
                colsample_bytree=0.8,
                objective="binary:logistic",
                random_state=self.random_state,
                n_jobs=self.n_jobs,
            )
        if mt == "lgb":
            return lgb.LGBMClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                subsample=0.8,
                colsample_bytree=0.8,
                objective="binary",
                random_state=self.random_state,
                n_jobs=self.n_jobs,
            )
        if mt == "nn":
            return MLPClassifier(
                hidden_layer_sizes=(100, 50),
                activation="relu",
                solver="adam",
                alpha=0.0001,
                batch_size="auto",
                learning_rate="adaptive",
                max_iter=200,
                random_state=self.random_state,
            )
        if mt in {"stacking", "voting", "ensemble"}:
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
            if mt == "stacking":
                # StackingClassifier accepts n_jobs in newer versions of sklearn
                return StackingClassifier(
                    estimators=estimators,
                    final_estimator=LogisticRegression(),
                    cv=self.cv_folds,
                    n_jobs=self.n_jobs,
                )
            # voting
            return VotingClassifier(
                estimators=estimators, voting="soft", n_jobs=self.n_jobs
            )

        # default ensemble (voting)
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
        estimators = list(base_models.items())
        return VotingClassifier(
            estimators=estimators, voting="soft", n_jobs=self.n_jobs
        )

    def _perform_feature_engineering(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Perform feature engineering on X and return a new DataFrame.

        Adds:
          - interactions between top traditional and alt features
          - ratios where safe (non-zero denominators)
          - squared and log transforms for skewed/score features
          - aggregated alt data scores (mean/min/max/range)
        """
        X_engineered = X.copy()

        if self.traditional_features and self.alternative_features:
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

            for trad_feat in trad_subset:
                if trad_feat in X_engineered.columns and X_engineered[
                    trad_feat
                ].dtype in ["int64", "float64"]:
                    for alt_feat in alt_subset:
                        if alt_feat in X_engineered.columns and X_engineered[
                            alt_feat
                        ].dtype in ["int64", "float64"]:
                            X_engineered[f"interaction_{trad_feat}_{alt_feat}"] = (
                                X_engineered[trad_feat] * X_engineered[alt_feat]
                            )
                            # safe ratio
                            if (X_engineered[alt_feat] != 0).all():
                                X_engineered[f"ratio_{trad_feat}_to_{alt_feat}"] = (
                                    X_engineered[trad_feat] / X_engineered[alt_feat]
                                )

        important_numeric = [
            col
            for col in X_engineered.columns
            if col in self.numeric_features and "score" in col.lower()
        ]
        for col in important_numeric[:5]:
            if col in X_engineered.columns:
                X_engineered[f"{col}_squared"] = X_engineered[col] ** 2

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

        skewed_features: List[str] = []
        for col in self.numeric_features:
            if col in X_engineered.columns:
                skewness = X_engineered[col].skew()
                if abs(skewness) > 1.0:
                    skewed_features.append(col)

        for col in skewed_features:
            if (X_engineered[col] > 0).all():
                X_engineered[f"{col}_log"] = np.log(X_engineered[col])
            elif (X_engineered[col] >= 0).all():
                X_engineered[f"{col}_log"] = np.log1p(X_engineered[col])

        logger.info(
            f"Feature engineering added {len(X_engineered.columns) - len(X.columns)} new features"
        )
        return X_engineered

    def train(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        perform_feature_engineering: bool = True,
        grid_search: bool = True,
    ) -> None:
        """
        Train the model pipeline.

        Args:
            X: features DataFrame
            y: target Series (1 default, 0 repaid)
            perform_feature_engineering: whether to perform engineered features before training
            grid_search: whether to run hyperparameter grid search for supported models
        """
        logger.info("Starting credit scoring model training")

        if perform_feature_engineering:
            X = self._perform_feature_engineering(X)

        self.preprocessor = self._create_preprocessor(X)
        base_model = self._create_model()
        pipeline = Pipeline(
            [("preprocessor", self.preprocessor), ("classifier", base_model)]
        )

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=self.random_state, stratify=y
        )
        logger.info(
            f"Training set size: {X_train.shape}, Validation set size: {X_val.shape}"
        )

        param_grid: Dict[str, List[Any]] = {}
        mt = self.model_type.lower()
        if mt == "rf":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__max_depth": [None, 10, 20],
                "classifier__min_samples_split": [2, 5, 10],
            }
        elif mt == "gb":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__learning_rate": [0.01, 0.1],
                "classifier__max_depth": [3, 5, 7],
            }
        elif mt == "xgb":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__learning_rate": [0.01, 0.1],
                "classifier__max_depth": [3, 5, 7],
                "classifier__subsample": [0.7, 0.8, 0.9],
            }
        elif mt == "lgb":
            param_grid = {
                "classifier__n_estimators": [100, 200],
                "classifier__learning_rate": [0.01, 0.1],
                "classifier__max_depth": [3, 5, 7],
                "classifier__subsample": [0.7, 0.8, 0.9],
            }
        elif mt == "nn":
            param_grid = {
                "classifier__hidden_layer_sizes": [(50, 25), (100, 50), (100, 50, 25)],
                "classifier__alpha": [0.0001, 0.001, 0.01],
                "classifier__learning_rate_init": [0.001, 0.01],
            }

        if grid_search and param_grid:
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

        # Validation metrics
        y_pred = self.model.predict(X_val)
        y_prob = self.model.predict_proba(X_val)[:, 1]
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
        logger.info("Classification Report:")
        logger.info("\n" + classification_report(y_val, y_pred))

        self._extract_feature_importance()
        self._create_explainer(X_train)
        logger.info("Model training completed")

    def _extract_feature_importance(self) -> None:
        """
        Extract feature importance from the pipeline's classifier if available.
        Fills self.feature_importance as an ordered dict-like mapping.
        """
        if self.model is None:
            logger.warning("Model not trained, cannot extract feature importance")
            return

        try:
            clf = self.model.named_steps["classifier"]
            if hasattr(clf, "feature_importances_"):
                pre = self.model.named_steps["preprocessor"]
                feature_names: List[str] = []
                if hasattr(pre, "get_feature_names_out"):
                    try:
                        feature_names = list(pre.get_feature_names_out())
                    except Exception:
                        feature_names = []
                if not feature_names:
                    feature_names = [
                        f"feature_{i}" for i in range(len(clf.feature_importances_))
                    ]

                self.feature_importance = {
                    fn: imp for fn, imp in zip(feature_names, clf.feature_importances_)
                }
                # sort descending
                self.feature_importance = dict(
                    sorted(
                        self.feature_importance.items(),
                        key=lambda item: item[1],
                        reverse=True,
                    )
                )
                logger.info("Feature importance extracted successfully")
            else:
                logger.info("Trained classifier does not expose feature_importances_")
        except Exception as e:
            logger.error(f"Error extracting feature importance: {e}")

    def _create_explainer(self, X_sample: pd.DataFrame) -> None:
        """
        Create a SHAP explainer for the trained model using a sample of X.
        """
        if self.model is None:
            logger.warning("Model not trained, cannot create explainer")
            return

        try:
            pre = self.model.named_steps["preprocessor"]
            X_processed = pre.transform(X_sample.iloc[:100])
            clf = self.model.named_steps["classifier"]

            if self.model_type.lower() in ["rf", "gb", "xgb", "lgb"]:
                # TreeExplainer works for tree models
                self.explainer = shap.TreeExplainer(clf)
            else:
                # KernelExplainer requires a background dataset
                self.explainer = shap.KernelExplainer(clf.predict_proba, X_processed)
            logger.info("SHAP explainer created successfully")
        except Exception as e:
            logger.error(f"Error creating SHAP explainer: {e}")

    def predict(
        self, X: pd.DataFrame, perform_feature_engineering: bool = True
    ) -> np.ndarray:
        """
        Predict default probabilities for given features.

        Args:
            X: features DataFrame
            perform_feature_engineering: whether to add engineered features prior to prediction

        Returns:
            numpy array of probabilities for the positive class
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        if perform_feature_engineering:
            X = self._perform_feature_engineering(X)
        return self.model.predict_proba(X)[:, 1]

    def predict_with_explanation(
        self, X: pd.DataFrame, perform_feature_engineering: bool = True
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Predict probabilities and return SHAP explanations (if available).

        Args:
            X: features DataFrame
            perform_feature_engineering: whether to add engineered features prior to prediction

        Returns:
            (probabilities, explanations_dict)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        if perform_feature_engineering:
            X = self._perform_feature_engineering(X)

        y_prob = self.model.predict_proba(X)[:, 1]

        if self.explainer is None:
            logger.warning(
                "Explainer not available, returning predictions without explanations"
            )
            return y_prob, {}

        try:
            pre = self.model.named_steps["preprocessor"]
            X_processed = pre.transform(X)
            # shap_values API differs by explainer type; try to handle common cases
            shap_values = None
            if hasattr(self.explainer, "shap_values"):
                shap_values = self.explainer.shap_values(X_processed)
            else:
                # callable explainer
                shap_values = self.explainer(X_processed)

            # If shap_values is list (multi-class), pick positive class entry if present
            if isinstance(shap_values, list):
                # many shap explainer return [class0_vals, class1_vals]
                if len(shap_values) > 1:
                    shap_vals = shap_values[1]
                else:
                    shap_vals = shap_values[0]
            else:
                shap_vals = shap_values

            expected_value = None
            if hasattr(self.explainer, "expected_value"):
                ev = self.explainer.expected_value
                if isinstance(ev, (list, tuple, np.ndarray)) and len(ev) > 1:
                    expected_value = ev[1]
                else:
                    expected_value = ev

            feature_names = None
            try:
                feature_names = pre.get_feature_names_out()
            except Exception:
                feature_names = None

            explanations = {
                "shap_values": shap_vals,
                "expected_value": expected_value,
                "feature_names": feature_names,
            }
            return y_prob, explanations
        except Exception as e:
            logger.error(f"Error generating explanations: {e}")
            return y_prob, {}

    def calculate_credit_score(self, default_prob: float) -> int:
        """
        Convert a default probability (0-1) into a credit score in the typical 300-850 range.

        Args:
            default_prob: probability of default

        Returns:
            integer credit score between 300 and 850
        """
        score = int(850 - default_prob * 550)
        return max(300, min(850, score))

    def save_model(self, filepath: Optional[str] = None) -> None:
        """
        Save model, metadata, and (optionally) explainer to disk.

        Args:
            filepath: optional path to save the model bundle. If None, a standard filename under model_dir is used.
        """
        if self.model is None:
            logger.warning("No model to save")
            return

        if filepath is None:
            filepath = os.path.join(self.model_dir, "credit_model.joblib")

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

        if self.explainer is not None:
            explainer_path = os.path.join(self.model_dir, "credit_explainer.joblib")
            try:
                joblib.dump(self.explainer, explainer_path)
                logger.info(f"Explainer saved to {explainer_path}")
            except Exception as e:
                logger.error(f"Could not save explainer: {e}")

    def load_model(self, filepath: Optional[str] = None) -> None:
        """
        Load model metadata and explainer (if present) from disk.

        Args:
            filepath: path to saved model. If None, a default path under model_dir is used.
        """
        if filepath is None:
            filepath = os.path.join(self.model_dir, "credit_model.joblib")
        if not os.path.exists(filepath):
            logger.warning(f"Model file not found: {filepath}")
            return
        try:
            model_data = joblib.load(filepath)
            self.model = model_data.get("model")
            self.feature_importance = model_data.get("feature_importance", {})
            self.traditional_features = model_data.get("traditional_features", [])
            self.alternative_features = model_data.get("alternative_features", [])
            self.categorical_features = model_data.get("categorical_features", [])
            self.numeric_features = model_data.get("numeric_features", [])
            self.model_type = model_data.get("model_type", self.model_type)
            logger.info(f"Model loaded from {filepath}")
            explainer_path = os.path.join(self.model_dir, "credit_explainer.joblib")
            if os.path.exists(explainer_path):
                self.explainer = joblib.load(explainer_path)
                logger.info(f"Explainer loaded from {explainer_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")

    def generate_model_report(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """
        Generate a performance report (metrics + CV scores + confusion matrix).

        Args:
            X: feature DataFrame
            y: true labels

        Returns:
            dictionary containing metrics, cv scores and feature importance
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        y_pred = self.model.predict(X)
        y_prob = self.model.predict_proba(X)[:, 1]

        accuracy = accuracy_score(y, y_pred)
        precision = precision_score(y, y_pred, zero_division=0)
        recall = recall_score(y, y_pred, zero_division=0)
        f1 = f1_score(y, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y, y_prob)
        avg_precision = average_precision_score(y, y_prob)
        cm = confusion_matrix(y, y_pred)

        cv = StratifiedKFold(
            n_splits=self.cv_folds, shuffle=True, random_state=self.random_state
        )
        try:
            cv_scores = cross_val_score(self.model, X, y, cv=cv, scoring="roc_auc")
            cv_scores_list = cv_scores.tolist()
            cv_mean = float(cv_scores.mean())
            cv_std = float(cv_scores.std())
        except Exception:
            cv_scores_list = []
            cv_mean = float("nan")
            cv_std = float("nan")

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
                "cv_scores": cv_scores_list,
                "cv_mean": cv_mean,
                "cv_std": cv_std,
            },
            "feature_importance": self.feature_importance,
            "timestamp": datetime.now().isoformat(),
            "version": "1.0",
        }
        return report

    def plot_feature_importance(
        self, top_n: int = 20, save_path: Optional[str] = None
    ) -> None:
        """
        Plot horizontal bar chart of top feature importances.

        Args:
            top_n: number of top features to plot
            save_path: optional file path to save the figure
        """
        if not self.feature_importance:
            logger.warning("No feature importance available")
            return
        top_features = list(self.feature_importance.items())[:top_n]
        features = [item[0] for item in top_features]
        importances = [item[1] for item in top_features]
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(features)), importances, align="center")
        plt.yticks(range(len(features)), features)
        plt.xlabel("Importance")
        plt.ylabel("Feature")
        plt.title(f"Top {top_n} Feature Importance")
        plt.tight_layout()
        if save_path:
            plt.savefig(save_path)
            logger.info(f"Feature importance plot saved to {save_path}")
        else:
            plt.show()
        plt.close()

    def plot_roc_curve(
        self, X: pd.DataFrame, y: pd.Series, save_path: Optional[str] = None
    ) -> None:
        """
        Plot ROC curve for given data.

        Args:
            X: features DataFrame
            y: true labels
            save_path: optional path to save the figure
        """
        if self.model is None:
            logger.warning("Model not trained, cannot plot ROC curve")
            return
        y_prob = self.model.predict_proba(X)[:, 1]
        fpr, tpr, _ = roc_curve(y, y_prob)
        roc_auc = roc_auc_score(y, y_prob)
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
        if save_path:
            plt.savefig(save_path)
            logger.info(f"ROC curve plot saved to {save_path}")
        else:
            plt.show()
        plt.close()

    def plot_precision_recall_curve(
        self, X: pd.DataFrame, y: pd.Series, save_path: Optional[str] = None
    ) -> None:
        """
        Plot Precision-Recall curve.

        Args:
            X: features DataFrame
            y: true labels
            save_path: optional path to save the figure
        """
        if self.model is None:
            logger.warning("Model not trained, cannot plot precision-recall curve")
            return
        y_prob = self.model.predict_proba(X)[:, 1]
        precision_vals, recall_vals, _ = precision_recall_curve(y, y_prob)
        avg_precision = average_precision_score(y, y_prob)
        plt.figure(figsize=(10, 8))
        plt.plot(
            recall_vals,
            precision_vals,
            lw=2,
            label=f"Precision-Recall (AP = {avg_precision:.2f})",
        )
        plt.xlabel("Recall")
        plt.ylabel("Precision")
        plt.title("Precision-Recall Curve")
        plt.legend(loc="lower left")
        plt.grid(True)
        if save_path:
            plt.savefig(save_path)
            logger.info(f"Precision-recall curve plot saved to {save_path}")
        else:
            plt.show()
        plt.close()

    def plot_shap_summary(
        self, X: pd.DataFrame, max_display: int = 20, save_path: Optional[str] = None
    ) -> None:
        """
        Plot SHAP summary using the created explainer.

        Args:
            X: features DataFrame
            max_display: maximum number of features to display
            save_path: optional path to save the figure
        """
        if self.model is None or self.explainer is None:
            logger.warning("Model or explainer not available, cannot plot SHAP summary")
            return
        try:
            pre = self.model.named_steps["preprocessor"]
            X_processed = pre.transform(X)
            shap_values = None
            if hasattr(self.explainer, "shap_values"):
                shap_values = self.explainer.shap_values(X_processed)
            else:
                shap_values = self.explainer(X_processed)
            if isinstance(shap_values, list):
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            plt.figure(figsize=(12, 10))
            shap.summary_plot(
                shap_values,
                X_processed,
                feature_names=(
                    pre.get_feature_names_out()
                    if hasattr(pre, "get_feature_names_out")
                    else None
                ),
                max_display=max_display,
                show=False,
            )
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
    Integrates traditional credit scoring with alternative data scoring.

    This class wraps a CreditScoringModel and makes it convenient to work with
    separate traditional/alternative DataFrames.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initialize the integrator.

        Args:
            config: optional dict containing 'credit_model' config and 'alt_data_weight'
        """
        self.config = config or {}
        self.credit_model = CreditScoringModel(self.config.get("credit_model", {}))
        self.alt_data_weight: float = float(self.config.get("alt_data_weight", 0.3))
        self.trad_data_weight: float = 1.0 - self.alt_data_weight

    def train(
        self, X_traditional: pd.DataFrame, X_alternative: pd.DataFrame, y: pd.Series
    ) -> None:
        """
        Train the integrated model using combined feature set.

        Args:
            X_traditional: DataFrame of traditional features
            X_alternative: DataFrame of alternative features
            y: target Series
        """
        X_combined = pd.concat(
            [
                X_traditional.reset_index(drop=True),
                X_alternative.reset_index(drop=True),
            ],
            axis=1,
        )
        self.credit_model.train(X_combined, y)

    def predict(
        self, X_traditional: pd.DataFrame, X_alternative: pd.DataFrame
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Predict credit score and provide a detailed assessment.

        Returns:
            (credit_score, assessment_dict)
        """
        if self.credit_model.model is None:
            raise ValueError("Model not trained. Call train() first.")
        X_combined = pd.concat(
            [
                X_traditional.reset_index(drop=True),
                X_alternative.reset_index(drop=True),
            ],
            axis=1,
        )
        default_prob, explanations = self.credit_model.predict_with_explanation(
            X_combined
        )
        # default_prob may be an array; take first if array-like
        prob0 = (
            float(default_prob[0])
            if hasattr(default_prob, "__len__")
            else float(default_prob)
        )
        credit_score = self.credit_model.calculate_credit_score(prob0)
        assessment = {
            "credit_score": credit_score,
            "default_probability": prob0,
            "explanations": explanations,
            "timestamp": datetime.now().isoformat(),
        }
        return credit_score, assessment

    def save_models(self, base_dir: Optional[str] = None) -> None:
        """
        Save underlying credit model and explainer.

        Args:
            base_dir: directory to save models; defaults to module's models directory
        """
        if base_dir is None:
            base_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "models"
            )
        os.makedirs(base_dir, exist_ok=True)
        self.credit_model.save_model(os.path.join(base_dir, "credit_model.joblib"))

    def load_models(self, base_dir: Optional[str] = None) -> None:
        """
        Load underlying credit model and explainer from disk.

        Args:
            base_dir: directory to load from
        """
        if base_dir is None:
            base_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "models"
            )
        self.credit_model.load_model(os.path.join(base_dir, "credit_model.joblib"))


def generate_synthetic_data(
    n_samples: int = 1000, include_alternative: bool = True
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generate synthetic dataset with traditional and optional alternative features.

    Args:
        n_samples: number of rows to generate
        include_alternative: whether to include alternative features

    Returns:
        (X, y) where X is DataFrame and y is pd.Series of binary outcomes
    """
    np.random.seed(42)
    trad_data: Dict[str, Any] = {
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
    # collateral_value computed when collateral exists
    collateral_value = np.zeros(n_samples)
    mask = trad_data["is_collateralized"] == 1
    collateral_value[mask] = trad_data["loan_amount"][mask] * np.random.uniform(
        1, 2, mask.sum()
    )
    trad_data["collateral_value"] = collateral_value
    X_trad = pd.DataFrame(trad_data)

    if include_alternative:
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
        transaction_data = {
            "transaction_income_stability": np.random.uniform(0.3, 1.0, n_samples),
            "transaction_expense_to_income_ratio": np.random.uniform(
                0.3, 0.9, n_samples
            ),
            "transaction_savings_rate": np.random.uniform(0, 0.3, n_samples),
            "transaction_late_payment_frequency": np.random.uniform(0, 0.2, n_samples),
            "transaction_cash_buffer_months": np.random.uniform(0, 6, n_samples),
        }
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
        alt_data = {**digital_data, **transaction_data, **utility_data, **edu_emp_data}
        X_alt = pd.DataFrame(alt_data)
        X = pd.concat(
            [X_trad.reset_index(drop=True), X_alt.reset_index(drop=True)], axis=1
        )
    else:
        X = X_trad

    default_prob = (
        0.05
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

    default_prob = np.clip(default_prob, 0, 0.95)
    y = np.random.binomial(1, default_prob)
    return X, pd.Series(y)
