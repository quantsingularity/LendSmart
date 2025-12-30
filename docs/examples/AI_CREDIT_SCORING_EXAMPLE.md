# AI Credit Scoring Example

**Using LendSmart AI Credit Scoring Models**

This example demonstrates how to use the AI credit scoring service for loan risk assessment.

---

## Overview

The AI credit scoring service provides:

- Credit score calculation (0-100)
- Default risk assessment
- Interest rate recommendations
- Explainable AI decisions (SHAP values)

---

## API Usage

### Endpoint

```
POST http://localhost:8000/api/v1/score
```

### Example Request

```bash
curl -X POST http://localhost:8000/api/v1/score \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "credit_score": 720,
    "annual_income": 75000,
    "employment_status": "employed",
    "employment_duration": 36,
    "existing_debt": 15000,
    "debt_to_income_ratio": 0.2,
    "loan_amount": 25000,
    "loan_purpose": "business_expansion",
    "collateral_value": 100000,
    "payment_history_score": 85
  }'
```

### Response

```json
{
    "credit_score": 72.5,
    "risk_level": "medium",
    "default_probability": 4.2,
    "recommended_interest_rate": 8.5,
    "loan_approval_recommendation": "approve",
    "confidence_score": 0.89,
    "risk_factors": [
        {
            "factor": "credit_score",
            "value": 720,
            "impact": "positive",
            "importance": 0.35
        },
        {
            "factor": "debt_to_income_ratio",
            "value": 0.2,
            "impact": "neutral",
            "importance": 0.2
        },
        {
            "factor": "collateral_coverage",
            "value": 4.0,
            "impact": "positive",
            "importance": 0.25
        }
    ],
    "explanation": {
        "positive_factors": [
            "Good credit history (720)",
            "Low debt-to-income ratio (20%)",
            "Strong collateral coverage (400%)",
            "Stable employment (3 years)"
        ],
        "negative_factors": [],
        "neutral_factors": ["Moderate loan amount relative to income"]
    }
}
```

---

## Python Client Example

```python
import requests
from typing import Dict, Any

class CreditScoringClient:
    """Client for LendSmart AI Credit Scoring API"""

    def __init__(self, base_url: str = "http://localhost:8000", api_key: str = None):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            "Content-Type": "application/json"
        }
        if api_key:
            self.headers["X-API-Key"] = api_key

    def calculate_credit_score(self, borrower_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate credit score for a borrower.

        Args:
            borrower_data: Dictionary containing borrower information

        Returns:
            Dictionary with credit score, risk assessment, and recommendations
        """
        response = requests.post(
            f"{self.base_url}/api/v1/score",
            json=borrower_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def assess_loan_risk(self, loan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess risk for a specific loan application.

        Args:
            loan_data: Dictionary containing loan and borrower information

        Returns:
            Risk assessment with probability and recommendations
        """
        response = requests.post(
            f"{self.base_url}/api/v1/risk-assessment",
            json=loan_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def batch_score(self, borrowers: list) -> list:
        """
        Score multiple borrowers in batch.

        Args:
            borrowers: List of borrower data dictionaries

        Returns:
            List of credit scores and assessments
        """
        response = requests.post(
            f"{self.base_url}/api/v1/batch-score",
            json={"borrowers": borrowers},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


# Usage Example
if __name__ == "__main__":
    client = CreditScoringClient(api_key="your_api_key")

    # Single borrower scoring
    borrower = {
        "credit_score": 720,
        "annual_income": 75000,
        "employment_status": "employed",
        "employment_duration": 36,
        "existing_debt": 15000,
        "debt_to_income_ratio": 0.2,
        "loan_amount": 25000,
        "loan_purpose": "business_expansion",
        "collateral_value": 100000,
        "payment_history_score": 85,
        "number_of_open_accounts": 5,
        "credit_utilization": 0.3,
        "number_of_delinquencies": 0,
        "bankruptcies": 0
    }

    result = client.calculate_credit_score(borrower)

    print(f"Credit Score: {result['credit_score']}")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Default Probability: {result['default_probability']}%")
    print(f"Recommended Interest Rate: {result['recommended_interest_rate']}%")
    print(f"Decision: {result['loan_approval_recommendation']}")

    print("\nPositive Factors:")
    for factor in result['explanation']['positive_factors']:
        print(f"  - {factor}")

    print("\nRisk Factors:")
    for risk_factor in result['risk_factors']:
        print(f"  - {risk_factor['factor']}: {risk_factor['impact']} (importance: {risk_factor['importance']})")
```

