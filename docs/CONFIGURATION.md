# Configuration Guide

**LendSmart Platform Configuration**

This guide provides comprehensive configuration options for all LendSmart components.

---

## Table of Contents

- [Environment Variables](#environment-variables)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Smart Contract Configuration](#smart-contract-configuration)
- [AI/ML Model Configuration](#aiml-model-configuration)
- [Security Configuration](#security-configuration)
- [Database Configuration](#database-configuration)
- [External Services](#external-services)

---

## Environment Variables

### Backend Environment Variables (.env)

Located in `code/backend/.env`

#### Server Configuration

| Option        | Type   | Default       | Description                                              | Where to set |
| ------------- | ------ | ------------- | -------------------------------------------------------- | ------------ |
| `NODE_ENV`    | string | `development` | Environment mode: `development`, `staging`, `production` | env file     |
| `PORT`        | number | `3001`        | Backend server port                                      | env file     |
| `HOST`        | string | `0.0.0.0`     | Server bind address                                      | env file     |
| `APP_VERSION` | string | `2.0.0`       | Application version                                      | env file     |

#### Database Configuration

| Option                | Type   | Default                               | Description                   | Where to set |
| --------------------- | ------ | ------------------------------------- | ----------------------------- | ------------ |
| `MONGODB_URI`         | string | `mongodb://localhost:27017/lendsmart` | MongoDB connection string     | env file     |
| `MONGO_MAX_POOL_SIZE` | number | `10`                                  | Maximum connection pool size  | env file     |
| `MONGO_MIN_POOL_SIZE` | number | `2`                                   | Minimum connection pool size  | env file     |
| `REDIS_HOST`          | string | `localhost`                           | Redis server hostname         | env file     |
| `REDIS_PORT`          | number | `6379`                                | Redis server port             | env file     |
| `REDIS_PASSWORD`      | string | ``                                    | Redis authentication password | env file     |
| `REDIS_DB`            | number | `0`                                   | Redis database index (0-15)   | env file     |

#### Security Configuration

| Option                 | Type   | Default       | Description                       | Where to set |
| ---------------------- | ------ | ------------- | --------------------------------- | ------------ |
| `JWT_SECRET`           | string | **REQUIRED**  | JWT signing secret (min 32 chars) | env file     |
| `JWT_EXPIRE`           | string | `1h`          | JWT token expiration time         | env file     |
| `REFRESH_TOKEN_SECRET` | string | **REQUIRED**  | Refresh token secret              | env file     |
| `REFRESH_TOKEN_EXPIRE` | string | `7d`          | Refresh token expiration          | env file     |
| `ENCRYPTION_KEY`       | string | **REQUIRED**  | AES-256 encryption key (32 chars) | env file     |
| `ENCRYPTION_ALGORITHM` | string | `aes-256-gcm` | Encryption algorithm              | env file     |
| `SESSION_SECRET`       | string | **REQUIRED**  | Express session secret            | env file     |
| `SESSION_MAX_AGE`      | number | `86400000`    | Session lifetime in milliseconds  | env file     |

#### CORS Configuration

| Option            | Type   | Default                 | Description                     | Where to set |
| ----------------- | ------ | ----------------------- | ------------------------------- | ------------ |
| `ALLOWED_ORIGINS` | string | `http://localhost:3000` | Comma-separated allowed origins | env file     |

#### Rate Limiting

| Option                    | Type   | Default  | Description                    | Where to set |
| ------------------------- | ------ | -------- | ------------------------------ | ------------ |
| `RATE_LIMIT_WINDOW_MS`    | number | `900000` | Rate limit window (15 minutes) | env file     |
| `RATE_LIMIT_MAX_REQUESTS` | number | `1000`   | Max requests per window        | env file     |

#### External Services

| Option                  | Type   | Default       | Description                                               | Where to set |
| ----------------------- | ------ | ------------- | --------------------------------------------------------- | ------------ |
| `STRIPE_SECRET_KEY`     | string | `sk_test_...` | Stripe API secret key                                     | env file     |
| `STRIPE_PUBLIC_KEY`     | string | `pk_test_...` | Stripe publishable key                                    | env file     |
| `STRIPE_WEBHOOK_SECRET` | string | `whsec_...`   | Stripe webhook signing secret                             | env file     |
| `PLAID_CLIENT_ID`       | string | ``            | Plaid client ID                                           | env file     |
| `PLAID_SECRET`          | string | ``            | Plaid API secret                                          | env file     |
| `PLAID_ENV`             | string | `sandbox`     | Plaid environment: `sandbox`, `development`, `production` | env file     |

#### Blockchain Configuration

| Option                   | Type   | Default                            | Description                            | Where to set |
| ------------------------ | ------ | ---------------------------------- | -------------------------------------- | ------------ |
| `ETHEREUM_RPC_URL`       | string | `https://mainnet.infura.io/v3/...` | Ethereum node RPC URL                  | env file     |
| `ETHEREUM_CHAIN_ID`      | number | `1`                                | Network chain ID (1=mainnet, 5=goerli) | env file     |
| `ETHEREUM_PRIVATE_KEY`   | string | ``                                 | Deployer private key (DO NOT COMMIT)   | env file     |
| `POLYGON_RPC_URL`        | string | `https://polygon-rpc.com`          | Polygon RPC URL                        | env file     |
| `ARBITRUM_RPC_URL`       | string | `https://arb1.arbitrum.io/rpc`     | Arbitrum RPC URL                       | env file     |
| `LOAN_CONTRACT_ADDRESS`  | string | `0x...`                            | Deployed loan contract address         | env file     |
| `TOKEN_CONTRACT_ADDRESS` | string | `0x...`                            | Platform token address                 | env file     |

#### Email Configuration

| Option            | Type    | Default                 | Description                 | Where to set |
| ----------------- | ------- | ----------------------- | --------------------------- | ------------ |
| `SMTP_HOST`       | string  | `smtp.gmail.com`        | SMTP server hostname        | env file     |
| `SMTP_PORT`       | number  | `587`                   | SMTP server port            | env file     |
| `SMTP_SECURE`     | boolean | `false`                 | Use TLS (true for port 465) | env file     |
| `SMTP_USER`       | string  | ``                      | SMTP username/email         | env file     |
| `SMTP_PASSWORD`   | string  | ``                      | SMTP password/app password  | env file     |
| `EMAIL_FROM`      | string  | `noreply@lendsmart.com` | Default sender email        | env file     |
| `EMAIL_FROM_NAME` | string  | `LendSmart`             | Default sender name         | env file     |

#### SMS Configuration (Twilio)

| Option                | Type   | Default | Description         | Where to set |
| --------------------- | ------ | ------- | ------------------- | ------------ |
| `TWILIO_ACCOUNT_SID`  | string | ``      | Twilio account SID  | env file     |
| `TWILIO_AUTH_TOKEN`   | string | ``      | Twilio auth token   | env file     |
| `TWILIO_PHONE_NUMBER` | string | ``      | Twilio phone number | env file     |

#### File Storage (AWS S3)

| Option                  | Type   | Default               | Description    | Where to set |
| ----------------------- | ------ | --------------------- | -------------- | ------------ |
| `AWS_ACCESS_KEY_ID`     | string | ``                    | AWS access key | env file     |
| `AWS_SECRET_ACCESS_KEY` | string | ``                    | AWS secret key | env file     |
| `AWS_REGION`            | string | `us-east-1`           | AWS region     | env file     |
| `AWS_S3_BUCKET`         | string | `lendsmart-documents` | S3 bucket name | env file     |

#### Logging Configuration

| Option          | Type   | Default  | Description                                     | Where to set |
| --------------- | ------ | -------- | ----------------------------------------------- | ------------ |
| `LOG_LEVEL`     | string | `info`   | Logging level: `error`, `warn`, `info`, `debug` | env file     |
| `LOG_FORMAT`    | string | `json`   | Log format: `json`, `simple`                    | env file     |
| `LOG_FILE_PATH` | string | `./logs` | Log file directory                              | env file     |

#### Feature Flags

| Option                          | Type    | Default | Description                        | Where to set |
| ------------------------------- | ------- | ------- | ---------------------------------- | ------------ |
| `ENABLE_MFA`                    | boolean | `true`  | Enable multi-factor authentication | env file     |
| `ENABLE_KYC_VERIFICATION`       | boolean | `true`  | Enable KYC verification            | env file     |
| `ENABLE_BLOCKCHAIN_INTEGRATION` | boolean | `true`  | Enable blockchain features         | env file     |
| `ENABLE_CREDIT_SCORING`         | boolean | `true`  | Enable AI credit scoring           | env file     |
| `ENABLE_EMAIL_NOTIFICATIONS`    | boolean | `true`  | Enable email notifications         | env file     |
| `ENABLE_SMS_NOTIFICATIONS`      | boolean | `false` | Enable SMS notifications           | env file     |

#### Business Logic Configuration

| Option                            | Type   | Default  | Description               | Where to set |
| --------------------------------- | ------ | -------- | ------------------------- | ------------ |
| `MIN_LOAN_AMOUNT`                 | number | `1000`   | Minimum loan amount (USD) | env file     |
| `MAX_LOAN_AMOUNT`                 | number | `100000` | Maximum loan amount (USD) | env file     |
| `MIN_INTEREST_RATE`               | number | `5`      | Minimum interest rate (%) | env file     |
| `MAX_INTEREST_RATE`               | number | `25`     | Maximum interest rate (%) | env file     |
| `MIN_LOAN_TERM_MONTHS`            | number | `6`      | Minimum loan term         | env file     |
| `MAX_LOAN_TERM_MONTHS`            | number | `60`     | Maximum loan term         | env file     |
| `MIN_CREDIT_SCORE`                | number | `300`    | Minimum credit score      | env file     |
| `MAX_CREDIT_SCORE`                | number | `850`    | Maximum credit score      | env file     |
| `CREDIT_SCORE_THRESHOLD_APPROVAL` | number | `650`    | Auto-approval threshold   | env file     |

---

## Backend Configuration

### Example .env File

```env
# ==================================================
# LendSmart Backend Configuration
# ==================================================

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://lendsmart_user:secure_password@localhost:27017/lendsmart_production
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_MIN_32_CHARS
REFRESH_TOKEN_SECRET=CHANGE_THIS_TO_ANOTHER_SECURE_STRING
ENCRYPTION_KEY=CHANGE_THIS_TO_32_CHAR_STRING!
SESSION_SECRET=CHANGE_THIS_SESSION_SECRET_STRING

# CORS
ALLOWED_ORIGINS=https://app.lendsmart.com,https://www.lendsmart.com

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
LOAN_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY

# Payment
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY

# Feature Flags
ENABLE_MFA=true
ENABLE_KYC_VERIFICATION=true
```

---

## Frontend Configuration

### Web Frontend (.env)

Located in `code/web-frontend/.env`

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_VERSION=v1

# Blockchain Configuration
REACT_APP_BLOCKCHAIN_NETWORK=mainnet
REACT_APP_CHAIN_ID=1
REACT_APP_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
REACT_APP_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### Mobile Frontend Configuration

Located in `code/mobile-frontend/src/config/index.js`

```javascript
export default {
  // API Configuration
  API_URL: __DEV__
    ? "http://localhost:3001/api"
    : "https://api.lendsmart.com/api",
  API_VERSION: "v1",
  API_TIMEOUT: 30000,

  // Blockchain Configuration
  BLOCKCHAIN_NETWORK: "mainnet",
  CHAIN_ID: 1,
  CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890",
  RPC_URL: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",

  // Features
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,

  // App Configuration
  APP_VERSION: "1.0.0",
  MIN_PASSWORD_LENGTH: 8,
  SESSION_TIMEOUT: 900000, // 15 minutes
};
```

---

## Smart Contract Configuration

### Hardhat Configuration

Located in `code/smart-contracts/hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // Ethereum Testnet
    goerli: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.ETHEREUM_PRIVATE_KEY],
      chainId: 5,
    },

    // Ethereum Mainnet
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.ETHEREUM_PRIVATE_KEY],
      chainId: 1,
      gasPrice: "auto",
    },

    // Polygon
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.ETHEREUM_PRIVATE_KEY],
      chainId: 137,
    },

    // Arbitrum
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.ETHEREUM_PRIVATE_KEY],
      chainId: 42161,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
```

### Contract Deployment Configuration

Create `code/smart-contracts/.env`:

```env
# Network Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Deployer Configuration
ETHEREUM_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# Contract Configuration
PLATFORM_FEE_RATE=100  # 1.00%
FEE_RECIPIENT_ADDRESS=0xYourFeeRecipientAddress
RISK_ASSESSOR_ADDRESS=0xYourRiskAssessorAddress

# Verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Gas Configuration
REPORT_GAS=true
COINMARKETCAP_API_KEY=YOUR_CMC_API_KEY
```

---

## AI/ML Model Configuration

### Model Training Configuration

Located in `code/credit_risk_models/config.yaml`

```yaml
# Model Configuration
model:
  type: ensemble # rf, gb, xgb, lgb, nn, stacking, voting, ensemble
  random_state: 42
  cv_folds: 5
  n_jobs: -1

# Feature Engineering
features:
  numeric_features:
    - credit_score
    - annual_income
    - debt_to_income_ratio
    - employment_duration
    - loan_amount
  categorical_features:
    - employment_status
    - loan_purpose
    - home_ownership

# Training Parameters
training:
  test_size: 0.2
  validation_size: 0.1
  stratify: true

# Hyperparameter Tuning
hyperparameters:
  random_forest:
    n_estimators: [100, 200, 300]
    max_depth: [10, 20, 30]
    min_samples_split: [2, 5, 10]

  gradient_boosting:
    n_estimators: [100, 200]
    learning_rate: [0.01, 0.1]
    max_depth: [3, 5, 7]

# Model Persistence
output:
  model_dir: ./models
  model_name: credit_scoring_model
  save_format: joblib # joblib, pickle, onnx
```

### Prediction Service Configuration

Located in `code/credit_risk_models/.env`

```env
# Service Configuration
SERVICE_PORT=8000
SERVICE_HOST=0.0.0.0
SERVICE_WORKERS=4

# Model Configuration
MODEL_PATH=./models/credit_scoring_model.joblib
MODEL_VERSION=1.0.0
ENABLE_MODEL_CACHE=true

# API Security
API_KEY=your-api-key-for-ml-service
ENABLE_API_KEY_AUTH=true

# Monitoring
ENABLE_METRICS=true
ENABLE_LOGGING=true
LOG_LEVEL=INFO
```

---

## Security Configuration

### JWT Token Configuration

Configure token lifetimes based on security requirements:

```env
# Short-lived access tokens (15 minutes - 1 hour)
JWT_EXPIRE=1h

# Long-lived refresh tokens (7-30 days)
REFRESH_TOKEN_EXPIRE=7d

# Remember me tokens (30-90 days)
REMEMBER_ME_EXPIRE=30d
```

### CORS Configuration

Configure allowed origins carefully:

```env
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production
ALLOWED_ORIGINS=https://app.lendsmart.com,https://www.lendsmart.com
```

### Encryption Configuration

Use strong encryption keys:

```bash
# Generate secure random key (32 bytes for AES-256)
openssl rand -base64 32

# Add to .env
ENCRYPTION_KEY=generated_key_here
```

---

## Database Configuration

### MongoDB Configuration

#### Connection String Format

```
mongodb://[username:password@]host[:port][/database][?options]
```

#### Production Connection String

```env
MONGODB_URI=mongodb://lendsmart_user:password@mongodb-primary:27017,mongodb-secondary:27017/lendsmart?replicaSet=rs0&authSource=admin&w=majority
```

#### MongoDB Options

```env
MONGO_MAX_POOL_SIZE=50
MONGO_MIN_POOL_SIZE=10
MONGO_MAX_IDLE_TIME=30000
MONGO_SERVER_SELECTION_TIMEOUT=5000
MONGO_READ_PREFERENCE=primaryPreferred
MONGO_WRITE_CONCERN=majority
```

### Redis Configuration

#### Connection Configuration

```env
# Standard Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# TLS Connection
REDIS_TLS=true
REDIS_TLS_REJECT_UNAUTHORIZED=true

# Cluster Configuration
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
```

---

## External Services

### Stripe Payment Configuration

```env
# Test Keys (use for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Live Keys (use for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Plaid Banking Integration

```env
# Sandbox (development)
PLAID_ENV=sandbox
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret

# Production
PLAID_ENV=production
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_production_secret
```

### Email Service (SendGrid)

```env
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@lendsmart.com
EMAIL_FROM_NAME=LendSmart Platform
```

### SMS Service (Twilio)

```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Configuration Best Practices

### Security

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate secrets regularly** (every 90 days)
4. **Use different keys** for development/staging/production
5. **Enable MFA** for production deployments

### Performance

1. **Tune connection pools** based on load
2. **Enable caching** for frequently accessed data
3. **Configure rate limiting** to prevent abuse
4. **Use CDN** for static assets
5. **Enable compression** for API responses

### Monitoring

1. **Enable structured logging** (`LOG_FORMAT=json`)
2. **Set appropriate log levels** (`info` for production)
3. **Configure error tracking** (Sentry)
4. **Enable metrics collection** (Prometheus)
5. **Set up alerts** for critical errors

---

## Configuration Validation

### Validate Backend Configuration

```bash
cd code/backend
npm run validate-config
```

### Check Required Variables

```bash
# Create validation script
cat > check_env.sh << 'EOF'
#!/bin/bash
required_vars=(
  "JWT_SECRET"
  "MONGODB_URI"
  "ENCRYPTION_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is not set"
    exit 1
  fi
done
echo "All required variables are set"
EOF

chmod +x check_env.sh
./check_env.sh
```

---

## Next Steps

- **Apply Configuration:** Start services with new configuration
- **Test Configuration:** Run integration tests
- **Review Security:** Check [Security Best Practices](TROUBLESHOOTING.md#security)
- **Monitor Logs:** Ensure no configuration errors

---

**Configuration complete!** Proceed to [Usage Guide](USAGE.md) to learn how to use the platform.
