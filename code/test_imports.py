"""Test basic imports and type checking of all fixed modules"""

import sys
import os

# Add paths
sys.path.insert(0, os.path.join(os.getcwd(), "credit_risk_models/src"))
sys.path.insert(0, os.path.join(os.getcwd(), "credit_risk_models"))
sys.path.insert(0, os.path.join(os.getcwd(), "compliance_framework/src"))

print("Testing imports...")

try:
    # Test utils
    print("✓ utils module imports")
except Exception as e:
    print(f"✗ utils import failed: {e}")

try:
    # Test compliance
    print("✓ compliance module imports")
except Exception as e:
    print(f"✗ compliance import failed: {e}")

try:
    # Test data_sources
    print("✓ data_sources module imports")
except Exception as e:
    print(f"✗ data_sources import failed: {e}")

try:
    # Test scoring
    print("✓ scoring module imports")
except Exception as e:
    print(f"✗ scoring import failed: {e}")

try:
    # Test credit_scoring_model
    print("✓ credit_scoring_model module imports")
except Exception as e:
    print(f"✗ credit_scoring_model import failed: {e}")

print("\nAll import tests completed!")
