# Installation Guide

**LendSmart Platform Installation**

This guide covers installation procedures for all components of the LendSmart platform across different operating systems and deployment environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Methods](#installation-methods)
- [Component Installation](#component-installation)
- [Verification](#verification)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

| Software    | Minimum Version | Purpose          | Installation Check       |
| ----------- | --------------- | ---------------- | ------------------------ |
| **Node.js** | 18.0.0+         | Backend runtime  | `node --version`         |
| **npm**     | 8.0.0+          | Package manager  | `npm --version`          |
| **Python**  | 3.8+            | ML models        | `python3 --version`      |
| **MongoDB** | 5.0+            | Primary database | `mongod --version`       |
| **Redis**   | 6.0+            | Cache & sessions | `redis-server --version` |
| **Git**     | 2.0+            | Version control  | `git --version`          |

### Optional Software

| Software          | Purpose                    | When Needed            |
| ----------------- | -------------------------- | ---------------------- |
| **Docker** 20.10+ | Containerized deployment   | Production deployments |
| **Hardhat**       | Smart contract development | Blockchain development |
| **Metamask**      | Wallet integration testing | Frontend testing       |

---

## System Requirements

### Development Environment

| OS / Platform             | Recommended Install Method | Notes                               |
| ------------------------- | -------------------------- | ----------------------------------- |
| **macOS**                 | Homebrew + manual setup    | Best for React Native development   |
| **Linux (Ubuntu/Debian)** | apt + manual setup         | Recommended for backend development |
| **Linux (RHEL/CentOS)**   | yum + manual setup         | Enterprise deployments              |
| **Windows 10/11**         | WSL2 + manual setup        | Use WSL2 for best compatibility     |
| **Docker**                | Docker Compose             | Platform-agnostic, production-ready |

### Hardware Requirements

**Minimum:**

- CPU: 4 cores
- RAM: 8 GB
- Storage: 20 GB free space
- Network: Broadband connection

**Recommended:**

- CPU: 8+ cores
- RAM: 16 GB
- Storage: 50 GB SSD
- Network: High-speed connection

---

## Installation Methods

### Method 1: Quick Setup Script (Recommended)

The fastest way to get started on Linux/macOS:

```bash
# Clone repository
git clone https://github.com/abrar2030/LendSmart.git
cd LendSmart

# Run automated setup
chmod +x scripts/setup_lendsmart_env.sh
./scripts/setup_lendsmart_env.sh

# The script will:
# - Check prerequisites
# - Install dependencies
# - Configure environment
# - Initialize databases
```

### Method 2: Docker Compose (Production)

Best for production-like environments:

```bash
# Clone repository
git clone https://github.com/abrar2030/LendSmart.git
cd LendSmart

# Build and start all services
docker-compose up -d

# Services will be available at:
# - Backend API: http://localhost:3001
# - Frontend: http://localhost:5173
# - MongoDB: localhost:27017
# - Redis: localhost:6379
```

### Method 3: Manual Installation

For custom setups and development:

See [Component Installation](#component-installation) below.

---

## Component Installation

### 1. Backend API (Node.js/Express)

#### Step 1: Install Dependencies

```bash
cd code/backend
npm install
```

#### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Critical Environment Variables:**

```env
# Server
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/lendsmart_development
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
LOAN_CONTRACT_ADDRESS=0x...
```

#### Step 3: Initialize Database

```bash
# Seed database with initial data
npm run seed
```

#### Step 4: Start Backend

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

**Verify:** Access http://localhost:3001/health

---

### 2. Frontend Web Application (React)

#### Step 1: Install Dependencies

```bash
cd code/web-frontend
npm install
```

#### Step 2: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BLOCKCHAIN_NETWORK=mainnet
REACT_APP_CONTRACT_ADDRESS=0x...
EOF
```

#### Step 3: Start Frontend

```bash
# Development mode
npm start

# Build for production
npm run build
```

**Verify:** Access http://localhost:3000

---

### 3. Mobile Application (React Native)

#### Prerequisites

```bash
# Install React Native CLI
npm install -g react-native-cli

# iOS: Install CocoaPods
sudo gem install cocoapods

# Android: Install Android Studio with SDK
```

#### Step 1: Install Dependencies

```bash
cd code/mobile-frontend
npm install

# iOS only
cd ios && pod install && cd ..
```

#### Step 2: Configure Environment

```bash
# Create config file
cat > src/config/index.js << 'EOF'
export default {
  API_URL: 'http://localhost:3001/api',
  BLOCKCHAIN_NETWORK: 'mainnet',
  CONTRACT_ADDRESS: '0x...'
};
EOF
```

#### Step 3: Run Mobile App

```bash
# iOS
npm run ios

# Android
npm run android

# Start Metro bundler
npm start
```

---

### 4. Smart Contracts (Solidity/Hardhat)

#### Step 1: Install Dependencies

```bash
cd code/smart-contracts
npm install
```

#### Step 2: Configure Network

```bash
# Edit hardhat.config.js
# Add your network RPC URLs and private keys
```

#### Step 3: Compile Contracts

```bash
npx hardhat compile
```

#### Step 4: Deploy Contracts

```bash
# Deploy to local network
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# Deploy to testnet
npx hardhat run scripts/deploy.js --network goerli

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

**Save contract addresses** to environment variables.

---

### 5. AI/ML Credit Scoring Models (Python)

#### Step 1: Create Virtual Environment

```bash
cd code/credit_risk_models
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows
```

#### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 3: Train Models (Optional)

```bash
# Train credit scoring model
python train_model.py --data data/loan_data.csv --output models/

# Test model
python -m pytest tests/
```

#### Step 4: Start Prediction Service

```bash
# Start FastAPI service
python prediction_service.py

# Service available at http://localhost:8000
```

---

### 6. Database Setup

#### MongoDB

```bash
# Start MongoDB
mongod --dbpath /data/db

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:5.0

# Create database and user
mongo
> use lendsmart_development
> db.createUser({
    user: "lendsmart",
    pwd: "secure_password",
    roles: ["readWrite", "dbAdmin"]
  })
```

#### Redis

```bash
# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 --name redis redis:6.0

# Test connection
redis-cli ping
# Should return: PONG
```

---

## Verification

### Backend Health Check

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Database Connectivity

```bash
# MongoDB
mongo mongodb://localhost:27017/lendsmart_development --eval "db.stats()"

# Redis
redis-cli ping
```

### Smart Contract Deployment

```bash
cd code/smart-contracts
npx hardhat verify --network goerli <CONTRACT_ADDRESS>
```

### ML Model Service

```bash
curl -X POST http://localhost:8000/api/v1/score \
  -H "Content-Type: application/json" \
  -d '{"credit_score": 720, "income": 60000, "debt": 15000}'
```

### Complete System Test

```bash
# Run all tests
cd LendSmart
./scripts/run_all_tests.sh
```

---

## Platform-Specific Instructions

### macOS Installation

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install prerequisites
brew install node mongodb-community redis python@3.9 git

# Start services
brew services start mongodb-community
brew services start redis

# Continue with component installation...
```

### Ubuntu/Debian Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Redis
sudo apt install -y redis-server

# Install Python
sudo apt install -y python3.9 python3-pip python3-venv

# Start services
sudo systemctl start mongod
sudo systemctl start redis-server

# Continue with component installation...
```

### Windows (WSL2) Installation

```bash
# Install WSL2 (PowerShell as Administrator)
wsl --install -d Ubuntu

# Inside WSL2, follow Ubuntu instructions above

# Install Node.js on Windows for frontend development
# Download from: https://nodejs.org/

# Install MongoDB Compass for database management
# Download from: https://www.mongodb.com/try/download/compass
```

### Docker Installation

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start LendSmart
cd LendSmart
docker-compose up -d
```

---

## Next Steps

After successful installation:

1. **Configure Platform:** See [Configuration Guide](CONFIGURATION.md)
2. **Learn Usage:** Read [Usage Guide](USAGE.md)
3. **Explore API:** Check [API Reference](API.md)
4. **Deploy Smart Contracts:** Follow [Smart Contract Example](examples/SMART_CONTRACT_EXAMPLE.md)
5. **Run Tests:** Execute `./scripts/run_all_tests.sh`

---

## Troubleshooting Installation

For common installation issues, see [Troubleshooting Guide](TROUBLESHOOTING.md).

**Common Issues:**

- **Port conflicts:** Change ports in `.env` files
- **MongoDB connection:** Check MongoDB is running with `systemctl status mongod`
- **Node version:** Use nvm to switch versions: `nvm use 18`
- **Permission errors:** Don't use `sudo` with npm; fix permissions instead
- **M1 Mac issues:** Some packages may need Rosetta or native ARM builds

---

**Installation complete!** Proceed to [Configuration](CONFIGURATION.md) to customize your deployment.
