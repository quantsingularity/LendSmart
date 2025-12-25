#!/usr/bin/env python3
"""
Quick Installation & Verification Script for LendSmart Backend
Run this after extracting code_fixed.zip to verify everything works
"""
import sys
import os


def test_installation():
    print("=" * 60)
    print("LendSmart Backend - Installation Verification")
    print("=" * 60)

    # Check Python version
    print(f"\n1. Python Version: {sys.version}")
    if sys.version_info < (3, 8):
        print("   ✗ Python 3.8+ required!")
        return False
    print("   ✓ Python version OK")

    # Check dependencies
    print("\n2. Checking dependencies...")
    required_packages = [
        ("pandas", "Data processing"),
        ("numpy", "Numerical computing"),
        ("sklearn", "Machine learning"),
        ("joblib", "Model persistence"),
    ]

    missing = []
    for package, description in required_packages:
        try:
            __import__(package)
            print(f"   ✓ {package:15} - {description}")
        except ImportError:
            print(f"   ✗ {package:15} - {description} [MISSING]")
            missing.append(package)

    if missing:
        print(f"\n   Install missing packages: pip install {' '.join(missing)}")
        return False

    # Test imports
    print("\n3. Testing module imports...")
    sys.path.insert(0, os.path.join(os.getcwd(), "credit_risk_models/src"))
    sys.path.insert(0, os.path.join(os.getcwd(), "compliance_framework/src"))

    test_imports = [
        ("compliance", "ComplianceFramework"),
        ("risk_assessment", "LoanRiskModel"),
        ("data_sources", "AlternativeDataSource"),
        ("scoring", "AlternativeDataScoreAggregator"),
        ("utils", "setup_logging"),
    ]

    for module_name, class_name in test_imports:
        try:
            module = __import__(module_name)
            getattr(module, class_name)
            print(f"   ✓ {module_name}.{class_name}")
        except Exception as e:
            print(f"   ✗ {module_name}.{class_name} - {e}")
            return False

    # Quick functionality test
    print("\n4. Testing basic functionality...")
    try:
        from compliance import ComplianceFramework

        framework = ComplianceFramework()
        test_data = {"model_features": ["income"], "credit_report_used": False}
        result = framework.run_check("equal_opportunity", test_data)
        print(f"   ✓ ComplianceFramework.run_check() → {result[0]}")
    except Exception as e:
        print(f"   ✗ ComplianceFramework test failed: {e}")
        return False

    try:
        from risk_assessment import LoanRiskModel

        model = LoanRiskModel()
        X, y = model.generate_synthetic_training_data(n_samples=50)
        print(f"   ✓ LoanRiskModel.generate_synthetic_training_data() → {X.shape}")
    except Exception as e:
        print(f"   ✗ LoanRiskModel test failed: {e}")
        return False

    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nYour LendSmart backend is ready to use!")
    print("\nNext steps:")
    print("  1. Train a model: cd credit_risk_models && python3 train_model.py")
    print("  2. Run predictions: python3 prediction_service.py --input_data '{...}'")
    print("  3. Check compliance: import ComplianceFramework and run checks")
    print("\nSee CHANGES_SUMMARY.md for detailed documentation.")
    return True


if __name__ == "__main__":
    success = test_installation()
    sys.exit(0 if success else 1)
