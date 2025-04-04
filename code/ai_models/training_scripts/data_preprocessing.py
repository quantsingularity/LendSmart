import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

def preprocess_data(input_path):
    df = pd.read_csv(input_path)
    
    # Handle missing data
    imputer = SimpleImputer(strategy='median')
    df[['income', 'credit_score']] = imputer.fit_transform(df[['income', 'credit_score']])
    
    # Feature engineering
    df['debt_to_income'] = df['existing_debt'] / df['income']
    
    # Normalization
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(df[['income', 'credit_score', 'debt_to_income']])
    
    return pd.DataFrame(scaled_features, columns=['income_norm', 'credit_norm', 'dti_norm'])