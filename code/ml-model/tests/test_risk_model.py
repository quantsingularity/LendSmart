import unittest
import pandas as pd
import numpy as np
import os
import sys
import tempfile
from sklearn.metrics import roc_auc_score

# Add the parent directory to the path so we can import the risk_model module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.risk_model import LoanRiskModel

class TestLoanRiskModel(unittest.TestCase):
    """Test cases for the LoanRiskModel class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.model = LoanRiskModel()
        
        # Create a small synthetic dataset for testing
        X, y = self.model.generate_synthetic_training_data(n_samples=200)
        self.X_test = X
        self.y_test = y
    
    def test_model_initialization(self):
        """Test that the model initializes correctly"""
        self.assertIsNone(self.model.model)
        self.assertIsInstance(self.model.features, list)
        self.assertTrue(len(self.model.features) > 0)
    
    def test_data_preprocessing(self):
        """Test data preprocessing functionality"""
        # Create data with missing values
        data = self.X_test.copy()
        data.loc[0:10, 'loan_amount'] = np.nan
        data.loc[5:15, 'borrower_income'] = np.nan
        
        # Preprocess the data
        processed_data = self.model.preprocess_data(data)
        
        # Check that there are no missing values
        self.assertEqual(processed_data.isna().sum().sum(), 0)
        
        # Check that boolean columns are converted to int
        self.assertEqual(processed_data['is_collateralized'].dtype, np.int64)
        
        # Check that collateral ratio is calculated
        self.assertIn('collateral_value_to_loan_ratio', processed_data.columns)
    
    def test_model_training(self):
        """Test model training functionality"""
        # Train the model on synthetic data
        self.model.train(self.X_test, self.y_test)
        
        # Check that the model is trained
        self.assertIsNotNone(self.model.model)
        
        # Preprocess and ensure feature alignment for prediction
        X_processed = self.model.preprocess_data(self.X_test)
        
        # Ensure all features are present and in the correct order
        for feature in self.model.features:
            if feature not in X_processed.columns:
                X_processed[feature] = 0
        
        # Reorder columns to match self.features exactly
        X_processed = X_processed[self.model.features]
        
        # Make predictions on the training data
        y_pred_proba = self.model.model.predict_proba(X_processed)[:, 1]
        
        # Check that the AUC score is reasonable (> 0.7)
        auc = roc_auc_score(self.y_test, y_pred_proba)
        self.assertGreater(auc, 0.7)
    
    def test_risk_score_prediction(self):
        """Test risk score prediction functionality"""
        # Train the model first
        self.model.train(self.X_test, self.y_test)
        
        # Create a sample loan application
        loan_application = {
            'loan_amount': 10000,
            'interest_rate': 5,
            'term_days': 365,
            'borrower_credit_score': 720,
            'borrower_income': 75000,
            'borrower_debt_to_income': 0.3,
            'borrower_employment_years': 5,
            'is_collateralized': 1,
            'collateral_value': 15000,
            'borrower_previous_loans': 2,
            'borrower_previous_defaults': 0
        }
        
        # Predict risk score
        risk_score = self.model.predict_risk_score(loan_application)
        
        # Check that the risk score is between 0 and 100
        self.assertGreaterEqual(risk_score, 0)
        self.assertLessEqual(risk_score, 100)
        
        # Create a riskier loan application
        risky_loan = loan_application.copy()
        risky_loan['borrower_credit_score'] = 550
        risky_loan['borrower_debt_to_income'] = 0.6
        risky_loan['borrower_previous_defaults'] = 2
        risky_loan['is_collateralized'] = 0
        
        # Predict risk score for risky loan
        risky_score = self.model.predict_risk_score(risky_loan)
        
        # Check that the risky loan has a lower score
        self.assertLess(risky_score, risk_score)
    
    def test_model_save_load(self):
        """Test model saving and loading functionality"""
        # Train the model
        self.model.train(self.X_test, self.y_test)
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.joblib') as tmp:
            # Save the model
            self.model.save_model(tmp.name)
            
            # Create a new model instance
            new_model = LoanRiskModel()
            
            # Load the model
            new_model.load_model(tmp.name)
            
            # Check that the loaded model can make predictions
            loan_application = {
                'loan_amount': 10000,
                'interest_rate': 5,
                'term_days': 365,
                'borrower_credit_score': 720,
                'borrower_income': 75000,
                'borrower_debt_to_income': 0.3,
                'borrower_employment_years': 5,
                'is_collateralized': 1,
                'collateral_value': 15000,
                'borrower_previous_loans': 2,
                'borrower_previous_defaults': 0
            }
            
            # Predict with both models
            score1 = self.model.predict_risk_score(loan_application)
            score2 = new_model.predict_risk_score(loan_application)
            
            # Check that the predictions are the same
            self.assertEqual(score1, score2)
    
    def test_synthetic_data_generation(self):
        """Test synthetic data generation functionality"""
        # Generate synthetic data
        X, y = self.model.generate_synthetic_training_data(n_samples=500)
        
        # Check that the data has the correct shape
        self.assertEqual(len(X), 500)
        self.assertEqual(len(y), 500)
        
        # Check that all required features are present
        for feature in self.model.features:
            self.assertIn(feature, X.columns)
        
        # Check that the target variable is binary
        self.assertTrue(set(y.unique()).issubset({0, 1}))
        
        # Check that there's a reasonable class distribution
        # (not all 0s or all 1s)
        self.assertTrue(0.05 <= y.mean() <= 0.5)
    
    def test_error_handling(self):
        """Test error handling in the model"""
        # Create a new model instance to ensure it's untrained
        untrained_model = LoanRiskModel()
        
        # Test prediction without training
        with self.assertRaises(ValueError):
            untrained_model.predict_risk_score({
                'loan_amount': 10000,
                'interest_rate': 5,
                'term_days': 365,
                'borrower_credit_score': 720,
                'borrower_income': 75000,
                'borrower_debt_to_income': 0.3,
                'borrower_employment_years': 5,
                'is_collateralized': 1,
                'collateral_value': 15000,
                'borrower_previous_loans': 2,
                'borrower_previous_defaults': 0
            })
        
        # Train the model for subsequent tests
        self.model.train(self.X_test, self.y_test)
        
        # Test saving without a trained model
        with self.assertRaises(ValueError):
            untrained_model.save_model('test.joblib')

if __name__ == '__main__':
    unittest.main()
