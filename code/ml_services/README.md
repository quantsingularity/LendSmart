# LendSmart ML Services

Python-based machine learning and compliance services for the LendSmart platform.

```
ml_services/
├── credit_risk/            # Credit risk ML models & prediction service
│   ├── src/
│   │   ├── credit_scoring_model.py  – Ensemble ML credit scorer (sklearn/XGBoost/LightGBM)
│   │   ├── risk_assessment.py       – LoanRiskModel (RandomForest pipeline)
│   │   ├── scoring.py               – Alternative data scorers (digital, transaction, utility…)
│   │   ├── data_sources.py          – Alternative data source connectors
│   │   └── utils.py                 – Data loading, feature engineering, logging helpers
│   ├── data/                        – borrower_data.csv, loan_transactions.csv
│   ├── tests/                       – pytest test suite
│   ├── prediction_service.py        – Flask HTTP server (GET /health, POST /predict)
│   ├── train_model.py               – Training entry point
│   ├── Dockerfile
│   └── requirements.txt
│
├── compliance/             # Regulatory compliance framework
│   ├── compliance.py       – Fair lending, AML, GDPR, adverse action, model documentation
│   └── audit_logs/         – Persisted JSONL audit trail
│
├── integration/            # Integration layer
│   └── integration.py      – LendingSystem: orchestrates credit_risk + compliance end-to-end
│
├── requirements.txt        # Unified Python dependencies
└── README.md
```

## Installation

```bash
# From repo root
pip install -r ml_services/requirements.txt
```

## Running the Prediction Service

```bash
# From repo root
python -m ml_services.credit_risk.prediction_service --server --port 8000
```

### Endpoints

| Method | Path             | Description                        |
| ------ | ---------------- | ---------------------------------- |
| GET    | `/health`        | Service health + model load status |
| GET    | `/`              | Service info & endpoint list       |
| POST   | `/predict`       | Single applicant credit prediction |
| POST   | `/predict/batch` | Batch prediction (JSON array)      |

## Training

```bash
python -m ml_services.credit_risk.train_model
```

## Running Tests

```bash
pytest ml_services/credit_risk/tests/ -v
```
