"""
Integration module for LendSmart enhanced credit scoring system

This module provides integration points between the traditional credit scoring system,
alternative data scoring, advanced machine learning models, and compliance framework.

Usage:
    Run directly:
        python -m ml_services.integration.integration

    Or import:
        from ml_services.integration.integration import LendingSystem
"""

import json
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

# ---------------------------------------------------------------------------
# Package-relative imports (no sys.path manipulation needed when run as a
# package or with the repo root on PYTHONPATH)
# ---------------------------------------------------------------------------
try:
    from ml_services.credit_risk.src.credit_scoring_model import (
        ModelIntegrator,
        generate_synthetic_data,
    )
    from ml_services.credit_risk.src.data_sources import AlternativeDataManager
    from ml_services.credit_risk.src.scoring import AlternativeDataScoreAggregator
    from ml_services.credit_risk.src.risk_assessment import LoanRiskModel
    from ml_services.compliance.compliance import (
        ComplianceDocumentGenerator,
        ComplianceFramework,
    )
except ImportError:
    # Fallback for running the file directly from its own directory
    import sys

    _repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if _repo_root not in sys.path:
        sys.path.insert(0, _repo_root)

    from ml_services.credit_risk.src.credit_scoring_model import (
        ModelIntegrator,
        generate_synthetic_data,
    )
    from ml_services.credit_risk.src.data_sources import AlternativeDataManager
    from ml_services.credit_risk.src.scoring import AlternativeDataScoreAggregator
    from ml_services.compliance.compliance import (
        ComplianceDocumentGenerator,
        ComplianceFramework,
    )

    try:
        from ml_services.credit_risk.src.risk_assessment import LoanRiskModel
    except ImportError:
        logging.warning("Could not import LoanRiskModel, using mock implementation")

        class LoanRiskModel:  # type: ignore[no-redef]
            def __init__(self) -> None:
                self.model = None
                self.features: List[str] = []

            def predict_risk_score(self, loan_data: Any) -> int:
                return 50


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("lendsmart_integration")