---

## JavaScript/Node.js Client

```javascript
const axios = require('axios');

class CreditScoringClient {
    constructor(baseUrl = 'http://localhost:8000', apiKey = null) {
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey) {
            this.headers['X-API-Key'] = apiKey;
        }
    }

    async calculateCreditScore(borrowerData) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/v1/score`, borrowerData, {
                headers: this.headers,
            });
            return response.data;
        } catch (error) {
            console.error('Credit scoring error:', error.response?.data || error.message);
            throw error;
        }
    }

    async assessLoanRisk(loanData) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/v1/risk-assessment`, loanData, {
                headers: this.headers,
            });
            return response.data;
        } catch (error) {
            console.error('Risk assessment error:', error.response?.data || error.message);
            throw error;
        }
    }

    async batchScore(borrowers) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/v1/batch-score`,
                { borrowers },
                { headers: this.headers },
            );
            return response.data;
        } catch (error) {
            console.error('Batch scoring error:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Usage
async function main() {
    const client = new CreditScoringClient('http://localhost:8000', 'your_api_key');

    const borrower = {
        credit_score: 720,
        annual_income: 75000,
        employment_status: 'employed',
        employment_duration: 36,
        existing_debt: 15000,
        debt_to_income_ratio: 0.2,
        loan_amount: 25000,
        loan_purpose: 'business_expansion',
        collateral_value: 100000,
    };

    const result = await client.calculateCreditScore(borrower);

    console.log('Credit Score:', result.credit_score);
    console.log('Risk Level:', result.risk_level);
    console.log('Recommended Rate:', result.recommended_interest_rate + '%');
    console.log('Decision:', result.loan_approval_recommendation);

    console.log('\nPositive Factors:');
    result.explanation.positive_factors.forEach((factor) => {
        console.log('  -', factor);
    });
}

main().catch(console.error);

module.exports = CreditScoringClient;
```

---

## Training Custom Model

```python
from credit_risk_models.src.credit_scoring_model import CreditScoringModel
import pandas as pd

# Load training data
data = pd.read_csv('data/loan_history.csv')

# Separate features and target
X = data.drop('default', axis=1)
y = data['default']

# Initialize model
config = {
    'model_type': 'ensemble',  # or 'rf', 'gb', 'xgb', 'lgb'
    'cv_folds': 5,
    'random_state': 42
}
model = CreditScoringModel(config=config)

# Train model
model.train(X, y)

# Evaluate
metrics = model.evaluate(X, y)
print("Model Performance:")
print(f"  Accuracy: {metrics['accuracy']:.3f}")
print(f"  Precision: {metrics['precision']:.3f}")
print(f"  Recall: {metrics['recall']:.3f}")
print(f"  F1-Score: {metrics['f1']:.3f}")
print(f"  ROC-AUC: {metrics['roc_auc']:.3f}")

# Save model
model.save_model('models/credit_scoring_model.joblib')

# Generate SHAP explanations
shap_values = model.get_shap_values(X.head(100))
model.plot_shap_summary(shap_values, X.head(100))
```

---

## Integration with Backend

```javascript
// In backend: code/backend/src/services/ai/aiService.js

const axios = require('axios');

class AIService {
    constructor() {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        this.apiKey = process.env.ML_API_KEY;
    }

    async calculateCreditScore(borrowerData) {
        try {
            const response = await axios.post(`${this.mlServiceUrl}/api/v1/score`, borrowerData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
            });

            return {
                aiScore: response.data.credit_score,
                riskLevel: response.data.risk_level,
                defaultProbability: response.data.default_probability,
                recommendedInterestRate: response.data.recommended_interest_rate,
                factors: response.data.risk_factors,
                explanation: response.data.explanation,
            };
        } catch (error) {
            console.error('AI Service Error:', error);
            // Fallback to traditional credit scoring
            return this.fallbackCreditScore(borrowerData);
        }
    }

    fallbackCreditScore(borrowerData) {
        // Simple rule-based scoring as fallback
        const baseRate = 10.0;
        let adjustment = 0;

        if (borrowerData.credit_score > 750) adjustment -= 2.0;
        else if (borrowerData.credit_score < 650) adjustment += 3.0;

        if (borrowerData.debt_to_income_ratio < 0.2) adjustment -= 1.0;
        else if (borrowerData.debt_to_income_ratio > 0.4) adjustment += 2.0;

        return {
            aiScore: 65,
            riskLevel: 'medium',
            defaultProbability: 5.0,
            recommendedInterestRate: baseRate + adjustment,
            factors: [],
            explanation: {
                positive_factors: [],
                negative_factors: [],
                neutral_factors: ['Using fallback scoring method'],
            },
        };
    }
}

module.exports = new AIService();
```

---

## Model Monitoring

```python
from credit_risk_models.src.credit_scoring_model import CreditScoringModel
import pandas as pd
from datetime import datetime

class ModelMonitor:
    """Monitor model performance in production"""

    def __init__(self, model_path: str):
        self.model = CreditScoringModel()
        self.model.load_model(model_path)

    def monitor_predictions(self, predictions: pd.DataFrame, actuals: pd.DataFrame):
        """Monitor model performance on recent predictions"""

        # Calculate metrics
        from sklearn.metrics import accuracy_score, roc_auc_score

        accuracy = accuracy_score(actuals, predictions['predicted'])
        auc = roc_auc_score(actuals, predictions['probability'])

        # Log metrics
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'accuracy': accuracy,
            'auc': auc,
            'num_predictions': len(predictions)
        }

        # Alert if performance degrades
        if accuracy < 0.75 or auc < 0.80:
            self.send_alert(metrics)

        return metrics

    def send_alert(self, metrics: dict):
        """Send alert when model performance degrades"""
        print(f"⚠️  Model Performance Alert!")
        print(f"Accuracy: {metrics['accuracy']:.3f}")
        print(f"AUC: {metrics['auc']:.3f}")
        print("Consider retraining the model.")
