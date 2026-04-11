# LendSmart

An enterprise-grade peer-to-peer lending platform combining a Node.js REST API, Python ML credit-risk services, and Ethereum smart contracts.

## Repository Structure

```
LendSmart/
├── backend/            # Node.js / Express REST API
├── blockchain/         # Solidity smart contracts (Hardhat + Truffle)
├── ml_services/        # Python ML models & compliance framework
├── docker-compose.yml  # Full-stack orchestration
├── Dockerfile          # Backend production image
├── .env.example        # Environment variable reference
└── requirements.txt    # Root-level Python dev dependencies
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18, npm ≥ 9
- Python ≥ 3.11, pip
- Docker & Docker Compose (for containerised setup)
- MongoDB 7 & Redis 7 (or use Docker)

### 1 – Clone & configure

```bash
git clone https://github.com/your-org/lendsmart.git
cd lendsmart
cp .env.example .env          # Fill in secrets
cp backend/.env.example backend/.env
```

### 2 – Docker Compose (recommended)

```bash
docker compose up --build
```

Services started:

| Service     | URL                   | Description              |
| ----------- | --------------------- | ------------------------ |
| Backend API | http://localhost:3000 | Node.js REST API         |
| ML Service  | http://localhost:8000 | Python credit-risk model |
| MongoDB     | localhost:27017       | Primary database         |
| Redis       | localhost:6379        | Cache / sessions         |

### 3 – Manual setup

**Backend**

```bash
cd backend
npm install
npm run dev        # Development (nodemon + debug port 9229)
npm start          # Production
npm test           # Jest test suite
```

**ML Services**

```bash
pip install -r ml_services/requirements.txt
# Train the model (first time)
python -m ml_services.credit_risk.train_model
# Start the prediction server
python -m ml_services.credit_risk.prediction_service --server --port 8000
```

**Blockchain**

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
npx hardhat node                              # Local chain
npx hardhat run scripts/deploy.js --network localhost
```

---

## Directory Details

### `backend/`

Node.js + Express REST API with MongoDB, Redis, JWT auth, rate limiting, audit logging and GDPR compliance.

```
backend/src/
├── controllers/    authController, loanController, userController, adminController
├── models/         User.js, Loan.js  (Mongoose schemas)
├── routes/         authRoutes, loanRoutes, userRoutes, adminRoutes
├── services/
│   ├── ai/                 aiService.js       – calls ML prediction endpoints
│   ├── blockchain/         blockchainService.js – ethers.js multi-network client
│   ├── compliance/         complianceService.js
│   └── notification/       notificationService.js
├── middleware/
│   ├── auth.js             JWT protect / authorize helpers
│   ├── monitoring/         errorHandler, healthCheck, metricsCollector
│   ├── security/           authMiddleware, rateLimiter, securityMiddleware
│   └── validation/         inputValidator (Joi schemas)
├── compliance/     auditLogger.js, gdprCompliance.js
├── config/         database.js, redis.js, blockchain.js, encryption.js
├── security/       authService.js
├── gateway/        apiGateway.js
└── utils/          logger.js, complianceMonitor.js
```

Key environment variables → see `backend/.env.example`.

### `blockchain/`

Smart contracts for on-chain loan lifecycle management.

- **`contracts/`** – Hardhat contracts (`LendSmartLoan.sol`, `LoanContract.sol`, `Lock.sol`, `MockERC20.sol`)
- **`truffle/`** – Legacy Truffle contracts (`LoanManager.sol`, `BorrowerContract.sol`)
- **`test/`** – Hardhat Mocha/Chai test suite
- **`scripts/`** – Deployment scripts

See [`blockchain/README.md`](blockchain/README.md) for full toolchain instructions.

### `ml_services/`

Python ML pipeline for credit scoring, risk assessment, alternative data scoring, and regulatory compliance.

- **`credit_risk/`** – Ensemble ML models (sklearn, XGBoost, LightGBM, SHAP), Flask prediction API
- **`compliance/`** – Fair-lending, AML, GDPR, adverse-action notice generation
- **`integration/`** – `LendingSystem` orchestrator combining all ML and compliance components

See [`ml_services/README.md`](ml_services/README.md) for full service documentation.

---

## API Reference (Backend)

| Method | Endpoint               | Auth      | Description              |
| ------ | ---------------------- | --------- | ------------------------ |
| POST   | `/api/auth/register`   | –         | Register new user        |
| POST   | `/api/auth/login`      | –         | Login, returns JWT       |
| POST   | `/api/auth/logout`     | JWT       | Invalidate token         |
| GET    | `/api/users/me`        | JWT       | Get current user profile |
| PUT    | `/api/users/me`        | JWT       | Update profile           |
| POST   | `/api/loans`           | JWT       | Apply for a loan         |
| GET    | `/api/loans`           | JWT       | List user loans          |
| GET    | `/api/loans/:id`       | JWT       | Get loan detail          |
| POST   | `/api/loans/:id/repay` | JWT       | Make a repayment         |
| GET    | `/api/admin/loans`     | JWT+Admin | All loans (admin)        |
| GET    | `/health`              | –         | Health check             |
| GET    | `/metrics`             | –         | Prometheus metrics       |

## ML Service API

| Method | Endpoint         | Description                    |
| ------ | ---------------- | ------------------------------ |
| GET    | `/health`        | Model health + load status     |
| POST   | `/predict`       | Single applicant prediction    |
| POST   | `/predict/batch` | Batch predictions (JSON array) |

---

## Testing

```bash
# Backend
cd backend && npm test

# ML Services
pytest ml_services/credit_risk/tests/ -v

# Smart Contracts
cd blockchain && npx hardhat test
```

---

## License

MIT
