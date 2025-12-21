# LendSmart Backend - Startup Guide

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **MongoDB**: 5.0 or higher (optional for basic testing)
- **Redis**: 6.0 or higher (optional - will use in-memory fallback)
- **npm**: 8.0.0 or higher

## Quick Start

### 1. Install Dependencies

```bash
cd code/backend
npm install
```

### 2. Configure Environment

A working `.env` file has been provided for development. For production, copy `.env.example` and configure:

```bash
cp .env.example .env.production
# Edit .env.production with your production values
```

### 3. Start the Backend

#### Option A: Full Mode (with MongoDB and Redis)

Ensure MongoDB is running on `localhost:27017`:

```bash
# Start MongoDB (if not running)
# mongod --dbpath /path/to/data

# Start the backend
npm start
```

#### Option B: Standalone Mode (without databases for testing)

```bash
# Start without database connections
SKIP_DB_CONNECTION=true npm start
```

#### Option C: Development Mode (with auto-reload)

```bash
npm run dev
```

### 4. Verify Installation

The server will start on `http://localhost:3000` by default.

Test endpoints:

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api

# Root endpoint
curl http://localhost:3000/
```

Expected response from health check:

```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "uptime": 10.5
}
```

## Available Scripts

```bash
npm start              # Start production server
npm run dev           # Start development server with hot reload
npm test              # Run test suite
npm run test:watch    # Run tests in watch mode
npm run lint          # Run ESLint
npm run security:audit # Run npm security audit
```

## API Endpoints

### Public Endpoints

- `GET /` - API information
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints (require authentication)

- `GET /api/auth/me` - Get current user
- `GET /api/users/profile` - Get user profile
- `POST /api/loans/apply` - Apply for a loan
- `GET /api/loans` - Get user's loans

### Admin Endpoints (require admin role)

- `GET /api/admin/users` - List all users
- `GET /api/admin/loans` - List all loans
- `GET /api/admin/analytics` - System analytics

## Database Setup

### MongoDB

```bash
# Create database
mongosh
> use lendsmart_development
> db.createCollection('users')
> db.createCollection('loans')
> db.createCollection('audit_logs')
```

### Redis (optional)

Redis is optional. If not available, the system will use an in-memory fallback for caching.

```bash
# Start Redis (if installed)
redis-server
```

## Environment Variables

### Required for Basic Operation

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/lendsmart_development
```

### Optional Configuration

See `.env.example` for all available configuration options including:

- External service APIs (Stripe, Plaid, etc.)
- Email/SMS configuration
- Blockchain settings
- Security settings

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Error: listen EADDRINUSE: address already in use :::3000

# Solution: Kill the process or use a different port
PORT=3001 npm start
```

#### 2. MongoDB Connection Failed

```bash
# Error: MongoServerError: connect ECONNREFUSED

# Solution: Start MongoDB or use standalone mode
SKIP_DB_CONNECTION=true npm start
```

#### 3. Missing Environment Variables

```bash
# Error: ENCRYPTION_MASTER_KEY must be 64 hex characters

# Solution: The system will auto-generate a key for development
# For production, set proper environment variables
```

#### 4. Module Not Found Errors

```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Testing the API

### Using curl

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Using Postman or similar tools

Import the API endpoints and test with authentication tokens.

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database URLs
3. Set strong secret keys
4. Enable HTTPS
5. Configure CORS for your frontend domain

### Recommended Production Settings

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-server:27017/lendsmart
REDIS_URL=redis://your-redis-server:6379
JWT_SECRET=your-very-strong-secret-minimum-32-characters
ENCRYPTION_MASTER_KEY=your-64-character-hex-key
ALLOWED_ORIGINS=https://yourdomain.com
```

### Security Checklist

- [√] All environment variables are set
- [√] Database connections use authentication
- [√] HTTPS is enabled
- [√] CORS is configured
- [√] Rate limiting is active
- [ ] Regular security audits are scheduled
- [ ] Monitoring and logging are configured
- [ ] Backup procedures are in place

## Monitoring and Logs

Logs are stored in the `logs/` directory:

- `logs/application.log` - General application logs
- `logs/error.log` - Error logs
- `logs/security.log` - Security events
- `logs/audit.log` - Audit trail
- `logs/performance.log` - Performance metrics

### Viewing Logs

```bash
# Tail application logs
tail -f logs/application.log

# View errors
tail -f logs/error.log

# Search security logs
grep "login" logs/security.log
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the main README.md in the project root
3. Check logs for detailed error messages
4. Verify all prerequisites are installed and running

## Architecture Overview

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # MongoDB & Redis setup
│   │   └── security/    # Security utilities
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   ├── compliance/      # Audit & compliance
│   └── server.js        # Main server file
├── tests/               # Test suites
├── logs/                # Log files
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## Next Steps

1. Set up your database
2. Configure external services (optional)
3. Test the API endpoints
4. Review security settings
5. Configure monitoring
6. Set up continuous integration
7. Deploy to production

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**License:** MIT
