import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import joblib
import os

def preprocess_data(data):
    """Preprocess the data for model training or prediction"""
    # Handle missing values
    imputer = SimpleImputer(strategy='median')
    numeric_features = ['income', 'credit_score', 'loan_amount', 'employment_years']
    data[numeric_features] = imputer.fit_transform(data[numeric_features])
    
    # Feature engineering
    if 'existing_debt' in data.columns:
        data['debt_to_income'] = data['existing_debt'] / data['income']
    else:
        data['debt_to_income'] = 0  # Default value if no debt information
    
    # Normalize features
    scaler = StandardScaler()
    data[numeric_features] = scaler.fit_transform(data[numeric_features])
    
    return data

def train_model():
    """Train the risk assessment model and save it"""
    # Create sample data if the real data is just a placeholder
    try:
        data_path = os.path.join(os.path.dirname(__file__), '../../resources/datasets/borrower_data.csv')
        data = pd.read_csv(data_path)
        
        # Check if data is placeholder
        if len(data) < 10 or 'Placeholder' in str(data.iloc[0]):
            print("Creating synthetic dataset for model training...")
            data = create_synthetic_data()
    except Exception as e:
        print(f"Error loading data: {e}")
        print("Creating synthetic dataset for model training...")
        data = create_synthetic_data()
    
    # Preprocess data
    data = preprocess_data(data)
    
    # Define features and target
    X = data[['income', 'credit_score', 'loan_amount', 'employment_years', 'debt_to_income']]
    y = data['default']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Model training score: {train_score:.4f}")
    print(f"Model testing score: {test_score:.4f}")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), '../risk_assessment_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    return model

def create_synthetic_data(n_samples=1000):
    """Create synthetic data for model training"""
    np.random.seed(42)
    
    # Generate features
    income = np.random.normal(50000, 20000, n_samples)
    credit_score = np.random.normal(700, 100, n_samples).clip(300, 850)
    loan_amount = np.random.normal(10000, 5000, n_samples).clip(1000, None)
    employment_years = np.random.exponential(5, n_samples).clip(0, 40)
    existing_debt = np.random.normal(15000, 10000, n_samples).clip(0, None)
    
    # Calculate debt to income ratio
    debt_to_income = existing_debt / income
    
    # Generate default probability based on features
    default_prob = (
        -0.1 * (income / 10000) +  # Higher income reduces default risk
        -0.2 * (credit_score / 100) +  # Higher credit score reduces default risk
        0.15 * (loan_amount / 10000) +  # Higher loan amount increases default risk
        -0.1 * employment_years +  # Longer employment reduces default risk
        0.3 * debt_to_income  # Higher debt-to-income increases default risk
    )
    
    # Normalize and convert to probability
    default_prob = 1 / (1 + np.exp(-default_prob))
    
    # Generate default labels
    default = (np.random.random(n_samples) < default_prob).astype(int)
    
    # Create DataFrame
    data = pd.DataFrame({
        'income': income,
        'credit_score': credit_score,
        'loan_amount': loan_amount,
        'employment_years': employment_years,
        'existing_debt': existing_debt,
        'default': default
    })
    
    # Save synthetic data
    data_path = os.path.join(os.path.dirname(__file__), '../../resources/datasets/borrower_data.csv')
    data.to_csv(data_path, index=False)
    print(f"Synthetic data saved to {data_path}")
    
    return data

if __name__ == '__main__':
    train_model()
