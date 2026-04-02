# LendSmart - Docker Setup Guide

## Quick Start

### Development Mode

```bash
# Start core services (backend + MongoDB + Redis)
docker-compose up backend mongo redis

# Or start everything at once
docker-compose up
```

### Production Mode

```bash
docker-compose --profile production up -d
```

### With Monitoring (Prometheus + Grafana)

```bash
docker-compose --profile monitoring up -d
```

### With Nginx Reverse Proxy

```bash
docker-compose --profile production --profile nginx up -d
```

## Services

| Service     | Port   | Description                  |
| ----------- | ------ | ---------------------------- |
| backend     | 3000   | Node.js REST API             |
| credit-risk | 8000   | Python ML prediction service |
| mongo       | 27017  | MongoDB database             |
| redis       | 6379   | Redis cache                  |
| nginx       | 80/443 | Reverse proxy (production)   |
| prometheus  | 9090   | Metrics collection           |
| grafana     | 3001   | Monitoring dashboards        |

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## Building Individual Services

```bash
# Backend only
docker build -f Dockerfile --target production -t lendsmart-backend .

# ML Service only
docker build -f credit_risk_models/Dockerfile --target production -t lendsmart-credit-risk ./credit_risk_models
```

## Useful Commands

```bash
# View logs
docker-compose logs -f backend

# Access MongoDB shell
docker exec -it lendsmart-mongo mongosh -u admin -p admin123

# Access Redis CLI
docker exec -it lendsmart-redis redis-cli -a redis123

# Run tests
docker-compose --profile testing up mongo-test redis-test
docker-compose run --rm backend npm test
```
