# CLI Reference

**LendSmart Command-Line Interface**

Complete reference for all LendSmart CLI scripts and utilities.

---

## Table of Contents

- [Overview](#overview)
- [Installation Scripts](#installation-scripts)
- [Deployment Scripts](#deployment-scripts)
- [Testing Scripts](#testing-scripts)
- [Utility Scripts](#utility-scripts)
- [Script Options](#script-options)

---

## Overview

LendSmart provides command-line scripts for automation, deployment, and management tasks. All scripts are located in the `scripts/` directory.

### Script Locations

```
scripts/
├── setup_lendsmart_env.sh        # Initial environment setup
├── run_lendsmart.sh              # Start all services
├── run_all_tests.sh              # Run test suites
├── smart_contract_manager.sh     # Smart contract operations
├── ml_model_manager.sh           # ML model management
├── build_docker_images.sh        # Docker image builds
├── deploy_kubernetes.sh          # Kubernetes deployment
├── docker_orchestrator.sh        # Docker Compose management
└── lint-all.sh                   # Code linting
```

---

## Installation Scripts

### setup_lendsmart_env.sh

Initialize the LendSmart development environment.

**Purpose:** Automated setup of all dependencies and configurations.

| Command                  | Arguments | Description                | Example                            |
| ------------------------ | --------- | -------------------------- | ---------------------------------- |
| `setup_lendsmart_env.sh` | None      | Complete environment setup | `./scripts/setup_lendsmart_env.sh` |

**What it does:**

1. Checks system prerequisites (Node.js, Python, MongoDB, Redis)
2. Installs Node.js dependencies for backend and frontends
3. Creates Python virtual environment
4. Installs Python ML dependencies
5. Creates `.env` files from examples
6. Initializes MongoDB database
7. Seeds initial data
8. Compiles smart contracts

**Example:**

```bash
cd LendSmart
chmod +x scripts/setup_lendsmart_env.sh
./scripts/setup_lendsmart_env.sh
```

**Output:**

```
Starting LendSmart Environment Setup...
-----------------------------------------------------------------------------
Checking System-Level Dependencies...
-----------------------------------------------------------------------------
✓ Python 3 is already installed (3.9.7)
✓ Node.js is already installed (18.16.0)
✓ npm is already installed (9.5.1)
✓ MongoDB is already installed (5.0.9)
✓ Redis is already installed (6.2.6)

-----------------------------------------------------------------------------
Installing Backend Dependencies...
-----------------------------------------------------------------------------
Installing packages in code/backend...
...
Setup completed successfully!
```

**Troubleshooting:**

- **Permission denied:** Run `chmod +x scripts/setup_lendsmart_env.sh`
- **Missing dependencies:** Script will attempt to install via apt-get (Ubuntu/Debian)
- **Port conflicts:** Check `.env` files for port configuration

---

### run_lendsmart.sh

Start the LendSmart platform services.

**Purpose:** Launch backend, frontend, and optional services.

| Command            | Arguments  | Description                 | Example                               |
| ------------------ | ---------- | --------------------------- | ------------------------------------- |
| `run_lendsmart.sh` | None       | Start all services          | `./scripts/run_lendsmart.sh`          |
| `run_lendsmart.sh` | `backend`  | Start only backend          | `./scripts/run_lendsmart.sh backend`  |
| `run_lendsmart.sh` | `frontend` | Start only web frontend     | `./scripts/run_lendsmart.sh frontend` |
| `run_lendsmart.sh` | `mobile`   | Start mobile bundler        | `./scripts/run_lendsmart.sh mobile`   |
| `run_lendsmart.sh` | `ml`       | Start ML prediction service | `./scripts/run_lendsmart.sh ml`       |

**Example:**

```bash
# Start all services
./scripts/run_lendsmart.sh

# Start only backend
./scripts/run_lendsmart.sh backend

# Start backend and frontend
./scripts/run_lendsmart.sh backend frontend
```

**Services Started:**

| Service      | URL                            | Port | Description                |
| ------------ | ------------------------------ | ---- | -------------------------- |
| Backend API  | http://localhost:3001          | 3001 | Express REST API           |
| Web Frontend | http://localhost:3000          | 3000 | React web app              |
| API Docs     | http://localhost:3001/api-docs | 3001 | Swagger documentation      |
| ML Service   | http://localhost:8000          | 8000 | FastAPI prediction service |

**Graceful Shutdown:**

Press `Ctrl+C` to stop all services gracefully.

---

## Deployment Scripts

### smart_contract_manager.sh

Manage smart contract lifecycle.

**Purpose:** Compile, deploy, verify, and test smart contracts.

| Command                              | Arguments             | Description              | Example                                                   |
| ------------------------------------ | --------------------- | ------------------------ | --------------------------------------------------------- |
| `smart_contract_manager.sh compile`  | None                  | Compile all contracts    | `./scripts/smart_contract_manager.sh compile`             |
| `smart_contract_manager.sh deploy`   | `<network>`           | Deploy to network        | `./scripts/smart_contract_manager.sh deploy goerli`       |
| `smart_contract_manager.sh verify`   | `<network> <address>` | Verify contract          | `./scripts/smart_contract_manager.sh verify goerli 0x...` |
| `smart_contract_manager.sh test`     | None                  | Run contract tests       | `./scripts/smart_contract_manager.sh test`                |
| `smart_contract_manager.sh coverage` | None                  | Generate coverage report | `./scripts/smart_contract_manager.sh coverage`            |

**Examples:**

```bash
# Compile contracts
./scripts/smart_contract_manager.sh compile

# Deploy to Goerli testnet
./scripts/smart_contract_manager.sh deploy goerli

# Deploy to mainnet (requires confirmation)
./scripts/smart_contract_manager.sh deploy mainnet

# Verify deployed contract
./scripts/smart_contract_manager.sh verify goerli 0x1234567890123456789012345678901234567890

# Run tests
./scripts/smart_contract_manager.sh test

# Generate coverage report
./scripts/smart_contract_manager.sh coverage
```

**Supported Networks:**

- `localhost` - Local Hardhat network
- `goerli` - Ethereum Goerli testnet
- `sepolia` - Ethereum Sepolia testnet
- `mainnet` - Ethereum mainnet
- `polygon` - Polygon mainnet
- `mumbai` - Polygon Mumbai testnet
- `arbitrum` - Arbitrum One
- `arbitrum-goerli` - Arbitrum Goerli

**Prerequisites:**

- `.env` file with `ETHEREUM_PRIVATE_KEY` and RPC URLs
- Sufficient ETH/MATIC for gas fees
- Etherscan API key for verification

---

### build_docker_images.sh

Build Docker images for all services.

**Purpose:** Create production-ready Docker images.

| Command                  | Arguments  | Description         | Example                                     |
| ------------------------ | ---------- | ------------------- | ------------------------------------------- |
| `build_docker_images.sh` | None       | Build all images    | `./scripts/build_docker_images.sh`          |
| `build_docker_images.sh` | `backend`  | Build backend only  | `./scripts/build_docker_images.sh backend`  |
| `build_docker_images.sh` | `frontend` | Build frontend only | `./scripts/build_docker_images.sh frontend` |

**Example:**

```bash
# Build all images
./scripts/build_docker_images.sh

# Build and tag specific version
./scripts/build_docker_images.sh --tag v2.0.0

# Build without cache
./scripts/build_docker_images.sh --no-cache
```

**Images Created:**

- `lendsmart/backend:latest`
- `lendsmart/frontend:latest`
- `lendsmart/ml-service:latest`

---

### deploy_kubernetes.sh

Deploy to Kubernetes cluster.

**Purpose:** Deploy LendSmart to production Kubernetes environment.

| Command                         | Arguments       | Description             | Example                                              |
| ------------------------------- | --------------- | ----------------------- | ---------------------------------------------------- |
| `deploy_kubernetes.sh`          | `<environment>` | Deploy to environment   | `./scripts/deploy_kubernetes.sh production`          |
| `deploy_kubernetes.sh rollback` | `<environment>` | Rollback deployment     | `./scripts/deploy_kubernetes.sh rollback production` |
| `deploy_kubernetes.sh status`   | `<environment>` | Check deployment status | `./scripts/deploy_kubernetes.sh status production`   |

**Example:**

```bash
# Deploy to staging
./scripts/deploy_kubernetes.sh staging

# Deploy to production
./scripts/deploy_kubernetes.sh production

# Check deployment status
./scripts/deploy_kubernetes.sh status production

# Rollback if needed
./scripts/deploy_kubernetes.sh rollback production
```

---

### docker_orchestrator.sh

Manage Docker Compose services.

**Purpose:** Start/stop services using Docker Compose.

| Command                          | Arguments   | Description        | Example                                            |
| -------------------------------- | ----------- | ------------------ | -------------------------------------------------- |
| `docker_orchestrator.sh up`      | None        | Start all services | `./scripts/docker_orchestrator.sh up`              |
| `docker_orchestrator.sh down`    | None        | Stop all services  | `./scripts/docker_orchestrator.sh down`            |
| `docker_orchestrator.sh restart` | `<service>` | Restart service    | `./scripts/docker_orchestrator.sh restart backend` |
| `docker_orchestrator.sh logs`    | `<service>` | View service logs  | `./scripts/docker_orchestrator.sh logs backend`    |

**Example:**

```bash
# Start all services in detached mode
./scripts/docker_orchestrator.sh up -d

# View backend logs
./scripts/docker_orchestrator.sh logs backend

# Restart frontend service
./scripts/docker_orchestrator.sh restart frontend

# Stop all services
./scripts/docker_orchestrator.sh down
```

---

## Testing Scripts

### run_all_tests.sh

Execute comprehensive test suites.

**Purpose:** Run all tests across the platform.

| Command            | Arguments     | Description              | Example                                  |
| ------------------ | ------------- | ------------------------ | ---------------------------------------- |
| `run_all_tests.sh` | None          | Run all tests            | `./scripts/run_all_tests.sh`             |
| `run_all_tests.sh` | `backend`     | Backend tests only       | `./scripts/run_all_tests.sh backend`     |
| `run_all_tests.sh` | `frontend`    | Frontend tests only      | `./scripts/run_all_tests.sh frontend`    |
| `run_all_tests.sh` | `contracts`   | Smart contract tests     | `./scripts/run_all_tests.sh contracts`   |
| `run_all_tests.sh` | `integration` | Integration tests        | `./scripts/run_all_tests.sh integration` |
| `run_all_tests.sh` | `coverage`    | Generate coverage report | `./scripts/run_all_tests.sh coverage`    |

**Example:**

```bash
# Run all tests
./scripts/run_all_tests.sh

# Run backend tests with coverage
./scripts/run_all_tests.sh backend --coverage

# Run only unit tests
./scripts/run_all_tests.sh --unit

# Run integration tests
./scripts/run_all_tests.sh integration

# Generate HTML coverage report
./scripts/run_all_tests.sh coverage --html
```

**Test Output:**

```
===========================================
LendSmart Test Suite
===========================================

Running Backend Tests...
✓ Auth Controller - Registration (45ms)
✓ Auth Controller - Login (32ms)
✓ Loan Controller - Apply for loan (89ms)
...
Backend Tests: 156 passed, 0 failed

Running Frontend Tests...
✓ Login Component renders correctly (28ms)
✓ Dashboard displays loan data (41ms)
...
Frontend Tests: 89 passed, 0 failed

Running Smart Contract Tests...
✓ LendSmartLoan - Request loan (512ms)
✓ LendSmartLoan - Fund loan (389ms)
...
Contract Tests: 42 passed, 0 failed

===========================================
Total: 287 tests passed
Coverage: 83%
===========================================
```

---

### unified_test.sh

Unified test runner with advanced options.

**Purpose:** Flexible test execution with filtering.

| Command           | Arguments        | Description        | Example                                                       |
| ----------------- | ---------------- | ------------------ | ------------------------------------------------------------- |
| `unified_test.sh` | `--suite <name>` | Run specific suite | `./scripts/unified_test.sh --suite auth`                      |
| `unified_test.sh` | `--file <path>`  | Run specific file  | `./scripts/unified_test.sh --file backend/tests/auth.test.js` |
| `unified_test.sh` | `--watch`        | Watch mode         | `./scripts/unified_test.sh --watch`                           |
| `unified_test.sh` | `--parallel`     | Parallel execution | `./scripts/unified_test.sh --parallel`                        |

---

## Utility Scripts

### ml_model_manager.sh

Manage ML models and training.

**Purpose:** Train, evaluate, and deploy ML models.

| Command                        | Arguments        | Description              | Example                                                                     |
| ------------------------------ | ---------------- | ------------------------ | --------------------------------------------------------------------------- |
| `ml_model_manager.sh train`    | `--data <file>`  | Train model              | `./scripts/ml_model_manager.sh train --data data/loans.csv`                 |
| `ml_model_manager.sh evaluate` | `--model <path>` | Evaluate model           | `./scripts/ml_model_manager.sh evaluate --model models/credit_model.joblib` |
| `ml_model_manager.sh serve`    | `--port <port>`  | Start prediction service | `./scripts/ml_model_manager.sh serve --port 8000`                           |
| `ml_model_manager.sh retrain`  | None             | Retrain with new data    | `./scripts/ml_model_manager.sh retrain`                                     |

**Examples:**

```bash
# Train new model
./scripts/ml_model_manager.sh train --data data/historical_loans.csv --output models/

# Evaluate model performance
./scripts/ml_model_manager.sh evaluate --model models/credit_model.joblib --test-data data/test.csv

# Start prediction service
./scripts/ml_model_manager.sh serve --port 8000 --workers 4

# Retrain model with latest data
./scripts/ml_model_manager.sh retrain --incremental
```

**Training Output:**

```
Training Credit Scoring Model...
Loading data from data/historical_loans.csv
Samples: 50,000 | Features: 45

Preprocessing...
✓ Handling missing values
✓ Encoding categorical features
✓ Scaling numerical features

Training ensemble model...
✓ Random Forest
✓ Gradient Boosting
✓ XGBoost
✓ LightGBM

Model Performance:
  Accuracy: 0.892
  Precision: 0.885
  Recall: 0.897
  F1-Score: 0.891
  ROC-AUC: 0.934

Model saved to: models/credit_scoring_model_20241215.joblib
```

---

### lint-all.sh

Code quality and linting.

**Purpose:** Run linters across all codebases.

| Command       | Arguments | Description       | Example                         |
| ------------- | --------- | ----------------- | ------------------------------- |
| `lint-all.sh` | None      | Lint all code     | `./scripts/lint-all.sh`         |
| `lint-all.sh` | `--fix`   | Auto-fix issues   | `./scripts/lint-all.sh --fix`   |
| `lint-all.sh` | `backend` | Lint backend only | `./scripts/lint-all.sh backend` |

**Example:**

```bash
# Check all code
./scripts/lint-all.sh

# Auto-fix issues
./scripts/lint-all.sh --fix

# Lint specific component
./scripts/lint-all.sh backend --fix
```

---

## Script Options

### Global Options

These options work across most scripts:

| Option          | Description                | Example                 |
| --------------- | -------------------------- | ----------------------- |
| `-h, --help`    | Display help message       | `./script.sh --help`    |
| `-v, --verbose` | Verbose output             | `./script.sh --verbose` |
| `-q, --quiet`   | Quiet mode                 | `./script.sh --quiet`   |
| `--dry-run`     | Simulate without executing | `./script.sh --dry-run` |
| `--version`     | Display script version     | `./script.sh --version` |

### Environment Variables

Control script behavior with environment variables:

```bash
# Skip confirmation prompts
export SKIP_CONFIRM=true

# Custom log level
export LOG_LEVEL=debug

# Custom ports
export BACKEND_PORT=3001
export FRONTEND_PORT=3000

# Run script
./scripts/run_lendsmart.sh
```

---

## Common Workflows

### Complete Fresh Setup

```bash
# 1. Clone repository
git clone https://github.com/abrar2030/LendSmart.git
cd LendSmart

# 2. Run setup script
./scripts/setup_lendsmart_env.sh

# 3. Deploy contracts to testnet
./scripts/smart_contract_manager.sh deploy goerli

# 4. Train ML models (optional)
./scripts/ml_model_manager.sh train --data data/sample_loans.csv

# 5. Start platform
./scripts/run_lendsmart.sh

# 6. Run tests
./scripts/run_all_tests.sh
```

### Production Deployment

```bash
# 1. Build Docker images
./scripts/build_docker_images.sh --tag v2.0.0

# 2. Run tests
./scripts/run_all_tests.sh

# 3. Deploy to Kubernetes
./scripts/deploy_kubernetes.sh production

# 4. Monitor deployment
./scripts/deploy_kubernetes.sh status production

# 5. If issues, rollback
./scripts/deploy_kubernetes.sh rollback production
```

### Development Iteration

```bash
# Start services in watch mode
./scripts/run_lendsmart.sh --watch

# In another terminal, run tests in watch mode
./scripts/run_all_tests.sh --watch

# Lint before commit
./scripts/lint-all.sh --fix
```

---

## Troubleshooting

### Permission Issues

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Or individually
chmod +x scripts/setup_lendsmart_env.sh
```

### Port Conflicts

```bash
# Check ports in use
lsof -i :3000 -i :3001 -i :8000

# Kill process on port
kill -9 $(lsof -t -i:3000)

# Or change ports in .env
```

### Script Fails

```bash
# Run with verbose output
./scripts/script_name.sh --verbose

# Check logs
cat logs/script_name.log

# Dry run first
./scripts/script_name.sh --dry-run
```

---

## Script Development

### Adding New Scripts

```bash
# Create new script
touch scripts/my_new_script.sh
chmod +x scripts/my_new_script.sh

# Use this template:
cat > scripts/my_new_script.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Script description
# Usage: ./my_new_script.sh [options]

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Your code here
echo "Running my script..."

EOF
---

**For usage examples:** See [Usage Guide](USAGE.md) for practical workflows using these scripts.
```
