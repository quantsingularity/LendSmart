# Troubleshooting Guide

**LendSmart Platform Troubleshooting**

Common issues and their solutions.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Runtime Errors](#runtime-errors)
- [Database Issues](#database-issues)
- [Smart Contract Issues](#smart-contract-issues)
- [API Errors](#api-errors)
- [Frontend Issues](#frontend-issues)
- [Performance Issues](#performance-issues)

---

## Installation Issues

### Node.js Version Mismatch

**Problem:** `npm install` fails with version error

**Solution:**

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install correct version
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x
```

### Python Package Installation Fails

**Problem:** `pip install` errors

**Solution:**

```bash
# Create fresh virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install with specific versions
pip install -r requirements.txt
```

### MongoDB Connection Failed

**Problem:** Cannot connect to MongoDB

**Solution:**

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Enable on boot
sudo systemctl enable mongod

# Check connection
mongo --eval "db.runCommand({ ping: 1 })"
```

### Redis Connection Failed

**Problem:** Redis connection errors

**Solution:**

```bash
# Check Redis status
redis-cli ping  # Should return PONG

# Start Redis
sudo systemctl start redis-server

# Check configuration
redis-cli config get bind
redis-cli config get requirepass
```

---

## Runtime Errors

### JWT Token Invalid

**Problem:** `AUTH_TOKEN_INVALID` error

**Solution:**

```bash
# Check JWT_SECRET in .env
cat code/backend/.env | grep JWT_SECRET

# Ensure JWT_SECRET is set and matches
# Re-login to get new token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE :::3001`

**Solution:**

```bash
# Find process using port
lsof -i :3001

# Kill the process
kill -9 $(lsof -t -i:3001)

# Or change port in .env
echo "PORT=3002" >> code/backend/.env
```

### Module Not Found

**Problem:** `Error: Cannot find module 'express'`

**Solution:**

```bash
# Reinstall dependencies
cd code/backend
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if needed
npm cache clean --force
npm install
```

---

## Database Issues

### MongoDB Connection Timeout

**Problem:** `MongoServerSelectionError: connect ETIMEDOUT`

**Solution:**

```bash
# Check MongoDB is running
ps aux | grep mongod

# Check network connectivity
telnet localhost 27017

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/lendsmart

# Increase timeout
MONGO_SERVER_SELECTION_TIMEOUT=10000
```

### Database Migration Failed

**Problem:** Schema changes not applied

**Solution:**

```bash
# Drop and recreate database (development only!)
mongo
> use lendsmart_development
> db.dropDatabase()
> exit

# Run seed script
cd code/backend
npm run seed
```

### Redis Memory Issues

**Problem:** Redis running out of memory

**Solution:**

```bash
# Check Redis memory usage
redis-cli info memory

# Increase maxmemory in redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server

# Clear cache if needed
redis-cli FLUSHDB
```

---

## Smart Contract Issues

### Contract Deployment Failed

**Problem:** `Error: insufficient funds for gas`

**Solution:**

```bash
# Check wallet balance
npx hardhat run scripts/check-balance.js --network goerli

# Get testnet funds
# Goerli: https://goerlifaucet.com/
# Mumbai: https://faucet.polygon.technology/

# Reduce gas limit if needed
# Edit deploy.js
const contract = await Contract.deploy({ gasLimit: 5000000 });
```

### Transaction Reverted

**Problem:** `Error: Transaction reverted without a reason string`

**Solution:**

```bash
# Enable detailed error messages
# In hardhat.config.js
networks: {
  hardhat: {
    loggingEnabled: true
  }
}

# Run with verbose logging
npx hardhat test --verbose

# Check contract state
npx hardhat console --network goerli
> const contract = await ethers.getContractAt("LendSmartLoan", "0x...")
> await contract.paused()  // Check if paused
```

### Contract Verification Failed

**Problem:** Etherscan verification fails

**Solution:**

```bash
# Ensure API key is set
export ETHERSCAN_API_KEY=your_key_here

# Verify with constructor args
npx hardhat verify --network goerli \
  CONTRACT_ADDRESS \
  "arg1" "arg2" "arg3"

# Or create arguments file
cat > arguments.js << EOF
module.exports = [
  "0x...",
  100,
  "0x...",
  "0x..."
];
EOF

npx hardhat verify --network goerli \
  --constructor-args arguments.js \
  CONTRACT_ADDRESS
```

---

## API Errors

### 401 Unauthorized

**Problem:** API returns 401 even with token

**Solution:**

```bash
# Check token format
Authorization: Bearer eyJhbGciOiJIUzI1...

# Verify token hasn't expired
# Decode at jwt.io

# Check user still exists
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Re-authenticate
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### 429 Too Many Requests

**Problem:** Rate limit exceeded

**Solution:**

```bash
# Wait for rate limit window to reset
# Check X-RateLimit-Reset header

# Or increase rate limits in .env (development only)
RATE_LIMIT_MAX_REQUESTS=10000

# Or disable rate limiting (development only)
# In server.js, comment out:
# app.use(rateLimiter);
```

### 500 Internal Server Error

**Problem:** Server crashes or returns 500

**Solution:**

```bash
# Check server logs
tail -f code/backend/logs/error.log

# Common causes:
# 1. Database connection lost
sudo systemctl restart mongod

# 2. Uncaught exception
# Check stack trace in logs

# 3. Configuration error
cat code/backend/.env | grep -E "MONGODB_URI|JWT_SECRET"

# Restart server
pkill -f "node src/server.js"
cd code/backend && npm start
```

---

## Frontend Issues

### Blank White Screen

**Problem:** React app shows blank page

**Solution:**

```bash
# Check browser console for errors (F12)

# Clear browser cache and localStorage
localStorage.clear();
location.reload();

# Rebuild frontend
cd code/web-frontend
rm -rf build node_modules
npm install
npm run build

# Check API connection
# In browser console:
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)
```

### Wallet Connection Failed

**Problem:** MetaMask won't connect

**Solution:**

```javascript
// Check if MetaMask is installed
if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask');
}

// Check network
const chainId = await window.ethereum.request({
    method: 'eth_chainId',
});
console.log('Current chain:', chainId);

// Switch to correct network
if (chainId !== '0x1') {
    // Mainnet
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
    });
}

// Request account access
const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
});
```

### API Calls Failing (CORS)

**Problem:** CORS errors in browser console

**Solution:**

```bash
# Backend .env - Add frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Or allow all origins (development only)
# In server.js:
app.use(cors({
  origin: '*',
  credentials: true
}));

