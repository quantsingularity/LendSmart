from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from web3 import Web3
import joblib
import pandas as pd
import json
import os
from pymongo import MongoClient
from config import Config

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load configuration
config = Config()

# Connect to MongoDB
try:
    mongo = MongoClient(config.MONGO_URI)
    db = mongo.get_database()
    print("Connected to MongoDB successfully")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    mongo = None

# Connect to Web3
try:
    w3 = Web3(Web3.HTTPProvider(config.WEB3_PROVIDER))
    print(f"Connected to Web3: {w3.isConnected()}")
except Exception as e:
    print(f"Web3 connection error: {e}")
    w3 = None

# Load AI risk model
try:
    risk_model = joblib.load(config.MODEL_PATH)
    print("Risk assessment model loaded successfully")
except Exception as e:
    print(f"Error loading risk model: {e}")
    risk_model = None

# Load contract ABI
try:
    contract_path = os.path.join(os.path.dirname(__file__), '../blockchain/build/contracts/LoanManager.json')
    with open(contract_path) as f:
        contract_data = json.load(f)
        loan_manager_abi = contract_data['abi']
    
    # Get contract address from environment or config
    loan_manager_address = os.getenv('LOAN_MANAGER_ADDRESS', '0x0000000000000000000000000000000000000000')
    print(f"Contract loaded with address: {loan_manager_address}")
except Exception as e:
    print(f"Error loading contract: {e}")
    loan_manager_abi = None
    loan_manager_address = None

@app.route('/api/apply-loan', methods=['POST'])
def apply_loan():
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['income', 'credit_score', 'loan_amount', 'employment_years']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        features = pd.DataFrame([data])
        
        if risk_model is None:
            return jsonify({'error': 'Risk assessment model not available'}), 500
            
        risk_score = risk_model.predict_proba(features)[0][1]
        approved = risk_score < 0.3
        
        # Store application in MongoDB
        if mongo:
            loan_application = {
                'borrower_address': data.get('address', 'unknown'),
                'amount': data.get('loan_amount'),
                'risk_score': float(risk_score),
                'approved': approved,
                'timestamp': pd.Timestamp.now().isoformat()
            }
            db.loan_applications.insert_one(loan_application)
        
        return jsonify({
            'risk_score': float(risk_score), 
            'approved': approved,
            'max_amount': data.get('loan_amount') if approved else 0,
            'interest_rate': 5 + int(risk_score * 10) # Interest rate based on risk
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/loans', methods=['GET'])
def get_active_loans():
    try:
        if w3 is None or not w3.isConnected():
            return jsonify({'error': 'Blockchain connection not available'}), 500
            
        if loan_manager_abi is None or loan_manager_address is None:
            return jsonify({'error': 'Contract not properly configured'}), 500
        
        contract = w3.eth.contract(address=loan_manager_address, abi=loan_manager_abi)
        loans = contract.functions.getAllLoans().call()
        
        return jsonify([format_loan(loan) for loan in loans])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_loan(loan):
    return {
        'borrower': loan[0],
        'amount': loan[1],
        'interest_rate': loan[2],
        'duration': loan[3],
        'status': ['Pending', 'Approved', 'Repaid', 'Defaulted'][loan[4]],
        'due_date': loan[5]
    }

@app.route('/api/borrower/<address>/loans', methods=['GET'])
def get_borrower_loans(address):
    try:
        if not Web3.isAddress(address):
            return jsonify({'error': 'Invalid Ethereum address'}), 400
            
        if w3 is None or not w3.isConnected():
            return jsonify({'error': 'Blockchain connection not available'}), 500
            
        if loan_manager_abi is None or loan_manager_address is None:
            return jsonify({'error': 'Contract not properly configured'}), 500
        
        contract = w3.eth.contract(address=loan_manager_address, abi=loan_manager_abi)
        
        # Get borrower loans count
        loan_count = contract.functions.borrowerLoansCount(address).call()
        loans = []
        
        # Get each loan
        for i in range(loan_count):
            loan = contract.functions.borrowerLoans(address, i).call()
            loans.append(format_loan(loan))
        
        return jsonify(loans)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'blockchain': 'connected' if w3 and w3.isConnected() else 'disconnected',
        'database': 'connected' if mongo else 'disconnected',
        'model': 'loaded' if risk_model is not None else 'not loaded'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
