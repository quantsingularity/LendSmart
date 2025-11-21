# LendSmart ML Model - Credit Scoring

This directory contains the components for the machine learning model used in the LendSmart platform for credit scoring and risk assessment.

## Overview

The primary goal of this ML model is to predict the likelihood of a loan applicant defaulting on a loan. This prediction can be used by lenders to make informed decisions and by the platform to offer risk-adjusted interest rates or loan terms.

The model is trained on historical loan data, including borrower characteristics and loan transaction history.

## Model Components

- **`data_preprocessing.py`**: Script for cleaning, transforming, and feature engineering the raw datasets (`borrower_data.csv`, `loan_transactions.csv`).
- **`model_training.py`**: Script for training the credit scoring model (e.g., Logistic Regression, Gradient Boosting, Neural Network) using the preprocessed data. Includes model evaluation and saving the trained model.
- **`predict.py`**: Script or API endpoint (if integrated into the backend) to load the trained model and make predictions on new loan applications.
- **`notebooks/`**: Directory for Jupyter notebooks used for exploratory data analysis (EDA), model experimentation, and visualization.
  - `eda_and_feature_engineering.ipynb` (Example)
  - `model_selection_and_tuning.ipynb` (Example)
- **`requirements.txt`**: Lists all Python dependencies required for the ML model (e.g., pandas, scikit-learn, numpy, matplotlib, seaborn, joblib/pickle).
- **`saved_models/`**: Directory where trained model artifacts (e.g., `.joblib` or `.pkl` files) and any associated preprocessing objects (like scalers or encoders) are stored. (This directory should be in `.gitignore` if models are large, or use a model registry).

## Project Structure

```
ml-model/
├── data_preprocessing.py # Script for data cleaning and feature engineering
├── model_training.py     # Script for training the credit scoring model
├── predict.py            # Script/API for making predictions
├── notebooks/            # Jupyter notebooks for EDA and experimentation
│   └── eda.ipynb
├── saved_models/         # Directory to store trained model files (e.g., .joblib, .pkl)
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

(The `resources/datasets/` directory in the main project root contains the example datasets: `borrower_data.csv` and `loan_transactions.csv`)

## Prerequisites

- Python (v3.8 or later recommended)
- pip (Python package installer)

## Setup and Installation

1.  **Navigate to the `ml-model` directory:**

    ```bash
    cd LendSmart/ml-model
    ```

2.  **Create and activate a virtual environment (recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Workflow

1.  **Data Preprocessing:**
    Run the `data_preprocessing.py` script to clean the raw data and generate features suitable for model training. This script will typically load data from `../../resources/datasets/` and save processed data (e.g., to a new CSV or directly use it in training).

    ```bash
    python data_preprocessing.py
    ```

2.  **Model Training:**
    Run the `model_training.py` script to train the credit scoring model. This script will load the preprocessed data, train one or more models, evaluate their performance, and save the best performing model to the `saved_models/` directory.

    ```bash
    python model_training.py
    ```

3.  **Prediction:**
    The `predict.py` script can be used to load a saved model and make predictions on new applicant data. This might be a standalone script for batch predictions or integrated as an API endpoint within the backend service.
    ```bash
    # Example: python predict.py --input_data "path/to/new_applicant_data.json"
    ```

## Model Details (Example)

- **Algorithm:** Could be Logistic Regression, Random Forest, Gradient Boosting (e.g., XGBoost, LightGBM), or a simple Neural Network.
- **Features:** Examples include credit history length, income, debt-to-income ratio, loan amount, loan purpose, employment status, past defaults, number of open credit lines, etc.
- **Evaluation Metrics:** Common metrics include AUC-ROC, Precision, Recall, F1-Score, Gini Coefficient, KS Statistic.

## Integration with Backend

The trained model (e.g., `saved_models/credit_scoring_model.joblib`) and any necessary preprocessing objects (e.g., `saved_models/preprocessor.joblib`) will be loaded by the backend service. When a new loan application is submitted, the backend will:

1.  Extract relevant features from the application data.
2.  Preprocess these features using the saved preprocessor.
3.  Feed the processed features to the loaded model to get a credit score or default probability.
4.  Use this score in the loan approval process or to determine loan terms.

## Future Enhancements

- Regular model retraining and monitoring for performance degradation.
- More sophisticated feature engineering.
- Exploration of alternative modeling techniques.
- Integration with a feature store.
- Deployment as a scalable microservice.
- Explainability (e.g., using SHAP or LIME) to understand model predictions.

## License

This project is licensed under the [Specify License, e.g., MIT License] - see the `LICENSE` file in the root project directory for details.
