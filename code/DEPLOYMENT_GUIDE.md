# LendSmart Enhanced Platform - Deployment Guide

## 🚀 Quick Start Deployment

This guide provides step-by-step instructions for deploying the enhanced LendSmart platform in various environments.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / macOS 10.15+ / Windows 10+
- **Memory**: Minimum 8GB RAM (16GB recommended for production)
- **Storage**: Minimum 50GB free space
- **Network**: Stable internet connection for external service integrations

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher
- **Redis**: v6.0 or higher
- **Python**: v3.8 or higher (for ML models)
- **Git**: Latest version

### Optional (for production)
- **Docker**: v20.10+ and Docker Compose v2.0+
- **Nginx**: v1.18+ (for reverse proxy)
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

## 🛠 Local Development Setup

### 1. Extract and Navigate to Project
```bash
# Extract the provided zip file
unzip lendsmart-enhanced-code.zip
cd code/
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend/

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

#### Backend Environment Configuration (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lendsmart_dev
REDIS_URL=redis://localhost:6379

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# External Services (Optional for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Compliance Configuration
AUDIT_LOG_RETENTION_DAYS=2555
GDPR_DATA_RETENTION_DAYS=1095
```

```bash
# Start the backend server
npm run dev

# The backend will be available at http://localhost:3001
```

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd lendsmart-frontend/

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit the frontend environment file
nano .env
```

#### Frontend Environment Configuration (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_ENABLE_ANALYTICS=false
```

```bash
# Start the frontend development server
npm run dev

# The frontend will be available at http://localhost:5173
```

### 4. Database Setup

#### MongoDB Setup
```bash
# Install MongoDB (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### Redis Setup
```bash
# Install Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 5. ML Models Setup (Optional)

```bash
# Navigate to ML models directory
cd ml_models/

# Install Python dependencies
pip3 install -r requirements.txt

# Train initial models (optional)
python3 src/train_models.py
```

## 🐳 Docker Deployment

### 1. Using Docker Compose (Recommended)

```bash
# Create docker-compose.yml in the root directory
cat > docker-compose.yml << EOF
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: lendsmart-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: lendsmart
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:6.2-alpine
    container_name: lendsmart-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    container_name: lendsmart-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/lendsmart?authSource=admin
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./lendsmart-frontend
    container_name: lendsmart-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:3001/api
    depends_on:
      - backend

volumes:
  mongodb_data:
  redis_data:
EOF

# Create Dockerfile for backend
cat > backend/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
EOF

# Create Dockerfile for frontend
cat > lendsmart-frontend/Dockerfile << EOF
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx configuration for frontend
cat > lendsmart-frontend/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 3000;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files \$uri \$uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:3001;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}
EOF

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name lendsmart-cluster

# Build and push Docker images to ECR
aws ecr create-repository --repository-name lendsmart-backend
aws ecr create-repository --repository-name lendsmart-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t lendsmart-backend ./backend
docker tag lendsmart-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/lendsmart-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/lendsmart-backend:latest

docker build -t lendsmart-frontend ./lendsmart-frontend
docker tag lendsmart-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/lendsmart-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/lendsmart-frontend:latest
```

#### Using AWS Lambda (Serverless)

```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml in backend directory
cat > backend/serverless.yml << EOF
service: lendsmart-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    MONGODB_URI: \${env:MONGODB_URI}
    REDIS_URL: \${env:REDIS_URL}
    JWT_SECRET: \${env:JWT_SECRET}

functions:
  api:
    handler: src/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
EOF

# Create Lambda handler
cat > backend/src/lambda.js << EOF
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
EOF

# Deploy to AWS Lambda
cd backend
serverless deploy
```

### Azure Deployment

#### Using Azure Container Instances

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Create resource group
az group create --name lendsmart-rg --location eastus

# Create container registry
az acr create --resource-group lendsmart-rg --name lendsmartregistry --sku Basic

# Build and push images
az acr build --registry lendsmartregistry --image lendsmart-backend ./backend
az acr build --registry lendsmartregistry --image lendsmart-frontend ./lendsmart-frontend

# Deploy containers
az container create \
  --resource-group lendsmart-rg \
  --name lendsmart-backend \
  --image lendsmartregistry.azurecr.io/lendsmart-backend \
  --ports 3001 \
  --environment-variables NODE_ENV=production

az container create \
  --resource-group lendsmart-rg \
  --name lendsmart-frontend \
  --image lendsmartregistry.azurecr.io/lendsmart-frontend \
  --ports 3000
```

### Google Cloud Platform Deployment

#### Using Google Cloud Run

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT_ID/lendsmart-backend ./backend
gcloud run deploy lendsmart-backend \
  --image gcr.io/PROJECT_ID/lendsmart-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/lendsmart-frontend ./lendsmart-frontend
gcloud run deploy lendsmart-frontend \
  --image gcr.io/PROJECT_ID/lendsmart-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Production Configuration

### Environment Variables for Production

#### Backend Production Environment
```env
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Use production database URLs
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lendsmart?retryWrites=true&w=majority
REDIS_URL=rediss://username:password@redis-host:6380

# Strong production secrets (generate new ones)
JWT_SECRET=your-production-jwt-secret-64-characters-long-random-string
JWT_REFRESH_SECRET=your-production-refresh-secret-64-characters-long
ENCRYPTION_KEY=your-production-encryption-key-32!!

