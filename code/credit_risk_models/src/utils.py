import logging
import os
import numpy as np
import pandas as pd
from typing import Tuple


# --- Logging Setup ---
def setup_logging(name: str, log_file: str) -> logging.Logger:
    """
    Sets up a logger with both file and console handlers.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers if called multiple times
    if not logger.handlers:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        # Console Handler
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)

        # File Handler
        log_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", log_file
        )
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        fh = logging.FileHandler(log_path)
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    return logger


# --- Data Utility Functions ---

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
RESOURCES_DIR = os.path.join(BASE_DIR, "..", "..", "resources", "datasets")


def create_synthetic_data(
    n_borrowers: int = 1000, n_transactions: int = 5000
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Create synthetic data for model training when real data is unavailable.

    Args:
        n_borrowers (int): Number of borrower records to generate
        n_transactions (int): Number of transaction records to generate

    Returns:
        tuple: (borrowers_df, transactions_df) - DataFrames containing synthetic data
    """
    logger = setup_logging("data_utils", "data_generation.log")
    logger.info(
        f"Generating synthetic data with {n_borrowers} borrowers and {n_transactions} transactions"
    )
    np.random.seed(42)

    # 1. Borrower Data
    borrower_ids = [f"B{i:06d}" for i in range(1, n_borrowers + 1)]
    borrowers_df = pd.DataFrame(
        {
            "borrower_id": borrower_ids,
            "age": np.random.randint(18, 70, n_borrowers),
            "income": np.random.normal(50000, 20000, n_borrowers).clip(20000, 150000),
            "credit_score": np.random.normal(700, 100, n_borrowers).clip(300, 850),
            "employment_years": np.random.exponential(5, n_borrowers)
            .clip(0, 40)
            .astype(int),
            "existing_debt": np.random.normal(15000, 10000, n_borrowers).clip(0, None),
            "home_ownership": np.random.choice(
                ["RENT", "OWN", "MORTGAGE"], n_borrowers
            ),
            "education": np.random.choice(
                ["High School", "Bachelor", "Master", "PhD"], n_borrowers
            ),
            "marital_status": np.random.choice(
                ["Single", "Married", "Divorced"], n_borrowers
            ),
            "num_dependents": np.random.randint(0, 5, n_borrowers),
        }
    )
    borrowers_df["debt_to_income"] = (
        borrowers_df["existing_debt"] / borrowers_df["income"]
    ).clip(0, 1)

    # 2. Transaction Data
    transaction_ids = [f"T{i:06d}" for i in range(1, n_transactions + 1)]
    borrower_ids_for_transactions = np.random.choice(borrower_ids, n_transactions)
    start_date = pd.Timestamp("2020-01-01")
    end_date = pd.Timestamp("2023-12-31")
    days_range = (end_date - start_date).days
    random_days = np.random.randint(0, days_range, n_transactions)
    transaction_dates = [start_date + pd.Timedelta(days=days) for days in random_days]
    loan_amounts = np.random.normal(10000, 8000, n_transactions).clip(1000, 50000)
    interest_rates = np.random.normal(10, 5, n_transactions).clip(3, 25)
    loan_terms = np.random.choice([6, 12, 24, 36, 48, 60], n_transactions)

    # Merge to calculate default probability based on borrower features
    temp_df = pd.DataFrame(
        {
            "borrower_id": borrower_ids_for_transactions,
            "loan_amount": loan_amounts,
            "interest_rate": interest_rates,
            "loan_term": loan_terms,
        }
    )
    temp_df = temp_df.merge(borrowers_df, on="borrower_id", how="left")

    # Simple logistic model for default probability
    default_prob = (
        -0.1 * (temp_df["income"] / 10000)
        + -0.2 * (temp_df["credit_score"] / 100)
        + 0.15 * (temp_df["loan_amount"] / 10000)
        + -0.1 * temp_df["employment_years"]
        + 0.3 * temp_df["debt_to_income"]
        + 0.1 * (temp_df["interest_rate"] / 10)
        + 0.05 * (temp_df["loan_term"] / 12)
    )
    default_prob = 1 / (1 + np.exp(-default_prob))

    # Introduce some noise and bias
    default_prob = default_prob.clip(0.05, 0.5)  # Ensure some defaults and non-defaults

    default = (np.random.random(n_transactions) < default_prob).astype(int)

    transactions_df = pd.DataFrame(
        {
            "transaction_id": transaction_ids,
            "borrower_id": borrower_ids_for_transactions,
            "loan_date": transaction_dates,
            "loan_amount": loan_amounts,
            "interest_rate": interest_rates,
            "loan_term": loan_terms,
            "loan_purpose": np.random.choice(
                [
                    "Debt Consolidation",
                    "Home Improvement",
                    "Business",
                    "Education",
                    "Other",
                ],
                n_transactions,
            ),
            "default": default,
        }
    )

    # Save synthetic data to the expected location
    borrowers_path = os.path.join(RESOURCES_DIR, "borrower_data.csv")
    transactions_path = os.path.join(RESOURCES_DIR, "loan_transactions.csv")
    os.makedirs(os.path.dirname(borrowers_path), exist_ok=True)
    borrowers_df.to_csv(borrowers_path, index=False)
    transactions_df.to_csv(transactions_path, index=False)
    logger.info(f"Synthetic data saved to {borrowers_path} and {transactions_path}")

    return (borrowers_df, transactions_df)


