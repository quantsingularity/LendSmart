import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add the parent directory (backend) to sys.path to allow importing 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import the actual app
from app import app as flask_app, db, w3, risk_model, loan_manager_abi, loan_manager_address, format_loan

@pytest.fixture
def app():
    flask_app.config['TESTING'] = True
    return flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def test_api_health_check_comprehensive(client):
    """Test the /api/health endpoint comprehensively."""
    with patch('app.w3') as mock_w3, \
         patch('app.mongo') as mock_mongo, \
         patch('app.risk_model') as mock_risk_model:

        flask_app.config['MONGO_CONNECTED_FOR_TEST'] = True
        flask_app.config['RISK_MODEL_LOADED_FOR_TEST'] = True
        mock_w3.isConnected.return_value = True

        response = client.get("/api/health")
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'ok'
        assert json_data['blockchain'] == 'connected'
        assert json_data['database'] == 'connected'
        assert json_data['model'] == 'loaded'

        mock_w3.isConnected.return_value = False
        response = client.get("/api/health")
        json_data = response.get_json()
        assert json_data['blockchain'] == 'disconnected'

        mock_w3.isConnected.return_value = True
        with patch('app.mongo', None):
            response = client.get("/api/health")
            json_data = response.get_json()
            assert json_data['database'] == 'disconnected'

        with patch('app.risk_model', None):
            response = client.get("/api/health")
            json_data = response.get_json()
            assert json_data['model'] == 'not loaded'

        if 'MONGO_CONNECTED_FOR_TEST' in flask_app.config:
            del flask_app.config['MONGO_CONNECTED_FOR_TEST']
        if 'RISK_MODEL_LOADED_FOR_TEST' in flask_app.config:
            del flask_app.config['RISK_MODEL_LOADED_FOR_TEST']


# --- Tests for /api/apply-loan --- 

@pytest.fixture
def mock_risk_model_predict_proba(monkeypatch):
    mock_predict_proba = MagicMock(return_value=[[0.8, 0.2]]) 
    mock_model_instance = MagicMock()
    mock_model_instance.predict_proba = mock_predict_proba
    monkeypatch.setattr('app.risk_model', mock_model_instance)
    return mock_predict_proba

@pytest.fixture
def mock_db_operations(monkeypatch):
    mock_insert_one = MagicMock()
    mock_loan_apps_collection = MagicMock()
    mock_loan_apps_collection.insert_one = mock_insert_one
    mock_db_instance = MagicMock()
    mock_db_instance.loan_applications = mock_loan_apps_collection
    monkeypatch.setattr('app.db', mock_db_instance)
    return mock_insert_one

def test_apply_loan_success(client, mock_risk_model_predict_proba, mock_db_operations):
    loan_data = {
        'income': 50000, 'credit_score': 700, 'loan_amount': 10000, 
        'employment_years': 5, 'address': '0x123TestAddress'
    }
    with patch('app.mongo', MagicMock()): 
        response = client.post("/api/apply-loan", json=loan_data)
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['approved'] == True
    assert json_data['risk_score'] == 0.2
    mock_risk_model_predict_proba.assert_called_once()
    mock_db_operations.assert_called_once()

def test_apply_loan_missing_fields(client):
    loan_data = {'income': 50000, 'loan_amount': 10000}
    response = client.post("/api/apply-loan", json=loan_data)
    assert response.status_code == 400
    assert 'Missing required field: credit_score' in response.get_json()['error']

def test_apply_loan_model_not_available(client):
    loan_data = {
        'income': 50000, 'credit_score': 700, 'loan_amount': 10000, 
        'employment_years': 5, 'address': '0x123TestAddress'
    }
    with patch('app.risk_model', None):
        response = client.post("/api/apply-loan", json=loan_data)
    assert response.status_code == 500
    assert response.get_json()['error'] == 'Risk assessment model not available'

# --- Tests for format_loan utility function ---

def test_format_loan_pending():
    raw_loan_data = ('0xBorrowerAddress', 1000, 5, 30, 0, 1678886400)
    formatted = format_loan(raw_loan_data)
    assert formatted['borrower'] == '0xBorrowerAddress'
    assert formatted['status'] == 'Pending'

# --- Tests for blockchain dependent endpoints (mocked) --- 

@patch("app.w3")
def test_get_active_loans_success(mock_app_w3, client):
    mock_app_w3.isConnected.return_value = True
    mock_contract = MagicMock()
    mock_app_w3.eth.contract.return_value = mock_contract
    mock_loan_1 = ('0xBorrower1', 100, 5, 30, 0, 1234567890)
    mock_contract.functions.getAllLoans().call.return_value = [mock_loan_1]
    with (patch("app.loan_manager_abi", ["abi"]),
          patch("app.loan_manager_address", "0xAddress")):
        response = client.get("/api/loans")
    assert response.status_code == 200
    assert len(response.get_json()) == 1

@patch("app.w3")
def test_get_active_loans_blockchain_error(mock_app_w3, client):
    mock_app_w3.isConnected.return_value = False
    with (patch("app.loan_manager_abi", ["abi"]),
          patch("app.loan_manager_address", "0xAddress")):
        response = client.get("/api/loans")
    assert response.status_code == 500
    assert response.get_json()['error'] == 'Blockchain connection not available'

@patch("app.w3")
@patch("web3.Web3.isAddress", return_value=True) # Mock isAddress for valid address cases
def test_get_borrower_loans_success(mock_web3_isAddress, mock_app_w3, client):
    mock_app_w3.isConnected.return_value = True
    mock_contract = MagicMock()
    mock_app_w3.eth.contract.return_value = mock_contract
    test_address = "0xValidBorrowerAddress000000000000000000"
    mock_loan_data = (test_address, 500, 8, 45, 1, 1234567892)
    mock_contract.functions.borrowerLoansCount(test_address).call.return_value = 1
    mock_contract.functions.borrowerLoans(test_address, 0).call.return_value = mock_loan_data
    with (patch("app.loan_manager_abi", ["abi"]),
          patch("app.loan_manager_address", "0xAddress")):
        response = client.get(f"/api/borrower/{test_address}/loans")
    assert response.status_code == 200
    assert len(response.get_json()) == 1
    mock_web3_isAddress.assert_called_with(test_address)

@patch("app.w3") # This patches app.w3 for the isConnected check
def test_get_borrower_loans_invalid_address_format(mock_app_w3, client):
    mock_app_w3.isConnected.return_value = True 
    with patch("web3.Web3.isAddress", return_value=False) as mock_isAddress_false:
        response = client.get("/api/borrower/invalidAddress/loans")
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Invalid Ethereum address'
    mock_isAddress_false.assert_called_with("invalidAddress")

@patch("app.w3")
@patch("web3.Web3.isAddress", return_value=True) # Mock isAddress for valid address cases
def test_get_borrower_loans_no_loans(mock_web3_isAddress, mock_app_w3, client):
    mock_app_w3.isConnected.return_value = True
    mock_contract = MagicMock()
    mock_app_w3.eth.contract.return_value = mock_contract
    test_address = "0xBorrowerWithNoLoans000000000000000000"
    mock_contract.functions.borrowerLoansCount(test_address).call.return_value = 0
    with (patch("app.loan_manager_abi", ["abi"]),
          patch("app.loan_manager_address", "0xAddress")):
        response = client.get(f"/api/borrower/{test_address}/loans")
    assert response.status_code == 200
    assert len(response.get_json()) == 0
    mock_web3_isAddress.assert_called_with(test_address)

