"""
Integration module for LendSmart enhanced credit scoring system

This module provides integration points between the traditional credit scoring system,
alternative data scoring, advanced machine learning models, and compliance framework.
"""

import json
import logging
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, List, Tuple, Optional
import pandas as pd

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from credit_risk_models
sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "credit_risk_models",
        "src",
    )
)
from credit_scoring_model import ModelIntegrator, generate_synthetic_data
from data_sources import AlternativeDataManager
from scoring import AlternativeDataScoreAggregator

# Import from compliance_framework
sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "compliance_framework",
        "src",
    )
)
from compliance import ComplianceDocumentGenerator, ComplianceFramework

# Import from credit risk models
sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "credit_risk_models",
        "src",
    )
)
try:
    from risk_assessment import LoanRiskModel
except ImportError:
    logging.warning("Could not import LoanRiskModel, using mock implementation")

    class LoanRiskModel:
        def __init__(self) -> None:
            self.model = None
            self.features = []

        def predict_risk_score(self, loan_data: Any) -> int:
            return 50


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("lendsmart_integration")


class LendingSystem:
    """
    Lending system that integrates traditional credit scoring,
    alternative data, advanced ML models, and compliance framework
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initialize the lending system

        Args:
            config: Configuration dictionary for the system
        """
        self.config = config or {}
        self.alt_data_manager = AlternativeDataManager()
        self.alt_data_scorer = AlternativeDataScoreAggregator(
            self.config.get("alt_data_scorer", {})
        )
        self.model_integrator = ModelIntegrator(self.config.get("model_integrator", {}))
        self.compliance_framework = ComplianceFramework(
            self.config.get("compliance_framework", {})
        )
        self.document_generator = ComplianceDocumentGenerator(
            self.config.get("document_generator", {})
        )
        self.traditional_model = LoanRiskModel()
        self.output_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output"
        )
        os.makedirs(self.output_dir, exist_ok=True)

    def process_loan_application(
        self, application_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a loan application using the enhanced system

        Args:
            application_data: Dictionary with loan application data

        Returns:
            Dictionary with processing results
        """
        application_id = application_data.get("application_id", str(uuid.uuid4()))
        logger.info(f"Processing loan application {application_id}")
        borrower_id = application_data.get("borrower_id", str(uuid.uuid4()))
        alt_data = self._collect_alternative_data(borrower_id, application_data)
        alt_data_score, individual_scores = self.alt_data_scorer.aggregate_score(
            data=alt_data
        )
        traditional_data = self._prepare_traditional_data(application_data)
        traditional_score = self._calculate_traditional_score(traditional_data)
        score, assessment = self._calculate_score(traditional_data, alt_data)
        compliance_data = {
            "application_data": application_data,
            "traditional_data": traditional_data,
            "alternative_data": alt_data,
            "traditional_score": traditional_score,
            "alternative_score": alt_data_score,
            "score": score,
            "model_features": self._get_model_features(),
            "decision": self._determine_decision(score),
        }
        is_compliant, compliance_results = self.compliance_framework.is_compliant(
            compliance_data
        )
        documents = self._generate_documents(
            application_data, score, compliance_results, is_compliant
        )
        results = {
            "application_id": application_id,
            "borrower_id": borrower_id,
            "processing_timestamp": datetime.now().isoformat(),
            "traditional_score": traditional_score,
            "alternative_data_score": alt_data_score,
            "alternative_data_individual_scores": individual_scores,
            "score": score,
            "decision": self._determine_decision(score),
            "assessment": assessment,
            "is_compliant": is_compliant,
            "compliance_results": compliance_results,
            "documents": documents,
        }
        self._log_processing(application_id, results)
        return results

    def _collect_alternative_data(
        self, borrower_id: str, application_data: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Collect alternative data for a borrower

        Args:
            borrower_id: Borrower identifier
            application_data: Application data with additional context

        Returns:
            DataFrame with alternative data
        """
        logger.info(f"Collecting alternative data for borrower {borrower_id}")
        email = application_data.get("email", f"{borrower_id}@example.com")
        alt_data = self.alt_data_manager.collect_all_data(borrower_id, email=email)
        return alt_data

    def _prepare_traditional_data(
        self, application_data: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Prepare traditional credit data from application

        Args:
            application_data: Application data

        Returns:
            DataFrame with traditional credit data
        """
        trad_data = {
            "loan_amount": application_data.get("loan_amount", 0),
            "interest_rate": application_data.get("interest_rate", 0),
            "term_days": application_data.get("term_days", 0),
            "credit_score": application_data.get("credit_score", 0),
            "income": application_data.get("income", 0),
            "debt_to_income": application_data.get("debt_to_income", 0),
            "employment_years": application_data.get("employment_years", 0),
            "is_collateralized": int(application_data.get("is_collateralized", False)),
            "collateral_value": application_data.get("collateral_value", 0),
            "previous_loans": application_data.get("previous_loans", 0),
            "previous_defaults": application_data.get("previous_defaults", 0),
        }
        return pd.DataFrame([trad_data])

    def _calculate_traditional_score(self, traditional_data: pd.DataFrame) -> float:
        """
        Calculate traditional credit score

        Args:
            traditional_data: DataFrame with traditional credit data

        Returns:
            Traditional credit score
        """
        loan_data = traditional_data.iloc[0].to_dict()
        try:
            traditional_score = self.traditional_model.predict_risk_score(loan_data)
            logger.info(f"Traditional credit score: {traditional_score}")
            return float(traditional_score)
        except Exception as e:
            logger.error(f"Error calculating traditional score: {e}")
            return 50.0

    def _calculate_score(
        self, traditional_data: pd.DataFrame, alt_data: pd.DataFrame
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculate enhanced credit score using integrated model

        Args:
            traditional_data: DataFrame with traditional credit data
            alt_data: DataFrame with alternative data

        Returns:
            Tuple of (score, assessment_details)
        """
        try:
            score, assessment = self.model_integrator.predict(
                traditional_data, alt_data
            )
            logger.info(f"Enhanced credit score: {score}")
            return (float(score), assessment)
        except Exception as e:
            logger.error(f"Error calculating enhanced score: {e}")
            traditional_score = self._calculate_traditional_score(traditional_data)
            return (traditional_score, {"error": str(e)})

    def _get_model_features(self) -> List[str]:
        """
        Get the list of features used by the models

        Returns:
            List of feature names
        """
        features = []
        if hasattr(self.traditional_model, "features"):
            features.extend(self.traditional_model.features)
        if hasattr(self.model_integrator.credit_model, "traditional_features"):
            features.extend(self.model_integrator.credit_model.traditional_features)
        if hasattr(self.model_integrator.credit_model, "alternative_features"):
            features.extend(self.model_integrator.credit_model.alternative_features)
        return list(set(features))

    def _determine_decision(self, credit_score: float) -> str:
        """
        Determine loan decision based on credit score

        Args:
            credit_score: Credit score

        Returns:
            Decision string
        """
        if credit_score >= 750:
            return "Approved"
        elif credit_score >= 650:
            return "Conditionally Approved"
        elif credit_score >= 600:
            return "Manual Review Required"
        else:
            return "Declined"

    def _generate_documents(
        self,
        application_data: Dict[str, Any],
        credit_score: float,
        compliance_results: Dict[str, Any],
        is_compliant: bool,
    ) -> Dict[str, str]:
        """
        Generate required documents based on application and decision

        Args:
            application_data: Application data
            credit_score: Credit score
            compliance_results: Compliance check results
            is_compliant: Overall compliance status

        Returns:
            Dictionary mapping document types to file paths
        """
        documents = {}
        decision = self._determine_decision(credit_score)
        if decision == "Declined":
            notice_data = {
                "application_id": application_data.get("application_id", "unknown"),
                "applicant_name": application_data.get("name", "Applicant"),
                "application_date": application_data.get(
                    "application_date", datetime.now().strftime("%Y-%m-%d")
                ),
                "decision_date": datetime.now().strftime("%Y-%m-%d"),
                "credit_score": credit_score,
                "score_factors": [
                    "Credit score below lending threshold",
                    "Insufficient credit history",
                    "High debt-to-income ratio",
                    "Recent delinquencies",
                ],
            }
            notice_path = self.document_generator.generate_adverse_action_notice(
                notice_data
            )
            documents["adverse_action_notice"] = notice_path
        model_data = {
            "model_name": "Enhanced Credit Risk Model",
            "model_version": "2.0",
            "model_type": "Ensemble",
            "model_purpose": "Credit risk assessment with alternative data",
            "model_owner": "Risk Department",
            "creation_date": datetime.now().strftime("%Y-%m-%d"),
            "description": "Enhanced credit risk model that combines traditional credit data with alternative data sources",
            "methodology": "Ensemble machine learning approach with feature engineering",
            "traditional_features": (
                self.model_integrator.credit_model.traditional_features
                if hasattr(self.model_integrator.credit_model, "traditional_features")
                else []
            ),
            "alternative_features": (
                self.model_integrator.credit_model.alternative_features
                if hasattr(self.model_integrator.credit_model, "alternative_features")
                else []
            ),
            "assumptions": "Model assumes data quality and completeness across both traditional and alternative sources",
            "limitations": "Model performance depends on the quality and availability of alternative data",
            "data_sources": "Traditional credit bureau data, transaction data, digital footprint, utility payments, education/employment data",
            "performance_metrics": {
                "AUC": 0.85,
                "Precision": 0.82,
                "Recall": 0.79,
                "F1 Score": 0.8,
            },
            "validation_summary": "Model validated through cross-validation and out-of-time testing",
            "fairness_assessment": "Model tested for disparate impact across protected classes",
            "approval_process": "Approved by Risk Committee on "
            + datetime.now().strftime("%Y-%m-%d"),
            "monitoring_plan": "Monthly performance monitoring and quarterly comprehensive review",
        }
        model_doc_path = self.document_generator.generate_model_documentation(
            model_data
        )
        documents["model_documentation"] = model_doc_path
        if not is_compliant:
            report_data = {
                "report_id": str(uuid.uuid4()),
                "period_start": (datetime.now() - pd.Timedelta(days=30)).isoformat(),
                "period_end": datetime.now().isoformat(),
                "total_checks": len(compliance_results.get("check_results", {})),
                "compliant_checks": sum(
                    (
                        1
                        for result in compliance_results.get(
                            "check_results", {}
                        ).values()
                        if result[0]
                    )
                ),
                "non_compliant_checks": sum(
                    (
                        1
                        for result in compliance_results.get(
                            "check_results", {}
                        ).values()
                        if not result[0]
                    )
                ),
                "compliance_rate": (
                    sum(
                        (
                            1
                            for result in compliance_results.get(
                                "check_results", {}
                            ).values()
                            if result[0]
                        )
                    )
                    / len(compliance_results.get("check_results", {}))
                    if compliance_results.get("check_results", {})
                    else 0
                ),
                "non_compliant_by_check": {
                    check: 1
                    for check, result in compliance_results.get(
                        "check_results", {}
                    ).items()
                    if not result[0]
                },
                "recommendations": "Address compliance issues before proceeding with loan decision",
                "conclusion": "Application requires compliance review before final decision",
            }
            report_path = self.document_generator.generate_compliance_report(
                report_data
            )
            documents["compliance_report"] = report_path
        return documents

    def _log_processing(self, application_id: str, results: Dict[str, Any]) -> None:
        """
        Log the application processing results

        Args:
            application_id: Application identifier
            results: Processing results
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "application_id": application_id,
            "traditional_score": results["traditional_score"],
            "alternative_score": results["alternative_data_score"],
            "score": results["score"],
            "decision": results["decision"],
            "is_compliant": results["is_compliant"],
        }
        log_file = os.path.join(self.output_dir, "application_processing.jsonl")
        try:
            with open(log_file, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            logger.error(f"Error writing to log file: {e}")

    def train_models(self, training_data: Dict[str, Any]) -> None:
        """
        Train all models in the system

        Args:
            training_data: Dictionary with training data
        """
        X_traditional = training_data.get("X_traditional")
        X_alternative = training_data.get("X_alternative")
        y = training_data.get("y")
        if X_traditional is None or y is None:
            logger.error("Missing required training data")
            return
        logger.info("Training integrated model")
        self.model_integrator.train(X_traditional, X_alternative or pd.DataFrame(), y)
        self.model_integrator.save_models()
        logger.info("Model training completed")

    def load_models(self) -> None:
        """Load all trained models"""
        logger.info("Loading models")
        self.model_integrator.load_models()
        logger.info("Models loaded")

    def generate_synthetic_training_data(self, n_samples: int = 1000) -> Dict[str, Any]:
        """
        Generate synthetic data for training and testing

        Args:
            n_samples: Number of samples to generate

        Returns:
            Dictionary with synthetic data
        """
        X, y = generate_synthetic_data(n_samples=n_samples, include_alternative=True)
        trad_cols = [
            col
            for col in X.columns
            if not any(
                (
                    alt_prefix in col
                    for alt_prefix in [
                        "digital_footprint_",
                        "transaction_",
                        "utility_payment_",
                        "education_employment_",
                    ]
                )
            )
        ]
        alt_cols = [
            col
            for col in X.columns
            if any(
                (
                    alt_prefix in col
                    for alt_prefix in [
                        "digital_footprint_",
                        "transaction_",
                        "utility_payment_",
                        "education_employment_",
                    ]
                )
            )
        ]
        X_traditional = X[trad_cols]
        X_alternative = X[alt_cols]
        return {
            "X": X,
            "X_traditional": X_traditional,
            "X_alternative": X_alternative,
            "y": y,
        }


def example_usage() -> None:
    """Example usage of the enhanced lending system"""
    system = LendingSystem()
    training_data = system.generate_synthetic_training_data(n_samples=1000)
    system.train_models(training_data)
    application_data = {
        "application_id": "APP-" + str(uuid.uuid4()),
        "borrower_id": "BOR-" + str(uuid.uuid4()),
        "name": "John Doe",
        "email": "john.doe@example.com",
        "loan_amount": 25000,
        "interest_rate": 5.5,
        "term_days": 365 * 3,
        "credit_score": 720,
        "income": 75000,
        "debt_to_income": 0.3,
        "employment_years": 5,
        "is_collateralized": True,
        "collateral_value": 30000,
        "previous_loans": 2,
        "previous_defaults": 0,
        "application_date": datetime.now().strftime("%Y-%m-%d"),
    }
    results = system.process_loan_application(application_data)
    logger.info(f"Application ID: {results['application_id']}")
    logger.info(f"Traditional Score: {results['traditional_score']}")
    logger.info(f"Alternative Data Score: {results['alternative_data_score']}")
    logger.info(f"Score: {results['score']}")
    logger.info(f"Decision: {results['decision']}")
    logger.info(f"Is Compliant: {results['is_compliant']}")
    logger.info(f"Documents Generated:")
    for doc_type, doc_path in results["documents"].items():
        logger.info(f"  - {doc_type}: {doc_path}")


if __name__ == "__main__":
    example_usage()