```

---

## Best Practices

### Data Preparation

```python
def prepare_borrower_data(borrower: dict) -> dict:
    """Prepare borrower data for AI scoring"""

    # Calculate derived features
    data = borrower.copy()

    # Debt-to-income ratio
    data['debt_to_income_ratio'] = data['existing_debt'] / data['annual_income']

    # Loan-to-income ratio
    data['loan_to_income_ratio'] = data['loan_amount'] / data['annual_income']

    # Collateral coverage ratio
    if data.get('collateral_value'):
        data['collateral_coverage'] = data['collateral_value'] / data['loan_amount']

    # Credit utilization
    if data.get('total_credit_limit'):
        data['credit_utilization'] = data['existing_debt'] / data['total_credit_limit']

    return data
```

### Error Handling

```python
def safe_score_calculation(client, borrower_data):
    """Safely calculate credit score with error handling"""

    try:
        result = client.calculate_credit_score(borrower_data)
        return result
    except requests.exceptions.Timeout:
        print("Error: ML service timeout")
        return None
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to ML service")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None
```

---

## Next Steps

- See [Loan Application Example](LOAN_APPLICATION_EXAMPLE.md) for full workflow
- See [API Documentation](../API.md) for backend integration
- Check [Configuration Guide](../CONFIGURATION.md) for ML service setup
