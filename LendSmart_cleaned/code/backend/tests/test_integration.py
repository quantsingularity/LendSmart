import pytest
import sys
import os

# Add the parent directory (backend) to sys.path to allow importing 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, w3 # Now this should work
from web3 import Web3

@pytest.fixture
def client():
    app.config['TESTING'] = True
    # Ensure w3 is initialized for tests, or mock it if external connection is not desired/reliable for unit tests
    # For now, let's assume app.py initializes it or it's okay for it to be None if connection fails
    # A better approach for unit tests might be to mock w3 and db connections
    return app.test_client()

def test_blockchain_connection(client):
    """Tests if the w3 object reports a connection. 
       Note: This relies on the actual Web3 connection established in app.py.
       For more robust unit testing, w3 should be mocked.
    """
    if w3:
        assert w3.isConnected() == True
    else:
        # If w3 is None (e.g. connection failed during app init), 
        # this test should reflect that or be skipped.
        # For now, let's make it fail if w3 is None, indicating a setup issue for tests.
        pytest.fail("w3 object is None, blockchain connection not established in app.py or not available to tests.")

def test_mongo_connection(client):
    """Tests the /api/health endpoint for database connection status."""
    response = client.get('/api/health')
    assert response.status_code == 200
    # The health check returns 'connected' or 'disconnected'
    # We expect 'connected' if the app's MongoDB connection was successful
    # If mongo is None in app.py (connection failed), this will be 'disconnected'
    # Similar to w3, for robust unit tests, the DB connection might be mocked.
    assert response.json['database'] == 'connected' # This might fail if DB isn't running or accessible

