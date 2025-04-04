import os

class Config:
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/lending')
    WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'http://localhost:8545')
    MODEL_PATH = os.getenv('MODEL_PATH', '../ai_models/risk_assessment_model.pkl')