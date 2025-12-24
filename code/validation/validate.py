"""
Validation script for LendSmart enhanced credit scoring system

This script validates the functionality and completeness of the integrated system,
including alternative data scoring, machine learning models, and compliance framework.
"""

import json
import logging
import os
import sys
import uuid
from datetime import datetime
from typing import Any
import pandas as pd

sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "integration"
    )
)
sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "alternative_data_scoring",
        "src",
    )
)
sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "ml_models",
        "src",
    )
)
sys.path.append(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "compliance_framework",
        "src",
    )
)
try:
    from compliance import ComplianceDocumentGenerator, ComplianceFramework
    from data_sources import AlternativeDataManager
    from models import CreditScoringModel
    from integration import LendingSystem
    from scoring import AlternativeDataScoreAggregator

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("validation")
    validation_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "validation_results",
    )
    os.makedirs(validation_dir, exist_ok=True)

    def validate_alternative_data_sources() -> Any:
        """Validate alternative data sources functionality"""
        logger.info("Validating alternative data sources...")
        try:
            data_manager = AlternativeDataManager()
            assert (
                len(data_manager.data_sources) >= 4
            ), "Expected at least 4 default data sources"
            borrower_id = f"test-borrower-{uuid.uuid4()}"
            data = data_manager.collect_all_data(borrower_id)
            assert isinstance(data, pd.DataFrame), "Expected DataFrame result"
            assert not data.empty, "Expected non-empty DataFrame"
            feature_groups = data_manager.get_all_features()
            assert len(feature_groups) >= 4, "Expected features from at least 4 sources"
            logger.info("✓ Alternative data sources validation passed")
            return True
        except Exception as e:
            logger.error(f"Alternative data sources validation failed: {e}")
            return False

    def validate_alternative_data_scoring() -> Any:
        """Validate alternative data scoring functionality"""
        logger.info("Validating alternative data scoring...")
        try:
            data_manager = AlternativeDataManager()
            scorer = AlternativeDataScoreAggregator()
            borrower_id = f"test-borrower-{uuid.uuid4()}"
            data = data_manager.collect_all_data(borrower_id)
            aggregate_score, individual_scores = scorer.aggregate_score(data=data)
            assert (
                0 <= aggregate_score <= 100
            ), f"Aggregate score {aggregate_score} outside valid range 0-100"
            for source, score in individual_scores.items():
                assert (
                    0 <= score <= 100
                ), f"Score for {source} ({score}) outside valid range 0-100"
            report = scorer.generate_score_report(aggregate_score, individual_scores)
            assert isinstance(report, dict), "Expected dictionary report"
            assert "risk_level" in report, "Expected risk level in report"
            logger.info("✓ Alternative data scoring validation passed")
            return True
        except Exception as e:
            logger.error(f"Alternative data scoring validation failed: {e}")
            return False

    def validate_ml_models() -> Any:
        """Validate enhanced machine learning models functionality"""
        logger.info("Validating enhanced ML models...")
        try:
            model = CreditScoringModel()
            from models import generate_synthetic_data

            X, y = generate_synthetic_data(n_samples=200)
            model.train(X, y)
            assert model.model is not None, "Model was not trained properly"
            y_pred = model.predict(X.iloc[:5])
            assert len(y_pred) == 5, f"Expected 5 predictions, got {len(y_pred)}"
            assert all(
                (0 <= p <= 1 for p in y_pred)
            ), "Predictions outside valid range 0-1"
            credit_score = model.calculate_credit_score(y_pred[0])
            assert (
                300 <= credit_score <= 850
            ), f"Credit score {credit_score} outside valid range 300-850"
            test_path = os.path.join(validation_dir, "test_model.joblib")
            model.save_model(test_path)
            assert os.path.exists(test_path), "Model file was not saved"
            new_model = CreditScoringModel()
            new_model.load_model(test_path)
            assert new_model.model is not None, "Model was not loaded properly"
            logger.info("✓ Enhanced ML models validation passed")
            return True
        except Exception as e:
            logger.error(f"Enhanced ML models validation failed: {e}")
            return False

    def validate_compliance_framework() -> Any:
        """Validate compliance framework functionality"""
        logger.info("Validating compliance framework...")
        try:
            framework = ComplianceFramework()
            checks = framework.get_available_checks()
            assert (
                len(checks) >= 5
            ), f"Expected at least 5 compliance checks, got {len(checks)}"
            test_data = {
                "model_features": ["loan_amount", "income", "credit_score"],
                "permissible_purpose": "credit application",
                "decision": "approve",
                "privacy_notice": {
                    "information_collected": True,
                    "information_sharing_practices": True,
                    "opt_out_rights": True,
                    "security_measures": True,
                    "contact_information": True,
                },
                "data_security_measures": {
                    "encryption": True,
                    "access_controls": True,
                    "data_retention_policy": True,
                    "incident_response_plan": True,
                },
            }
            results = framework.run_all_checks(test_data)
            assert isinstance(results, dict), "Expected dictionary results"
            assert len(results) == len(
                checks
            ), "Number of results doesn't match number of checks"
            doc_generator = ComplianceDocumentGenerator()
            notice_data = {
                "application_id": "test-app",
                "applicant_name": "Test Applicant",
                "application_date": "2025-05-31",
                "decision_date": "2025-05-31",
                "credit_score": 600,
                "score_factors": ["Factor 1", "Factor 2"],
            }
            notice_path = doc_generator.generate_adverse_action_notice(notice_data)
            assert os.path.exists(
                notice_path
            ), "Adverse action notice was not generated"
            logger.info("✓ Compliance framework validation passed")
            return True
        except Exception as e:
            logger.error(f"Compliance framework validation failed: {e}")
            return False

    def validate_integration() -> Any:
        """Validate integration functionality"""
        logger.info("Validating integration...")
        try:
            system = LendingSystem()
            training_data = system.generate_synthetic_training_data(n_samples=200)
            assert (
                "X_traditional" in training_data
            ), "Missing traditional data in training data"
            assert (
                "X_alternative" in training_data
            ), "Missing alternative data in training data"
            assert "y" in training_data, "Missing target variable in training data"
            system.train_models(training_data)
            application_data = {
                "application_id": "APP-TEST",
                "borrower_id": "BOR-TEST",
                "name": "Test Applicant",
                "email": "test@example.com",
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
            assert "application_id" in results, "Missing application ID in results"
            assert (
                "traditional_score" in results
            ), "Missing traditional score in results"
            assert (
                "alternative_data_score" in results
            ), "Missing alternative data score in results"
            assert "score" in results, "Missing score in results"
            assert "decision" in results, "Missing decision in results"
            assert "is_compliant" in results, "Missing compliance status in results"
            assert "documents" in results, "Missing documents in results"
            assert (
                0 <= results["traditional_score"] <= 100
            ), "Traditional score outside valid range"
            assert (
                0 <= results["alternative_data_score"] <= 100
            ), "Alternative score outside valid range"
            assert 300 <= results["score"] <= 850, "Score outside valid range"
            assert results["decision"] in [
                "Approved",
                "Conditionally Approved",
                "Manual Review Required",
                "Declined",
            ], f"Unexpected decision: {results['decision']}"
            logger.info("✓ Integration validation passed")
            return True
        except Exception as e:
            logger.error(f"Integration validation failed: {e}")
            return False

    def run_all_validations() -> Any:
        """Run all validation tests and generate report"""
        logger.info("Starting validation of all components...")
        validation_results = {
            "alternative_data_sources": validate_alternative_data_sources(),
            "alternative_data_scoring": validate_alternative_data_scoring(),
            "ml_models": validate_ml_models(),
            "compliance_framework": validate_compliance_framework(),
            "integration": validate_integration(),
        }
        all_passed = all(validation_results.values())
        report = {
            "timestamp": datetime.now().isoformat(),
            "validation_results": validation_results,
            "all_passed": all_passed,
            "summary": f"Validation {('PASSED' if all_passed else 'FAILED')}: {sum(validation_results.values())}/{len(validation_results)} tests passed",
        }
        report_path = os.path.join(validation_dir, "validation_report.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        logger.info(f"Validation complete: {report['summary']}")
        logger.info(f"Validation report saved to {report_path}")
        return (all_passed, report)

    if __name__ == "__main__":
        run_all_validations()
except ImportError as e:
    logger.info(f"Validation failed: Could not import required modules: {e}")
    sys.exit(1)
