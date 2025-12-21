# Setup Guide

This document provides comprehensive instructions for setting up and deploying the LendSmart platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Blockchain Configuration](#blockchain-configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the LendSmart platform, ensure you have the following prerequisites installed:

### System Requirements

- **Operating System**: Linux (recommended), macOS, or Windows with WSL
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ available space

### Software Requirements

- **Node.js**: v16.x or later
- **Python**: v3.8 or later
- **MongoDB**: v5.0 or later
- **Ethereum Client**: Geth or Infura API access
- **Docker**: v20.x or later (for containerized deployment)
- **Docker Compose**: v2.x or later
- **Git**: v2.x or later

### Cloud Services (for production)

- **AWS Account** or other cloud provider
- **Domain Name** and SSL certificate
- **SMTP Service** for email notifications

## Local Development Setup

Follow these steps to set up the LendSmart platform for local development:

### 1. Clone the Repository

```bash
git clone https://github.com/abrar2030/LendSmart.git
cd LendSmart
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd code/backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
```

### 4. Blockchain Setup

```bash
# Navigate to blockchain directory
cd ../blockchain

# Install dependencies
npm install

# Install Truffle globally if not already installed
npm install -g truffle

# Create .env file from template
cp .env.example .env
```

## Environment Configuration

Configure the environment variables in the `.env` files for each component:

### Backend Environment Variables

```
# Server Configuration
PORT=3001
NODE_ENV=development
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lendsmart
MONGODB_TEST_URI=mongodb://localhost:27017/lendsmart_test

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRATION=7d

# Blockchain Configuration
BLOCKCHAIN_NETWORK=development
INFURA_PROJECT_ID=your_infura_project_id
WALLET_PRIVATE_KEY=your_wallet_private_key

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@lendsmart.io

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_API_KEY=your_ai_service_api_key

# File Storage
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads
AWS_S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

### Frontend Environment Variables

```
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_BLOCKCHAIN_NETWORK=development
REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
REACT_APP_GOOGLE_ANALYTICS_ID=your_ga_id
```

### Blockchain Environment Variables

```
INFURA_PROJECT_ID=your_infura_project_id
WALLET_MNEMONIC=your_wallet_mnemonic
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGON_API_KEY=your_polygon_api_key
GAS_PRICE_GWEI=20
GAS_LIMIT=6721975
```

## Database Setup

### MongoDB Setup

1. **Install MongoDB** (if not using Docker):

    ```bash
    # Ubuntu
    sudo apt-get install mongodb

    # macOS with Homebrew
    brew install mongodb-community
    ```

2. **Start MongoDB Service**:

    ```bash
    # Ubuntu
    sudo systemctl start mongodb

    # macOS
    brew services start mongodb-community
    ```

3. **Create Database and User**:

    ```bash
    # Connect to MongoDB shell
    mongo

    # Create database and user
    use lendsmart
    db.createUser({
      user: "lendsmart_user",
      pwd: "secure_password",
      roles: [{ role: "readWrite", db: "lendsmart" }]
    })
    ```

4. **Update Connection String** in backend `.env` file:
    ```
    MONGODB_URI=mongodb://lendsmart_user:secure_password@localhost:27017/lendsmart
    ```

### Database Initialization

Run the database initialization script to create collections and indexes:

```bash
# Navigate to backend directory
cd code/backend

# Run initialization script
npm run db:init
```

## Blockchain Configuration

### Local Blockchain Setup (for development)

1. **Install Ganache** for local blockchain:

    ```bash
    npm install -g ganache-cli
    ```

2. **Start Ganache**:

    ```bash
    ganache-cli -p 8545 -i 5777
    ```

3. **Deploy Smart Contracts**:

    ```bash
    # Navigate to blockchain directory
    cd code/blockchain

    # Compile contracts
    truffle compile

    # Deploy contracts to local blockchain
    truffle migrate --network development
    ```

### Testnet Configuration (for testing)

1. **Update Truffle Configuration** in `truffle-config.js`:

    ```javascript
    module.exports = {
        networks: {
            // ... other networks
            ropsten: {
                provider: () =>
                    new HDWalletProvider(
                        process.env.WALLET_MNEMONIC,
                        `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
                    ),
                network_id: 3,
                gas: 5500000,
                confirmations: 2,
                timeoutBlocks: 200,
                skipDryRun: true,
            },
        },
        // ... rest of config
    };
    ```

2. **Deploy to Testnet**:

    ```bash
    truffle migrate --network ropsten
    ```

3. **Update Contract Addresses** in backend `.env` file:
    ```
    LOAN_MANAGER_CONTRACT_ADDRESS=0x...
    BORROWER_CONTRACT_ADDRESS=0x...
    ```

## Running the Application

### Start Backend Server

```bash
# Navigate to backend directory
cd code/backend

# Start development server
npm run dev
```

### Start Frontend Development Server

```bash
# Navigate to frontend directory
cd code/frontend

# Start development server
npm start
```

### Start AI Service (if applicable)

```bash
# Navigate to AI service directory
cd code/ai-service

# Install Python dependencies
pip install -r requirements.txt

# Start AI service
python app.py
```

## Testing

### Backend Tests

```bash
# Navigate to backend directory
cd code/backend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd code/frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Smart Contract Tests

```bash
# Navigate to blockchain directory
cd code/blockchain

# Run tests
truffle test
```

### End-to-End Tests

```bash
# Navigate to e2e directory
cd code/e2e

# Install dependencies
npm install

# Run end-to-end tests
npm test
```

## Deployment

### Docker Deployment (Recommended)

1. **Build Docker Images**:

    ```bash
    # Build all services
    docker-compose build
    ```

2. **Start Services**:

    ```bash
    # Start all services
    docker-compose up -d
    ```

3. **Check Service Status**:
    ```bash
    docker-compose ps
    ```

### Kubernetes Deployment

1. **Apply Kubernetes Configurations**:

    ```bash
    # Navigate to Kubernetes directory
    cd infrastructure/kubernetes

    # Apply base configurations
    kubectl apply -f base/

    # Apply environment-specific configurations
    kubectl apply -f environments/dev/
    ```

2. **Verify Deployment**:
    ```bash
    kubectl get pods
    kubectl get services
    ```

### Terraform Deployment (Cloud Infrastructure)

1. **Initialize Terraform**:

    ```bash
    # Navigate to Terraform directory
    cd infrastructure/terraform

    # Initialize Terraform
    terraform init
    ```

2. **Plan Deployment**:

    ```bash
    # For development environment
    terraform plan -var-file=environments/dev/terraform.tfvars
    ```

3. **Apply Deployment**:
    ```bash
    terraform apply -var-file=environments/dev/terraform.tfvars
    ```

### Ansible Configuration (Server Setup)

1. **Update Inventory**:
   Edit `infrastructure/ansible/inventory/hosts.yml` with your server details.

2. **Run Ansible Playbook**:

    ```bash
    # Navigate to Ansible directory
    cd infrastructure/ansible

    # Run playbook
    ansible-playbook -i inventory/hosts.yml playbooks/main.yml
    ```
