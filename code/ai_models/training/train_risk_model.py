import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'risk_model_training.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('train_risk_model')

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'ai_models')
OUTPUT_DIR = os.path.join(MODELS_DIR, 'models')
RESOURCES_DIR = os.path.join(BASE_DIR, '..', 'resources', 'datasets')
MODEL_PATH = os.path.join(OUTPUT_DIR, 'risk_assessment_model.pkl')
PREPROCESSOR_PATH = os.path.join(OUTPUT_DIR, 'risk_preprocessor.pkl')
METRICS_PATH = os.path.join(OUTPUT_DIR, 'risk_model_metrics.txt')
CONFUSION_MATRIX_PATH = os.path.join(OUTPUT_DIR, 'risk_confusion_matrix.png')
FEATURE_IMPORTANCE_PATH = os.path.join(OUTPUT_DIR, 'risk_feature_importance.png')

# Ensure directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

def preprocess_data(data):
    """
    Preprocess the data for model training or prediction
    
    Args:
        data (DataFrame): Raw data to preprocess
        
    Returns:
        tuple: (processed_data, preprocessor) - Processed data and preprocessor object
    """
    logger.info("Preprocessing data...")
    
    try:
        # Identify numeric and categorical features
        numeric_features = data.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_features = data.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Remove target from features if present
        if 'default' in numeric_features:
            numeric_features.remove('default')
        
        logger.info(f"Numeric features: {numeric_features}")
        logger.info(f"Categorical features: {categorical_features}")
        
        # Create preprocessing pipelines
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        # Combine preprocessing steps
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features if categorical_features else [])
            ]
        )
        
        # Create feature engineering pipeline
        if 'income' in data.columns and 'existing_debt' in data.columns:
            data['debt_to_income'] = data['existing_debt'] / data['income'].replace(0, 0.001)
        
        if 'loan_amount' in data.columns and 'income' in data.columns:
            data['loan_to_income'] = data['loan_amount'] / data['income'].replace(0, 0.001)
        
        if 'credit_score' in data.columns:
            data['credit_score_normalized'] = data['credit_score'] / 850
        
        # Apply preprocessor
        X = data.drop('default', axis=1) if 'default' in data.columns else data
        processed_data = preprocessor
        
        # Save preprocessor
        joblib.dump(preprocessor, PREPROCESSOR_PATH)
        logger.info(f"Preprocessor saved to {PREPROCESSOR_PATH}")
        
        return X, preprocessor
        
    except Exception as e:
        logger.error(f"Error during preprocessing: {e}")
        return None, None