def load_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load raw data from CSV files, creating synthetic data if files are missing or appear to be placeholders.

    Returns:
        tuple: (borrowers_df, transactions_df) - DataFrames containing borrower and transaction data
    """
    logger = setup_logging("data_utils", "data_loading.log")
    logger.info("Loading raw data...")

    borrowers_path = os.path.join(RESOURCES_DIR, "borrower_data.csv")
    transactions_path = os.path.join(RESOURCES_DIR, "loan_transactions.csv")

    try:
        if not os.path.exists(borrowers_path) or not os.path.exists(transactions_path):
            logger.warning("Data files not found. Creating synthetic data...")
            return create_synthetic_data()

        borrowers_df = pd.read_csv(borrowers_path)
        transactions_df = pd.read_csv(transactions_path)

        # Check for placeholder data (e.g., very small file or specific placeholder text)
        if len(borrowers_df) < 100 or "Placeholder" in str(borrowers_df.iloc[0]):
            logger.warning("Data appears to be placeholder. Creating synthetic data...")
            return create_synthetic_data()

        logger.info(
            f"Loaded {len(borrowers_df)} borrower records and {len(transactions_df)} transaction records"
        )
        return (borrowers_df, transactions_df)

    except Exception as e:
        logger.error(f"Error loading data: {e}")
        logger.info("Creating synthetic data instead...")
        return create_synthetic_data()


def feature_engineering(
    borrowers_df: pd.DataFrame, transactions_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Perform feature engineering by merging borrower and transaction data
    and creating additional features.

    Args:
        borrowers_df (DataFrame): Borrower data
        transactions_df (DataFrame): Transaction data

    Returns:
        DataFrame: Merged dataset with engineered features
    """
    logger = setup_logging("data_utils", "feature_engineering.log")
    logger.info("Performing feature engineering...")

    try:
        merged_df = transactions_df.merge(borrowers_df, on="borrower_id", how="left")

        # Financial Ratios
        merged_df["payment_to_income"] = (
            merged_df["loan_amount"] / merged_df["loan_term"] / merged_df["income"]
        ).fillna(0)
        merged_df["total_loan_burden"] = (
            merged_df["loan_amount"] + merged_df["existing_debt"]
        )
        merged_df["loan_to_income"] = (
            merged_df["loan_amount"] / merged_df["income"]
        ).fillna(0)
        merged_df["interest_burden"] = (
            merged_df["loan_amount"]
            * (merged_df["interest_rate"] / 100)
            * (merged_df["loan_term"] / 12)
        )

        # Categorical Binning
        merged_df["age_group"] = pd.cut(
            merged_df["age"],
            bins=[0, 25, 35, 45, 55, 100],
            labels=["18-25", "26-35", "36-45", "46-55", "56+"],
            right=False,
        )
        merged_df["credit_score_group"] = pd.cut(
            merged_df["credit_score"],
            bins=[300, 580, 670, 740, 800, 850],
            labels=["Poor", "Fair", "Good", "Very Good", "Excellent"],
            right=False,
        )

        # Time-based features
        if not pd.api.types.is_datetime64_any_dtype(merged_df["loan_date"]):
            merged_df["loan_date"] = pd.to_datetime(merged_df["loan_date"])

        merged_df["loan_year"] = merged_df["loan_date"].dt.year
        merged_df["loan_month"] = merged_df["loan_date"].dt.month
        merged_df["loan_day_of_week"] = merged_df["loan_date"].dt.dayofweek

        # Clean up
        merged_df = merged_df.rename(columns={"default": "target"})
        merged_df = merged_df.drop(
            ["transaction_id", "borrower_id", "loan_date"], axis=1
        )

        logger.info(f"Feature engineering complete. Dataset shape: {merged_df.shape}")
        return merged_df

    except Exception as e:
        logger.error(f"Error during feature engineering: {e}")
        return pd.DataFrame()


# Remove the temporary logging_utils.py file
if os.path.exists(os.path.join(BASE_DIR, "logging_utils.py")):
    os.remove(os.path.join(BASE_DIR, "logging_utils.py"))
