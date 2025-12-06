import os
import sys
import tempfile
import unittest
import numpy as np
from sklearn.metrics import roc_auc_score

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.risk_model import LoanRiskModel


class TestLoanRiskModel(unittest.TestCase):
    """Test cases for the LoanRiskModel class"""

    def setUp(self) -> Any:
        """Set up test fixtures"""
        self.model = LoanRiskModel()
        X, y = self.model.generate_synthetic_training_data(n_samples=200)
        self.X_test = X
        self.y_test = y

    def test_model_initialization(self) -> Any:
        """Test that the model initializes correctly"""
        self.assertIsNone(self.model.model)
        self.assertIsInstance(self.model.features, list)
        self.assertTrue(len(self.model.features) > 0)

    def test_data_preprocessing(self) -> Any:
        """Test data preprocessing functionality"""
        data = self.X_test.copy()
        data.loc[0:10, "loan_amount"] = np.nan
        data.loc[5:15, "borrower_income"] = np.nan
        processed_data = self.model.preprocess_data(data)
        self.assertEqual(processed_data.isna().sum().sum(), 0)
        self.assertEqual(processed_data["is_collateralized"].dtype, np.int64)
        self.assertIn("collateral_value_to_loan_ratio", processed_data.columns)

    def test_model_training(self) -> Any:
        """Test model training functionality"""
        self.model.train(self.X_test, self.y_test)
        self.assertIsNotNone(self.model.model)
        X_processed = self.model.preprocess_data(self.X_test)
        for feature in self.model.features:
            if feature not in X_processed.columns:
                X_processed[feature] = 0
        X_processed = X_processed[self.model.features]
        y_pred_proba = self.model.model.predict_proba(X_processed)[:, 1]
        auc = roc_auc_score(self.y_test, y_pred_proba)
        self.assertGreater(auc, 0.7)

    def test_risk_score_prediction(self) -> Any:
        """Test risk score prediction functionality"""
        self.model.train(self.X_test, self.y_test)
        loan_application = {
            "loan_amount": 10000,
            "interest_rate": 5,
            "term_days": 365,
            "borrower_credit_score": 720,
            "borrower_income": 75000,
            "borrower_debt_to_income": 0.3,
            "borrower_employment_years": 5,
            "is_collateralized": 1,
            "collateral_value": 15000,
            "borrower_previous_loans": 2,
            "borrower_previous_defaults": 0,
        }
        risk_score = self.model.predict_risk_score(loan_application)
        self.assertGreaterEqual(risk_score, 0)
        self.assertLessEqual(risk_score, 100)
        risky_loan = loan_application.copy()
        risky_loan["borrower_credit_score"] = 550
        risky_loan["borrower_debt_to_income"] = 0.6
        risky_loan["borrower_previous_defaults"] = 2
        risky_loan["is_collateralized"] = 0
        risky_score = self.model.predict_risk_score(risky_loan)
        self.assertLess(risky_score, risk_score)

    def test_model_save_load(self) -> Any:
        """Test model saving and loading functionality"""
        self.model.train(self.X_test, self.y_test)
        with tempfile.NamedTemporaryFile(suffix=".joblib") as tmp:
            self.model.save_model(tmp.name)
            new_model = LoanRiskModel()
            new_model.load_model(tmp.name)
            loan_application = {
                "loan_amount": 10000,
                "interest_rate": 5,
                "term_days": 365,
                "borrower_credit_score": 720,
                "borrower_income": 75000,
                "borrower_debt_to_income": 0.3,
                "borrower_employment_years": 5,
                "is_collateralized": 1,
                "collateral_value": 15000,
                "borrower_previous_loans": 2,
                "borrower_previous_defaults": 0,
            }
            score1 = self.model.predict_risk_score(loan_application)
            score2 = new_model.predict_risk_score(loan_application)
            self.assertEqual(score1, score2)

    def test_synthetic_data_generation(self) -> Any:
        """Test synthetic data generation functionality"""
        X, y = self.model.generate_synthetic_training_data(n_samples=500)
        self.assertEqual(len(X), 500)
        self.assertEqual(len(y), 500)
        for feature in self.model.features:
            self.assertIn(feature, X.columns)
        self.assertTrue(set(y.unique()).issubset({0, 1}))
        self.assertTrue(0.05 <= y.mean() <= 0.5)

    def test_error_handling(self) -> Any:
        """Test error handling in the model"""
        untrained_model = LoanRiskModel()
        with self.assertRaises(ValueError):
            untrained_model.predict_risk_score(
                {
                    "loan_amount": 10000,
                    "interest_rate": 5,
                    "term_days": 365,
                    "borrower_credit_score": 720,
                    "borrower_income": 75000,
                    "borrower_debt_to_income": 0.3,
                    "borrower_employment_years": 5,
                    "is_collateralized": 1,
                    "collateral_value": 15000,
                    "borrower_previous_loans": 2,
                    "borrower_previous_defaults": 0,
                }
            )
        self.model.train(self.X_test, self.y_test)
        with self.assertRaises(ValueError):
            untrained_model.save_model("test.joblib")


if __name__ == "__main__":
    unittest.main()
