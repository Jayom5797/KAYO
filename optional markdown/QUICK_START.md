# KAYO Quick Start Guide

Get KAYO running locally in 5 minutes.

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+

## Step 1: Clone and Setup

```bash
git clone https://github.com/your-org/kayo.git
cd kayo
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

This script will:
- Start infrastructure services (PostgreSQL, Redis, Kafka, Neo4j, ClickHouse)
- Install backend dependencies
- Run database migrations
- Install frontend dependencies

## Step 2: Start Backend

```bash
cd services/control-plane
uvicorn main:app --reload
```

Backend will be available at http://localhost:8000

## Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at http://localhost:3000

## Step 4: Create First User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "invitation_token": "initial-setup"
  }'
```

## Step 5: Login

1. Open http://localhost:3000
2. Login with your credentials
3. Explore the dashboard

## What's Next?

- [User Guide](docs/USER_GUIDE.md) - Learn how to use KAYO
- [API Documentation](API_DOCUMENTATION.md) - Integrate with the API
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Deploy to production

## Troubleshooting

**Services not starting?**
```bash
docker-compose ps
docker-compose logs
```

**Database connection error?**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**Port already in use?**
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
```

## Development Workflow

1. Make code changes
2. Backend auto-reloads (uvicorn --reload)
3. Frontend auto-reloads (Next.js dev server)
4. Test changes in browser

## Running Tests

```bash
# Unit tests
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# All tests
./scripts/run-tests.sh
```

## Stopping Services

```bash
# Stop application
Ctrl+C in terminal

# Stop infrastructure
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

**Need Help?** Check [docs/USER_GUIDE.md](docs/USER_GUIDE.md) or [PROJECT_RECORD.md](PROJECT_RECORD.md)
