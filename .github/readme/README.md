# GitHub Workflows

This directory contains GitHub Actions workflow configurations that automate the CI/CD pipeline for the LendSmart project.

## Directory Structure

- `workflows/` - Contains GitHub Actions workflow definition files
    - `ci-cd.yml` - Main CI/CD pipeline configuration

## CI/CD Pipeline

The LendSmart CI/CD pipeline (`ci-cd.yml`) automates the following processes:

### Linting

Runs code quality checks on:

- Smart contracts using Solhint
- Backend code using ESLint
- Frontend code using ESLint

### Testing

Executes comprehensive test suites for:

- Smart contracts using Hardhat
- Backend services
- Frontend components
- AI risk assessment models

### Deployment

For branches `main` and `develop`, the pipeline:

1. Deploys smart contracts to the Sepolia testnet
2. Verifies contracts on Etherscan
3. Updates deployment information
4. Creates a deployment summary as a comment on the related PR

## Environment Secrets

The workflow requires the following secrets to be configured in the repository settings:

- `DEPLOY_PRIVATE_KEY` - Private key for deploying contracts
- `ETHERSCAN_API_KEY` - API key for Etherscan verification
- `INFURA_API_KEY` - API key for Infura node access

## Usage

The workflow triggers automatically on:

- Push events to `main` and `develop` branches
- Pull requests targeting `main` and `develop` branches

No manual intervention is required for the CI/CD process to run.
