import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import joblib
import os

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "..", "resources", "datasets")
OUTPUT_DIR = os.path.join(BASE_DIR, "saved_models")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "processed_data") # Optional: save processed data

# Create output directories if they don_t exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True) # Optional

# File paths
BORROWER_DATA_PATH = os.path.join(DATA_DIR, "borrower_data.csv")
TRANSACTION_DATA_PATH = os.path.join(DATA_DIR, "loan_transactions.csv")
PREPROCESSOR_PATH = os.path.join(OUTPUT_DIR, "preprocessor.joblib")
PROCESSED_TRAIN_PATH = os.path.join(PROCESSED_DATA_DIR, "train_processed.csv") # Optional
PROCESSED_TEST_PATH = os.path.join(PROCESSED_DATA_DIR, "test_processed.csv")   # Optional

def load_data():
    """Loads borrower and transaction data."""
    try:
        borrowers = pd.read_csv(BORROWER_DATA_PATH)
        transactions = pd.read_csv(TRANSACTION_DATA_PATH)
        print("Data loaded successfully.")
        print(f"Borrower data shape: {borrowers.shape}")
        print(f"Transaction data shape: {transactions.shape}")
        return borrowers, transactions
    except FileNotFoundError as e:
        print(f"Error loading data: {e}. Ensure datasets are in {DATA_DIR}")
        return None, None

def feature_engineering(borrowers_df, transactions_df):
    """Performs feature engineering by merging and creating new features."""
    if borrowers_df is None or transactions_df is None:
        return None

    print("Starting feature engineering...")
    # Example: Aggregate transaction data for each borrower
    # For simplicity, let_s assume `borrower_id` in transactions links to `id` in borrowers
    # And we want to create features like total loan amount, avg interest rate, default count etc.

    # Ensure correct data types for merging if IDs are numeric
    if "borrower_id" in transactions_df.columns and "id" in borrowers_df.columns:
        try:
            transactions_df["borrower_id"] = pd.to_numeric(transactions_df["borrower_id"], errors="coerce")
            borrowers_df["id"] = pd.to_numeric(borrowers_df["id"], errors="coerce")
        except Exception as e:
            print(f"Error converting IDs to numeric: {e}")
            # Fallback or error handling

    # Example aggregations (customize based on actual data columns)
    if "loan_amount" in transactions_df.columns and "interest_rate" in transactions_df.columns and "defaulted" in transactions_df.columns:
        agg_funcs = {
            "loan_amount": ["sum", "mean", "count"],
            "interest_rate": ["mean"],
            "defaulted": ["sum", "mean"] # Sum of defaults, mean as default rate
        }
        # Rename columns for clarity if `borrower_id` is the common key
        # This depends on your actual CSV column names
        # For this example, let_s assume `borrower_id` in transactions and `id` in borrowers are the keys.
        # If your borrower ID column in borrowers_df is named differently, adjust `left_on`.
        if "borrower_id" not in transactions_df.columns:
            print("Warning: 'borrower_id' not found in transactions_df. Skipping transaction aggregation.")
            merged_df = borrowers_df.copy()
        elif "id" not in borrowers_df.columns:
            print("Warning: 'id' (borrower key) not found in borrowers_df. Skipping transaction aggregation.")
            merged_df = borrowers_df.copy()
        else:
            print("Aggregating transaction data...")
            transaction_summary = transactions_df.groupby("borrower_id").agg(agg_funcs).reset_index()
            # Flatten multi-index columns
            transaction_summary.columns = ["_".join(col).strip() if isinstance(col, tuple) else col for col in transaction_summary.columns.values]
            transaction_summary.rename(columns={"borrower_id_": "id"}, inplace=True) # Align key name for merge
            
            merged_df = pd.merge(borrowers_df, transaction_summary, on="id", how="left")
            print("Transaction data merged.")
    else:
        print("Warning: Required columns for transaction aggregation (loan_amount, interest_rate, defaulted) not found. Skipping.")
        merged_df = borrowers_df.copy()

    # Example: Create new features from existing borrower data
    if "annual_income" in merged_df.columns and "total_debt" in merged_df.columns:
        merged_df["debt_to_income_ratio"] = merged_df["total_debt"] / (merged_df["annual_income"] + 1e-6) # Add epsilon to avoid division by zero
    
    if "credit_history_length_months" in merged_df.columns:
        merged_df["credit_history_length_years"] = merged_df["credit_history_length_months"] / 12

    # Placeholder for target variable - this needs to be defined based on your problem
    # For credit scoring, the target is often whether a loan defaulted.
    # Let_s assume a column `loan_status` exists and `Defaulted` means 1, others 0.
    # This is highly dependent on your actual data.
    if "loan_status" in merged_df.columns:
        merged_df["target"] = merged_df["loan_status"].apply(lambda x: 1 if x == "Defaulted" else 0)
        print("Target variable 'target' created from 'loan_status'.")
    elif "defaulted_mean" in merged_df.columns: # If we got a default rate from transactions
        merged_df["target"] = (merged_df["defaulted_mean"] > 0).astype(int) # Example: any past default means target=1
        print("Target variable 'target' created from 'defaulted_mean'.")
    else:
        # Create a dummy target if none exists for script to run
        print("Warning: No clear target variable source found ('loan_status' or 'defaulted_mean'). Creating a dummy target for demonstration.")
        if not merged_df.empty:
            np.random.seed(42)
            merged_df["target"] = np.random.randint(0, 2, size=len(merged_df))
        else:
            print("DataFrame is empty, cannot create dummy target.")
            return None

    print(f"Feature engineering complete. Shape of merged_df: {merged_df.shape}")
    # print(merged_df.head())
    # print(merged_df.info())
    return merged_df