def train_model():
    """
    Train the risk assessment model and save it
    
    Returns:
        object: Trained model
    """
    logger.info("Starting risk model training...")
    
    try:
        # Load data
        data_path = os.path.join(RESOURCES_DIR, 'borrower_data.csv')
        
        if not os.path.exists(data_path):
            logger.warning(f"Data file not found at {data_path}")
            logger.info("Creating synthetic dataset for model training...")
            data = create_synthetic_data()
        else:
            data = pd.read_csv(data_path)
            
            # Check if data is placeholder or too small
            if len(data) < 100 or 'Placeholder' in str(data.iloc[0]):
                logger.warning("Data appears to be placeholder. Creating synthetic dataset...")
                data = create_synthetic_data()
        
        logger.info(f"Loaded dataset with {len(data)} records and {len(data.columns)} features")
        
        # Preprocess data
        X, preprocessor = preprocess_data(data)
        
        if X is None or preprocessor is None:
            logger.error("Preprocessing failed. Cannot train model.")
            return None
        
        # Define features and target
        features = X.columns.tolist()
        logger.info(f"Using features: {features}")
        
        y = data['default']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        logger.info(f"Training set size: {X_train.shape}, Test set size: {X_test.shape}")
        
        # Apply preprocessor
        X_train_processed = preprocessor.fit_transform(X_train)
        X_test_processed = preprocessor.transform(X_test)
        
        # Define models to evaluate
        models = {
            "RandomForestClassifier": RandomForestClassifier(
                n_estimators=100, 
                random_state=42,
                class_weight="balanced",
                n_jobs=-1
            ),
            "GradientBoostingClassifier": GradientBoostingClassifier(
                n_estimators=100,
                random_state=42
            )
        }
        
        # Hyperparameter grids
        param_grids = {
            "RandomForestClassifier": {
                "n_estimators": [100, 200],
                "max_depth": [None, 10, 20],
                "min_samples_split": [2, 5],
                "min_samples_leaf": [1, 2]
            },
            "GradientBoostingClassifier": {
                "n_estimators": [100, 200],
                "learning_rate": [0.01, 0.1],
                "max_depth": [3, 5]
            }
        }
        
        # Train and evaluate models
        best_model = None
        best_model_name = ""
        best_score = 0
        all_metrics = {}
        
        for model_name, model in models.items():
            logger.info(f"Training {model_name}...")
            
            try:
                # Perform grid search
                cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
                grid_search = GridSearchCV(
                    model,
                    param_grids[model_name],
                    cv=cv,
                    scoring="roc_auc",
                    n_jobs=-1,
                    verbose=1
                )
                
                grid_search.fit(X_train_processed, y_train)
                
                logger.info(f"Best parameters for {model_name}: {grid_search.best_params_}")
                current_model = grid_search.best_estimator_
                
                # Make predictions
                y_pred_train = current_model.predict(X_train_processed)
                y_pred_test = current_model.predict(X_test_processed)
                y_pred_proba_test = current_model.predict_proba(X_test_processed)[:, 1]
                
                # Calculate metrics
                metrics = {
                    "train_accuracy": accuracy_score(y_train, y_pred_train),
                    "test_accuracy": accuracy_score(y_test, y_pred_test),
                    "precision": precision_score(y_test, y_pred_test, zero_division=0),
                    "recall": recall_score(y_test, y_pred_test, zero_division=0),
                    "f1_score": f1_score(y_test, y_pred_test, zero_division=0),
                    "roc_auc": roc_auc_score(y_test, y_pred_proba_test)
                }
                
                all_metrics[model_name] = metrics
                
                logger.info(f"Metrics for {model_name}:")
                for metric_name, value in metrics.items():
                    logger.info(f"  {metric_name}: {value:.4f}")
                
                # Check if this is the best model so far
                if metrics["roc_auc"] > best_score:
                    best_score = metrics["roc_auc"]
                    best_model = current_model
                    best_model_name = model_name
                    
                    # Generate confusion matrix
                    cm = confusion_matrix(y_test, y_pred_test)
                    plt.figure(figsize=(10, 8))
                    sns.heatmap(
                        cm, 
                        annot=True, 
                        fmt="d", 
                        cmap="Blues", 
                        xticklabels=["Non-Default", "Default"], 
                        yticklabels=["Non-Default", "Default"]
                    )
                    plt.title(f"Confusion Matrix - {best_model_name}")
                    plt.xlabel("Predicted Label")
                    plt.ylabel("True Label")
                    plt.savefig(CONFUSION_MATRIX_PATH)
                    plt.close()
                    
                    # Generate feature importance plot if available
                    if hasattr(current_model, 'feature_importances_'):
                        # Get feature names after preprocessing
                        if hasattr(preprocessor, 'get_feature_names_out'):
                            feature_names = preprocessor.get_feature_names_out()
                        else:
                            feature_names = [f"Feature {i}" for i in range(len(current_model.feature_importances_))]
                        
                        # Sort features by importance
                        importances = current_model.feature_importances_
                        indices = np.argsort(importances)[::-1]
                        
                        # Plot top 20 features
                        plt.figure(figsize=(12, 8))
                        plt.title(f"Feature Importance - {best_model_name}")
                        plt.bar(range(min(20, len(indices))), importances[indices[:20]], align="center")
                        plt.xticks(range(min(20, len(indices))), [feature_names[i] for i in indices[:20]], rotation=90)
                        plt.tight_layout()
                        plt.savefig(FEATURE_IMPORTANCE_PATH)
                        plt.close()
            
            except Exception as e:
                logger.error(f"Error training {model_name}: {e}")
                continue
        
        # Save best model
        if best_model:
            logger.info(f"Best model: {best_model_name} with ROC AUC: {best_score:.4f}")
            joblib.dump(best_model, MODEL_PATH)
            logger.info(f"Model saved to {MODEL_PATH}")
            
            # Save metrics report
            with open(METRICS_PATH, "w") as f:
                f.write("=== Risk Assessment Model Evaluation ===\n\n")
                f.write(f"Training date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Best model: {best_model_name}\n\n")
                
                for model_name, metrics in all_metrics.items():
                    f.write(f"--- {model_name} ---\n")
                    for metric_name, value in metrics.items():
                        f.write(f"  {metric_name}: {value:.4f}\n")
                    f.write("\n")
            
            logger.info(f"Metrics report saved to {METRICS_PATH}")
            
            return best_model
        else:
            logger.error("No model was successfully trained")
            return None
    
    except Exception as e:
        logger.error(f"Error in train_model: {e}")
        return None