# Restart backend
```

---

## Performance Issues

### Slow API Responses

**Problem:** API endpoints taking >2 seconds

**Solution:**

```bash
# Enable query logging
LOG_LEVEL=debug

# Check database indexes
mongo
> use lendsmart_development
> db.loans.getIndexes()
> db.loans.createIndex({ "status": 1, "createdAt": -1 })

# Enable Redis caching
ENABLE_CACHE=true
CACHE_TTL=300

# Monitor slow queries
# In MongoDB
db.setProfilingLevel(2)
db.system.profile.find().sort({millis:-1}).limit(10)
```

### High Memory Usage

**Problem:** Backend using excessive memory

**Solution:**

```bash
# Check memory usage
ps aux | grep node
top -p $(pgrep -f "node src/server.js")

# Restart application
pkill -f "node src/server.js"
npm start

# Increase Node memory limit
node --max-old-space-size=4096 src/server.js

# Enable garbage collection logging
node --expose-gc --trace-gc src/server.js
```

### Blockchain Transactions Slow

**Problem:** Smart contract calls taking too long

**Solution:**

```javascript
// Increase gas price for faster confirmation
const tx = await contract.fundLoan(loanId, {
    gasPrice: ethers.utils.parseUnits('50', 'gwei'),
});

// Use Flashbots for priority
// https://docs.flashbots.net/

// Or use faster RPC endpoint
// Infura, Alchemy, QuickNode with archive mode
```

---

## Diagnostic Commands

### System Health Check

```bash
# Check all services
./scripts/health-check.sh

# Or manually:
curl http://localhost:3001/health  # Backend
curl http://localhost:3000         # Frontend
mongo --eval "db.runCommand({ ping: 1 })"  # MongoDB
redis-cli ping                     # Redis
```

### Log Collection

```bash
# Collect all logs
mkdir -p /tmp/lendsmart-logs

# Backend logs
cp code/backend/logs/* /tmp/lendsmart-logs/

# MongoDB logs
sudo cp /var/log/mongodb/mongod.log /tmp/lendsmart-logs/

# Redis logs
sudo cp /var/log/redis/redis-server.log /tmp/lendsmart-logs/

# System logs
journalctl -u mongod > /tmp/lendsmart-logs/mongod-journal.log

# Create archive
tar -czf lendsmart-logs-$(date +%Y%m%d).tar.gz /tmp/lendsmart-logs/
```

### Network Diagnostics

```bash
# Check port availability
netstat -tuln | grep -E '3000|3001|27017|6379|8000'

# Test API connectivity
curl -v http://localhost:3001/health

# Test database connectivity
nc -zv localhost 27017  # MongoDB
nc -zv localhost 6379   # Redis

# DNS resolution
nslookup api.lendsmart.com
```

---

## Getting Help

If issues persist:

1. **Check Documentation:** Review relevant docs sections
2. **Search Issues:** https://github.com/abrar2030/LendSmart/issues
3. **Ask Community:** GitHub Discussions
4. **Create Issue:** Include logs, environment details, and steps to reproduce

### Issue Template

```markdown
**Description:**
Brief description of the problem

**Environment:**

- OS: Ubuntu 22.04
- Node.js: v18.16.0
- MongoDB: 5.0.9
- Browser: Chrome 120

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Logs:**
```

paste relevant logs here

```

**Screenshots:**
If applicable
```

---

**Still stuck?** Contact the maintainers or join our community channels.
