import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

def train_model():
    data = pd.read_csv('../../resources/datasets/borrower_data.csv')
    X = data[['income', 'credit_score', 'loan_amount', 'employment_years']]
    y = data['default']
    
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)
    
    joblib.dump(model, '../../risk_assessment_model.pkl')

if __name__ == '__main__':
    train_model()