# Production rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Production file upload limits
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# Production external services
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
PLAID_CLIENT_ID=your_production_plaid_client_id
PLAID_SECRET=your_production_plaid_secret_key
PLAID_ENV=production

# Production email configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# Production compliance settings
AUDIT_LOG_RETENTION_DAYS=2555
GDPR_DATA_RETENTION_DAYS=1095
ENABLE_AUDIT_LOGGING=true
```

### SSL/TLS Configuration

#### Using Let's Encrypt with Nginx

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Create Nginx configuration
cat > /etc/nginx/sites-available/lendsmart << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/lendsmart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Using PM2 for Process Management

```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'lendsmart-backend',
      script: './backend/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
EOF

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Log Management

```bash
# Create log rotation configuration
sudo cat > /etc/logrotate.d/lendsmart << EOF
/home/ubuntu/lendsmart/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### Database Monitoring

#### MongoDB Monitoring

```bash
# Enable MongoDB profiling
mongo --eval "db.setProfilingLevel(1, {slowms: 100})"

# Create monitoring script
cat > monitor-mongodb.sh << EOF
#!/bin/bash
echo "MongoDB Status:"
mongo --eval "db.serverStatus()"
echo "Current Operations:"
mongo --eval "db.currentOp()"
echo "Database Stats:"
mongo --eval "db.stats()"
EOF

chmod +x monitor-mongodb.sh
```

#### Redis Monitoring

```bash
# Create Redis monitoring script
cat > monitor-redis.sh << EOF
#!/bin/bash
echo "Redis Info:"
redis-cli info
echo "Redis Memory Usage:"
redis-cli info memory
echo "Redis Stats:"
redis-cli info stats
EOF

chmod +x monitor-redis.sh
```

## 🔒 Security Hardening

### Server Security

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001  # Backend API
sudo ufw deny 27017  # MongoDB (internal only)
sudo ufw deny 6379   # Redis (internal only)

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Application Security

```bash
# Set proper file permissions
chmod 600 backend/.env
chmod 600 lendsmart-frontend/.env
chmod -R 755 backend/src
chmod -R 755 lendsmart-frontend/src

# Create security headers configuration
cat > backend/src/middleware/security.js << EOF
const helmet = require('helmet');

module.exports = (app) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
};
EOF
```

## 🧪 Testing in Production

### Health Checks

```bash
# Create health check endpoints test
cat > health-check.sh << EOF
#!/bin/bash

echo "Testing Backend Health..."
curl -f http://localhost:3001/api/health || echo "Backend health check failed"

echo "Testing Frontend..."
curl -f http://localhost:3000 || echo "Frontend health check failed"

echo "Testing Database Connection..."
mongo --eval "db.adminCommand('ping')" || echo "MongoDB connection failed"

echo "Testing Redis Connection..."
redis-cli ping || echo "Redis connection failed"
EOF

chmod +x health-check.sh
```

### Load Testing

```bash
# Install Apache Bench for load testing
sudo apt install apache2-utils

# Create load test script
cat > load-test.sh << EOF
#!/bin/bash

echo "Load testing backend API..."
ab -n 1000 -c 10 http://localhost:3001/api/health

echo "Load testing frontend..."
ab -n 1000 -c 10 http://localhost:3000/

echo "Load testing authentication endpoint..."
ab -n 100 -c 5 -p auth-data.json -T application/json http://localhost:3001/api/auth/login
EOF

# Create test data
cat > auth-data.json << EOF
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
EOF

chmod +x load-test.sh
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Backend Won't Start
```bash
# Check logs
pm2 logs lendsmart-backend

# Check environment variables
printenv | grep -E "(NODE_ENV|MONGODB_URI|REDIS_URL)"

# Test database connection
mongo $MONGODB_URI --eval "db.adminCommand('ping')"

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

#### Frontend Build Fails
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm audit
```

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --host localhost --port 27017
```

#### Performance Issues
```bash
# Check system resources
htop
df -h
free -m

# Check application metrics
pm2 monit

# Check database performance
mongo --eval "db.serverStatus().opcounters"
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application logs
- Check system resources
- Verify backup completion
- Review security alerts

#### Weekly
- Update system packages
- Review performance metrics
- Check SSL certificate expiry
- Analyze user activity logs

#### Monthly
- Security audit
- Database optimization
- Backup testing
- Performance tuning

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash

DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/lendsmart_\$DATE"

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup MongoDB
mongodump --out \$BACKUP_DIR/mongodb

# Backup Redis
redis-cli --rdb \$BACKUP_DIR/redis_dump.rdb

# Backup application files
tar -czf \$BACKUP_DIR/application.tar.gz /home/ubuntu/lendsmart

# Backup environment files
cp backend/.env \$BACKUP_DIR/backend.env
cp lendsmart-frontend/.env \$BACKUP_DIR/frontend.env

# Upload to cloud storage (optional)
# aws s3 sync \$BACKUP_DIR s3://your-backup-bucket/lendsmart/\$DATE

echo "Backup completed: \$BACKUP_DIR"
EOF

chmod +x backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/lendsmart/backup.sh") | crontab -
```