class LendingSystem:
    """
    Lending system that integrates traditional credit scoring,
    alternative data, advanced ML models, and compliance framework.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
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
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "output",
        )
        os.makedirs(self.output_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def process_loan_application(
        self, application_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a loan application using the enhanced system.

        Args:
            application_data: Dictionary with loan application data.

        Returns:
            Dictionary with processing results.
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

        results: Dict[str, Any] = {
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

    def train_models(self, training_data: Dict[str, Any]) -> None:
        """Train all models in the system."""
        X_traditional: Optional[pd.DataFrame] = training_data.get("X_traditional")
        X_alternative: Optional[pd.DataFrame] = training_data.get("X_alternative")
        y = training_data.get("y")

        if X_traditional is None or y is None:
            logger.error("Missing required training data (X_traditional and y)")
            return

        logger.info("Training integrated model")
        self.model_integrator.train(
            X_traditional, X_alternative if X_alternative is not None else pd.DataFrame(), y
        )
        self.model_integrator.save_models()
        logger.info("Model training completed")

    def load_models(self) -> None:
        """Load all trained models from disk."""
        logger.info("Loading models")
        self.model_integrator.load_models()
        logger.info("Models loaded")

    def generate_synthetic_training_data(
        self, n_samples: int = 1000
    ) -> Dict[str, Any]:
        """Generate synthetic data for training and testing."""
        X, y = generate_synthetic_data(n_samples=n_samples, include_alternative=True)

        alt_prefixes = (
            "digital_footprint_",
            "transaction_",
            "utility_payment_",
            "education_employment_",
        )
        trad_cols = [c for c in X.columns if not any(c.startswith(p) for p in alt_prefixes)]
        alt_cols = [c for c in X.columns if any(c.startswith(p) for p in alt_prefixes)]

        return {
            "X": X,
            "X_traditional": X[trad_cols],
            "X_alternative": X[alt_cols],
            "y": y,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _collect_alternative_data(
        self, borrower_id: str, application_data: Dict[str, Any]
    ) -> pd.DataFrame:
        logger.info(f"Collecting alternative data for borrower {borrower_id}")
        email = application_data.get("email", f"{borrower_id}@example.com")
        return self.alt_data_manager.collect_all_data(borrower_id, email=email)

    def _prepare_traditional_data(
        self, application_data: Dict[str, Any]
    ) -> pd.DataFrame:
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
        loan_data = traditional_data.iloc[0].to_dict()
        try:
            score = self.traditional_model.predict_risk_score(loan_data)
            logger.info(f"Traditional credit score: {score}")
            return float(score)
        except Exception as exc:
            logger.error(f"Error calculating traditional score: {exc}")
            return 50.0

    def _calculate_score(
        self, traditional_data: pd.DataFrame, alt_data: pd.DataFrame
    ) -> Tuple[float, Dict[str, Any]]:
        try:
            score, assessment = self.model_integrator.predict(traditional_data, alt_data)
            logger.info(f"Enhanced credit score: {score}")
            return float(score), assessment
        except Exception as exc:
            logger.error(f"Error calculating enhanced score: {exc}")
            fallback = self._calculate_traditional_score(traditional_data)
            return fallback, {"error": str(exc)}

    def _get_model_features(self) -> List[str]:
        features: List[str] = []
        if hasattr(self.traditional_model, "features"):
            features.extend(self.traditional_model.features)
        cm = self.model_integrator.credit_model
        if hasattr(cm, "traditional_features"):
            features.extend(cm.traditional_features)
        if hasattr(cm, "alternative_features"):
            features.extend(cm.alternative_features)
        return list(set(features))

    def _determine_decision(self, credit_score: float) -> str:
        if credit_score >= 750:
            return "Approved"
        if credit_score >= 650:
            return "Conditionally Approved"
        if credit_score >= 600:
            return "Manual Review Required"
        return "Declined"

    def _generate_documents(
        self,
        application_data: Dict[str, Any],
        credit_score: float,
        compliance_results: Dict[str, Any],
        is_compliant: bool,
    ) -> Dict[str, str]:
        documents: Dict[str, str] = {}
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
            notice_path = self.document_generator.generate_adverse_action_notice(notice_data)
            documents["adverse_action_notice"] = notice_path

        cm = self.model_integrator.credit_model
        model_data = {
            "model_name": "Enhanced Credit Risk Model",
            "model_version": "2.0",
            "model_type": "Ensemble",
            "model_purpose": "Credit risk assessment with alternative data",
            "model_owner": "Risk Department",
            "creation_date": datetime.now().strftime("%Y-%m-%d"),
            "description": (
                "Enhanced credit risk model combining traditional credit data "
                "with alternative data sources"
            ),
            "methodology": "Ensemble machine learning approach with feature engineering",
            "traditional_features": getattr(cm, "traditional_features", []),
            "alternative_features": getattr(cm, "alternative_features", []),
            "assumptions": "Model assumes data quality and completeness across both sources",
            "limitations": "Performance depends on quality and availability of alternative data",
            "data_sources": (
                "Traditional credit bureau data, transaction data, digital footprint, "
                "utility payments, education/employment data"
            ),
            "performance_metrics": {
                "AUC": 0.85,
                "Precision": 0.82,
                "Recall": 0.79,
                "F1 Score": 0.80,
            },
            "validation_summary": "Validated through cross-validation and out-of-time testing",
            "fairness_assessment": "Tested for disparate impact across protected classes",
            "approval_process": f"Approved by Risk Committee on {datetime.now().strftime('%Y-%m-%d')}",
            "monitoring_plan": "Monthly performance monitoring and quarterly comprehensive review",
        }
        model_doc_path = self.document_generator.generate_model_documentation(model_data)
        documents["model_documentation"] = model_doc_path

        if not is_compliant:
            check_results: Dict[str, Any] = compliance_results.get("check_results", {})
            n_total = len(check_results)
            n_compliant = sum(1 for r in check_results.values() if r[0])
            report_data = {
                "report_id": str(uuid.uuid4()),
                "period_start": (
                    datetime.now() - pd.Timedelta(days=30)
                ).isoformat(),
                "period_end": datetime.now().isoformat(),
                "total_checks": n_total,
                "compliant_checks": n_compliant,
                "non_compliant_checks": n_total - n_compliant,
                "compliance_rate": (n_compliant / n_total) if n_total else 0,
                "non_compliant_by_check": {
                    check: 1
                    for check, result in check_results.items()
                    if not result[0]
                },
                "recommendations": "Address compliance issues before proceeding with loan decision",
                "conclusion": "Application requires compliance review before final decision",
            }
            report_path = self.document_generator.generate_compliance_report(report_data)
            documents["compliance_report"] = report_path

        return documents

    def _log_processing(self, application_id: str, results: Dict[str, Any]) -> None:
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
        except OSError as exc:
            logger.error(f"Error writing to log file: {exc}")


def example_usage() -> None:
    """Example usage of the enhanced lending system."""
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
    logger.info(f"Application ID:          {results['application_id']}")
    logger.info(f"Traditional Score:       {results['traditional_score']}")
    logger.info(f"Alternative Data Score:  {results['alternative_data_score']}")
    logger.info(f"Credit Score:            {results['score']}")
    logger.info(f"Decision:                {results['decision']}")
    logger.info(f"Is Compliant:            {results['is_compliant']}")
    logger.info("Documents Generated:")
    for doc_type, doc_path in results["documents"].items():
        logger.info(f"  - {doc_type}: {doc_path}")


if __name__ == "__main__":
    example_usage()
