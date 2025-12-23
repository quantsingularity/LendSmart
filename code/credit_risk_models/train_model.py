from src.credit_scoring_model import CreditScoringModel
from src.utils import setup_logging, load_data, feature_engineering

# Setup logging for the main script
logger = setup_logging("train_model_main", "train_model.log")


def main():
    """
    Main function to run the model training and evaluation pipeline.
    """
    logger.info("=== Starting Credit Scoring Model Training Script ===")

    # 1. Load Data
    borrowers_df, transactions_df = load_data()
    if borrowers_df.empty or transactions_df.empty:
        logger.error("Failed to load data. Model training cannot proceed.")
        return

    # 2. Feature Engineering
    merged_df = feature_engineering(borrowers_df, transactions_df)
    if merged_df.empty:
        logger.error("Feature engineering failed. Model training cannot proceed.")
        return

    # 3. Initialize and Train Model
    # Use the ensemble model for best performance
    model_config = {
        "model_type": "ensemble",
        "cv_folds": 5,
        "random_state": 42,
        "n_jobs": -1,
    }

    # The target column is 'target' after feature_engineering
    X = merged_df.drop("target", axis=1)
    y = merged_df["target"]

    model = CreditScoringModel(config=model_config)

    try:
        # The train method handles preprocessing, splitting, training, and saving
        model.train(X, y)

        # 4. Evaluate and Report (handled internally by model.train)
        logger.info("Model training and evaluation completed successfully.")

    except Exception as e:
        logger.error(f"An error occurred during model training: {e}")
        import traceback

        logger.error(traceback.format_exc())
        return

    logger.info("=== Credit Scoring Model Training Script Finished ===")


if __name__ == "__main__":
    main()
