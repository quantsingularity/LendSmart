from flask import Flask, jsonify, request
from web3 import Web3
import joblib
import pandas as pd

app = Flask(__name__)
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
risk_model = joblib.load('../ai_models/risk_assessment_model.pkl')

# Load contract ABI
with open('../blockchain/build/contracts/LoanManager.json') as f:
    loan_manager_abi = json.load(f)['abi']

loan_manager_address = '0x...'  # Deployed contract address

@app.route('/api/apply-loan', methods=['POST'])
def apply_loan():
    data = request.json
    features = pd.DataFrame([data])
    risk_score = risk_model.predict_proba(features)[0][1]
    return jsonify({'risk_score': risk_score, 'approved': risk_score < 0.3})

@app.route('/api/loans', methods=['GET'])
def get_active_loans():
    contract = w3.eth.contract(address=loan_manager_address, abi=loan_manager_abi)
    loans = contract.functions.getAllLoans().call()
    return jsonify([format_loan(loan) for loan in loans])

def format_loan(loan):
    return {
        'amount': loan[1],
        'interest_rate': loan[2],
        'duration': loan[3],
        'status': ['Pending', 'Approved', 'Repaid', 'Defaulted'][loan[4]]
    }
    
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'blockchain': 'connected' if w3.isConnected() else 'disconnected',
        'database': 'connected' if mongo.cx else 'disconnected'
    })