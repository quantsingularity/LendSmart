import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # MongoDB configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/lending')
    
    # Web3 configuration
    WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'http://localhost:8545')
    
    # Contract configuration
    LOAN_MANAGER_ADDRESS = os.getenv('LOAN_MANAGER_ADDRESS', '0x0000000000000000000000000000000000000000')
    
    # AI model configuration
    MODEL_PATH = os.getenv('MODEL_PATH', os.path.join(os.path.dirname(__file__), '../ai_models/risk_assessment_model.pkl'))
    
    # Application configuration
    DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    
    # API configuration
    API_PREFIX = '/api'
