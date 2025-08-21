import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import os

def preprocess_data(input_path=None, data=None):
    """
    Preprocess data for model training or prediction
    
    Args:
        input_path: Path to CSV file (optional)
        data: DataFrame object (optional)
        
    Returns:
        Preprocessed DataFrame
    """
    if input_path is not None:
        df = pd.read_csv(input_path)
    elif data is not None:
        df = data.copy()
    else:
        raise ValueError("Either input_path or data must be provided")
    
    # Handle missing data
    numeric_features = ['income', 'credit_score']
    if all(feature in df.columns for feature in numeric_features):
        imputer = SimpleImputer(strategy='median')
        df[numeric_features] = imputer.fit_transform(df[numeric_features])
    
    # Feature engineering
    if 'existing_debt' in df.columns and 'income' in df.columns:
        df['debt_to_income'] = df['existing_debt'] / df['income']
    
    # Normalization
    if all(feature in df.columns for feature in numeric_features):
        scaler = StandardScaler()
        df[numeric_features] = scaler.fit_transform(df[numeric_features])
    
    return df

def prepare_features_for_prediction(data):
    """
    Prepare features for model prediction
    
    Args:
        data: Dictionary or DataFrame with loan application data
        
    Returns:
        DataFrame with features ready for model prediction
    """
    if isinstance(data, dict):
        # Convert dictionary to DataFrame
        df = pd.DataFrame([data])
    else:
        df = data.copy()
    
    # Ensure required columns exist
    required_columns = ['income', 'credit_score', 'loan_amount', 'employment_years']
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    # Add debt_to_income if not present
    if 'debt_to_income' not in df.columns:
        if 'existing_debt' in df.columns:
            df['debt_to_income'] = df['existing_debt'] / df['income']
        else:
            df['debt_to_income'] = 0  # Default value if no debt information
    
    # Normalize features
    scaler = StandardScaler()
    df[required_columns] = scaler.fit_transform(df[required_columns])
    
    return df

if __name__ == "__main__":
    # Example usage
    input_path = os.path.join(os.path.dirname(__file__), '../../resources/datasets/borrower_data.csv')
    processed_data = preprocess_data(input_path=input_path)
    print(processed_data.head())
