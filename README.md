# KAYO - Cloud-Native Security Platform

Real-time threat detection and behavior analysis for containerized applications.

## Overview

KAYO is a cloud-native security platform providing real-time threat detection and behavior analysis for containerized applications through interactive attack graphs, MITRE ATT&CK-based detection, and Kubernetes-native deployment management.

**Quick Links**: [Quick Start](QUICK_START.md) | [Documentation](#documentation) | [API Docs](API_DOCUMENTATION.md) | [Contributing](CONTRIBUTING.md)

## Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js 14 + TypeScript
│   (React)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Control Plane  │  FastAPI + PostgreSQL
│     (API)       │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    │         │          │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌──▼──┐  ┌────▼────┐
│ Graph │ │Det. │  │ Deploy  │ │ AI  │  │Telemetry│
│Engine │ │Eng. │  │  Orch.  │ │Expl.│  │Ingestion│
└───┬───┘ └──┬──┘  └────┬────┘ └──┬──┘  └────┬────┘
    │        │          │         │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌──▼──┐  ┌────▼────┐
│ Neo4j │ │Neo4j│  │   K8s   │ │ LLM │  │  Kafka  │
└───────┘ └─────┘  └─────────┘ └─────┘  └─────────┘
```

## Features

### Security
- JWT authentication with role-based access control
- Multi-tenant isolation
- Rate limiting (Redis sliding window)
- Comprehensive audit logging
- Input validation and sanitization
- Secrets management (Kubernetes Secrets)

### Detection
- Rule-based detection (MITRE ATT&CK)
- Behavior graph analysis
- Anomaly detection
- Real-time alerting
- Webhook integration

### Deployment
- Kubernetes-native orchestration
- Container image building
- Resource management
- Log aggregation
- Health monitoring

### Observability
- Prometheus metrics
- Grafana dashboards
- Distributed tracing
- Structured logging
- Alert management

## Quick Start

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

**TL;DR:**
```bash
# Setup (one-time)
./scripts/setup-dev.sh

# Start backend
cd services/control-plane && uvicorn main:app --reload

# Start frontend (new terminal)
cd frontend && npm run dev

# Access at http://localhost:3000
```

### Production Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment procedures.

## Documentation

- [Project Record](PROJECT_RECORD.md) - Complete project overview and status
- [API Documentation](API_DOCUMENTATION.md) - API reference with examples
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment procedures
- [Operations Runbook](docs/OPERATIONS_RUNBOOK.md) - Day-to-day operations
- [User Guide](docs/USER_GUIDE.md) - End-user documentation
- [Development Plan](KAYO_DEVELOPMENT_PLAN.md) - Original architecture and design
- [Pending Tasks](PENDING_TASKS.md) - Remaining work items
- [Final Status](FINAL_IMPLEMENTATION_STATUS.md) - Implementation completion details

## Testing

### Unit Tests
```bash
pytest tests/unit/ -v --cov
```

### Integration Tests
```bash
pytest tests/integration/ -v
```

### Load Tests
```bash
cd tests/load
k6 run telemetry-ingestion.js
k6 run api-performance.js
k6 run detection-latency.js
```

### Security Tests
```bash
cd tests/security
python owasp_tests.py --target http://localhost:8000
```

## Technology Stack

### Backend
- **API**: FastAPI (Python 3.12)
- **Database**: PostgreSQL 16
- **Graph DB**: Neo4j 5.x
- **Analytics**: ClickHouse
- **Cache**: Redis 7.x
- **Message Queue**: Apache Kafka
- **Container Orchestration**: Kubernetes

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Visualization**: D3.js
- **Forms**: React Hook Form + Zod

### Infrastructure
- **IaC**: Terraform
- **Container Runtime**: Docker
- **Orchestration**: Kubernetes (EKS)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Vector + Loki
- **Tracing**: OpenTelemetry

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Ingestion Rate | 100K events/sec | ✅ |
| Detection Latency | <5s p95 | ✅ |
| API Response Time | <200ms p95 | ✅ |
| Uptime | 99.9% | ✅ |

## Security

### Reporting Vulnerabilities
Email security@kayo.io with details. Do not open public issues for security vulnerabilities.

### Security Features
- JWT-based authentication
- RBAC with admin/member roles
- Rate limiting per tenant tier
- Comprehensive audit logging
- Input validation and sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Secrets encryption at rest

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick Start:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with tests
4. Submit Pull Request

## License

Copyright © 2026 KAYO Security. All rights reserved.

This is proprietary software. See [LICENSE](LICENSE) for details.

## Support

- **Documentation**: https://docs.kayo.io
- **Email**: support@kayo.io
- **Status**: https://status.kayo.io
- **Community**: https://community.kayo.io

## Acknowledgments

Built with:
- FastAPI
- Next.js
- Neo4j
- Kubernetes
- And many other amazing open source projects

---

**Version**: 1.0.0  
**Last Updated**: March 12, 2026
