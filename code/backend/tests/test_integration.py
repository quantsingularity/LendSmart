import pytest
from app import app, w3
from web3 import Web3

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

def test_blockchain_connection(client):
    assert w3.isConnected() == True

def test_mongo_connection(client):
    response = client.get('/api/health')
    assert response.json['database'] == 'connected'