def preprocess_data(df):
    """Defines and applies preprocessing steps (imputation, scaling, encoding)."""
    if df is None or df.empty:
        print("DataFrame is empty or None. Skipping preprocessing.")
        return None, None, None, None
    
    if "target" not in df.columns:
        print("Error: Target variable not found in DataFrame. Cannot proceed with preprocessing for supervised learning.")
        return None, None, None, None

    print("Starting data preprocessing...")
    X = df.drop("target", axis=1)
    y = df["target"]

    # Identify numerical and categorical features
    # Excluding ID columns or other non-feature columns like 'id', 'borrower_id_'
    # This needs to be adapted based on actual column names after feature engineering
    potential_id_cols = [col for col in X.columns if "id" in col.lower()]
    X_features = X.drop(columns=potential_id_cols, errors='ignore')

    numerical_features = X_features.select_dtypes(include=np.number).columns.tolist()
    categorical_features = X_features.select_dtypes(include=["object", "category"]).columns.tolist()

    print(f"Numerical features: {numerical_features}")
    print(f"Categorical features: {categorical_features}")

    # Create preprocessing pipelines
    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    # Create a column transformer
    preprocessor = ColumnTransformer([
        ("num", numerical_pipeline, numerical_features),
        ("cat", categorical_pipeline, categorical_features)
    ], remainder="passthrough") # Keep other columns if any, or use 'drop'

    # Split data before fitting the preprocessor to avoid data leakage from test set
    X_train, X_test, y_train, y_test = train_test_split(X_features, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None)
    print(f"Data split: X_train shape {X_train.shape}, X_test shape {X_test.shape}")

    # Fit preprocessor on training data and transform both train and test
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Get feature names after one-hot encoding for creating DataFrames (optional)
    try:
        feature_names = numerical_features + \
                        list(preprocessor.named_transformers_["cat"]["onehot"].get_feature_names_out(categorical_features))
        # Add names for 'remainder' columns if 'passthrough'
        num_processed_cols = X_train_processed.shape[1]
        if len(feature_names) < num_processed_cols:
            # This part is tricky if 'remainder="passthrough"' is used with unnamed columns.
            # For simplicity, we assume all columns are handled by num/cat transformers or dropped.
            # If passthrough columns exist and are unnamed, this needs careful handling.
            pass 

        X_train_processed_df = pd.DataFrame(X_train_processed, columns=feature_names if len(feature_names) == X_train_processed.shape[1] else None, index=X_train.index)
        X_test_processed_df = pd.DataFrame(X_test_processed, columns=feature_names if len(feature_names) == X_test_processed.shape[1] else None, index=X_test.index)
        print("Processed data converted back to DataFrame with feature names.")

        # Optional: Save processed data
        # X_train_processed_df.to_csv(PROCESSED_TRAIN_PATH, index=False)
        # X_test_processed_df.to_csv(PROCESSED_TEST_PATH, index=False)
        # print(f"Processed training data saved to {PROCESSED_TRAIN_PATH}")
        # print(f"Processed testing data saved to {PROCESSED_TEST_PATH}")

    except Exception as e:
        print(f"Could not get feature names from preprocessor or create DataFrame: {e}")
        print("Proceeding with NumPy arrays for X_train_processed and X_test_processed.")
        X_train_processed_df = X_train_processed # Keep as numpy array
        X_test_processed_df = X_test_processed   # Keep as numpy array

    # Save the fitted preprocessor
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    print(f"Preprocessor saved to {PREPROCESSOR_PATH}")

    return X_train_processed_df, X_test_processed_df, y_train, y_test, preprocessor


def main():
    """Main function to run the data preprocessing pipeline."""
    print("--- Starting Data Preprocessing Script ---")
    borrowers, transactions = load_data()
    
    if borrowers is None or transactions is None:
        print("Failed to load data. Exiting.")
        return

    # Check if dataframes are empty before proceeding
    if borrowers.empty or transactions.empty:
        print("One or both dataframes are empty after loading. Exiting feature engineering.")
        # Decide how to handle this: maybe create dummy data for testing the pipeline?
        # For now, exiting.
        return
        
    merged_df = feature_engineering(borrowers, transactions)

    if merged_df is None or merged_df.empty:
        print("Feature engineering resulted in an empty or None DataFrame. Exiting.")
        return
    
    if "target" not in merged_df.columns:
        print("Target variable is missing after feature engineering. Exiting preprocessing.")
        return

    X_train_p, X_test_p, y_train, y_test, preprocessor_obj = preprocess_data(merged_df)

    if X_train_p is None: # Check if preprocessing failed
        print("Data preprocessing failed. Exiting.")
        return

    print("--- Data Preprocessing Script Finished Successfully ---")
    print(f"Shape of X_train_processed: {X_train_p.shape if hasattr(X_train_p, 'shape') else 'N/A'}")
    print(f"Shape of X_test_processed: {X_test_p.shape if hasattr(X_test_p, 'shape') else 'N/A'}")
    print(f"Shape of y_train: {y_train.shape if hasattr(y_train, 'shape') else 'N/A'}")
    print(f"Shape of y_test: {y_test.shape if hasattr(y_test, 'shape') else 'N/A'}")

if __name__ == "__main__":
    main()