def create_synthetic_data(n_samples=1000):
    """
    Create synthetic data for model training
    
    Args:
        n_samples (int): Number of samples to generate
        
    Returns:
        DataFrame: Synthetic dataset
    """
    logger.info(f"Generating synthetic dataset with {n_samples} samples")
    np.random.seed(42)
    
    # Generate features
    income = np.random.normal(50000, 20000, n_samples).clip(20000, 150000)
    credit_score = np.random.normal(700, 100, n_samples).clip(300, 850)
    loan_amount = np.random.normal(10000, 5000, n_samples).clip(1000, 50000)
    employment_years = np.random.exponential(5, n_samples).clip(0, 40)
    existing_debt = np.random.normal(15000, 10000, n_samples).clip(0, None)
    age = np.random.randint(18, 70, n_samples)
    
    # Categorical features
    education_levels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD']
    education = np.random.choice(education_levels, n_samples)
    
    home_ownership = np.random.choice(['Rent', 'Own', 'Mortgage'], n_samples)
    
    loan_purpose = np.random.choice(
        ['Debt Consolidation', 'Home Improvement', 'Business', 'Education', 'Medical', 'Other'],
        n_samples
    )
    
    # Calculate debt to income ratio
    debt_to_income = existing_debt / income
    
    # Generate default probability based on features
    default_prob = (
        -0.1 * (income / 10000) +  # Higher income reduces default risk
        -0.2 * (credit_score / 100) +  # Higher credit score reduces default risk
        0.15 * (loan_amount / 10000) +  # Higher loan amount increases default risk
        -0.1 * employment_years +  # Longer employment reduces default risk
        0.3 * debt_to_income +  # Higher debt-to-income increases default risk
        0.05 * (70 - age) / 50  # Younger age slightly increases risk
    )
    
    # Add random noise
    default_prob += np.random.normal(0, 0.5, n_samples)
    
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
        'age': age,
        'education': education,
        'home_ownership': home_ownership,
        'loan_purpose': loan_purpose,
        'debt_to_income': debt_to_income,
        'default': default
    })
    
    # Save synthetic data
    os.makedirs(os.path.dirname(os.path.join(RESOURCES_DIR, 'borrower_data.csv')), exist_ok=True)
    data.to_csv(os.path.join(RESOURCES_DIR, 'borrower_data.csv'), index=False)
    logger.info(f"Synthetic data saved to {os.path.join(RESOURCES_DIR, 'borrower_data.csv')}")
    
    return data

def predict_default_risk(borrower_data, model=None, preprocessor=None):
    """
    Predict default risk for a borrower
    
    Args:
        borrower_data (dict or DataFrame): Borrower information
        model (object, optional): Pre-loaded model
        preprocessor (object, optional): Pre-loaded preprocessor
        
    Returns:
        dict: Prediction results including default probability and risk level
    """
    try:
        # Convert dict to DataFrame if needed
        if isinstance(borrower_data, dict):
            borrower_data = pd.DataFrame([borrower_data])
        
        # Load model and preprocessor if not provided
        if model is None:
            if not os.path.exists(MODEL_PATH):
                logger.error(f"Model file not found at {MODEL_PATH}")
                return None
            model = joblib.load(MODEL_PATH)
        
        if preprocessor is None:
            if not os.path.exists(PREPROCESSOR_PATH):
                logger.error(f"Preprocessor file not found at {PREPROCESSOR_PATH}")
                return None
            preprocessor = joblib.load(PREPROCESSOR_PATH)
        
        # Feature engineering
        if 'income' in borrower_data.columns and 'existing_debt' in borrower_data.columns:
            borrower_data['debt_to_income'] = borrower_data['existing_debt'] / borrower_data['income'].replace(0, 0.001)
        
        if 'loan_amount' in borrower_data.columns and 'income' in borrower_data.columns:
            borrower_data['loan_to_income'] = borrower_data['loan_amount'] / borrower_data['income'].replace(0, 0.001)
        
        if 'credit_score' in borrower_data.columns:
            borrower_data['credit_score_normalized'] = borrower_data['credit_score'] / 850
        
        # Preprocess data
        X_processed = preprocessor.transform(borrower_data)
        
        # Make prediction
        default_prob = model.predict_proba(X_processed)[:, 1][0]
        default_prediction = model.predict(X_processed)[0]
        
        # Determine risk level
        if default_prob < 0.2:
            risk_level = "low"
        elif default_prob < 0.5:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        # Return results
        return {
            "default_probability": float(default_prob),
            "default_prediction": int(default_prediction),
            "risk_level": risk_level
        }
    
    except Exception as e:
        logger.error(f"Error in predict_default_risk: {e}")
        return None

if __name__ == '__main__':
    # Train the model
    model = train_model()
    
    if model:
        # Test prediction with sample data
        sample_borrower = {
            'income': 60000,
            'credit_score': 720,
            'loan_amount': 15000,
            'employment_years': 5,
            'existing_debt': 10000,
            'age': 35,
            'education': 'Bachelor',
            'home_ownership': 'Mortgage',
            'loan_purpose': 'Debt Consolidation'
        }
        
        # Load preprocessor
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        
        # Make prediction
        prediction = predict_default_risk(sample_borrower, model, preprocessor)
        
        if prediction:
            logger.info("Sample prediction:")
            logger.info(f"Default probability: {prediction['default_probability']:.4f}")
            logger.info(f"Risk level: {prediction['risk_level']}")
        else:
            logger.error("Failed to make sample prediction")
    else:
        logger.error("Model training failed")
