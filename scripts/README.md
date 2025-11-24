# LendSmart Automation Scripts

This collection of automation scripts is designed to streamline development, testing, and deployment workflows for the LendSmart platform. Each script addresses specific automation needs identified in the repository.

## Scripts Overview

### 1. Unified Testing (`unified_test.sh`)

A comprehensive testing script that runs all tests across project components in a unified manner with detailed reporting and parallel execution where possible.

**Key Features:**

- Runs tests for all major components (smart contracts, backend, frontend, ML models)
- Generates detailed test reports with timing information
- Provides a summary of test results
- Handles environment setup automatically

### 2. Smart Contract Manager (`smart_contract_manager.sh`)

Utilities for managing smart contract deployment, verification, and interaction across different networks.

**Key Features:**

- Compile, deploy, and verify contracts
- Interactive console for contract interaction
- Gas usage reporting
- Contract flattening for verification
- Deployment status tracking

### 3. ML Model Manager (`ml_model_manager.sh`)

Tools for training, evaluating, and deploying machine learning models.

**Key Features:**

- Environment setup for ML development
- Model training and evaluation
- Model deployment to production
- Batch prediction capabilities
- Performance reporting
- Data synchronization from production

### 4. Docker Orchestrator (`docker_orchestrator.sh`)

Simplifies Docker container management for local development and testing.

**Key Features:**

- Setup Docker environment with appropriate configurations
- Start, stop, and restart services
- Monitor service status and logs
- Build or rebuild specific services
- Execute commands in running containers
- Clean up Docker resources

## Usage Instructions

1. Make sure all scripts are executable:

    ```
    chmod +x *.sh
    ```

2. Run any script with the `help` command to see available options:

    ```
    ./unified_test.sh help
    ./smart_contract_manager.sh help
    ./ml_model_manager.sh help
    ./docker_orchestrator.sh help
    ```

3. Place these scripts in your LendSmart project root directory for optimal functionality.

## Requirements

- Bash shell environment
- Docker and Docker Compose (for Docker Orchestrator)
- Node.js and npm (for Smart Contract Manager)
- Python 3.x (for ML Model Manager)
- Git

## Integration with Existing Workflows

These scripts are designed to complement existing automation in the LendSmart repository:

- They work alongside the existing CI/CD pipeline
- They extend the functionality of current scripts like `lint-all.sh`
- They provide local alternatives to GitHub Actions workflows

## Customization

Each script can be customized to better fit your specific workflow:

- Edit directory paths in the script headers if your project structure differs
- Modify commands to match your specific toolchain
- Add or remove components as your project evolves
