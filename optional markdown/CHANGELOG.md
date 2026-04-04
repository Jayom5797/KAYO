# Changelog

All notable changes to KAYO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Real-time WebSocket updates for incidents
- Additional MITRE ATT&CK detection rules
- Advanced ML anomaly detection
- Compliance reporting (SOC 2, GDPR)
- Mobile application

## [1.0.0] - 2026-03-12

### Added

#### Backend Services
- Control Plane API with FastAPI
- Graph Engine with Neo4j integration
- Detection Engine with 4 MITRE ATT&CK rules
- Deployment Orchestrator with Kubernetes integration
- AI Explainer with LLM integration
- Telemetry Ingestion with Kafka

#### Security Features
- JWT authentication with RBAC (admin/member roles)
- Multi-tenant isolation (database + Kubernetes)
- Rate limiting with Redis sliding window (per-tenant tiers)
- Comprehensive audit logging for all write operations
- Neo4j password security with Kubernetes Secrets
- Input validation with Pydantic schemas
- SQL injection prevention with parameterized queries
- XSS prevention with output encoding

#### Core Features
- Incident management (CRUD + status updates)
- Deployment management (CRUD + logs)
- Attack graph visualization with D3.js
- Webhook system with delivery, retry, and HMAC signatures
- Invitation system with email and token validation
- Email service with SMTP and HTML templates
- Event broadcasting with async webhook delivery

#### Frontend
- Next.js 14 dashboard with TypeScript
- Authentication flow (login + protected routes)
- Dashboard overview page
- Incident list and detail pages
- Deployment list and detail pages
- Deployment creation wizard
- Attack graph visualization
- Settings page (team management + webhooks)
- WebSocket client for real-time updates

#### Infrastructure
- EKS Terraform module (production-grade)
- Grafana dashboards (system + tenant metrics)
- Prometheus alerts (detection latency, Kafka lag, errors)
- Vector configuration for log aggregation
- ClickHouse schema for telemetry storage
- Docker Compose for local development
- Kubernetes manifests for all services

#### Testing
- 52 unit tests across 7 test files
- 13 integration tests (incident + deployment workflows)
- Load testing suite with k6 (100K events/sec target)
- Security testing suite (OWASP Top 10)

#### Documentation
- API documentation with examples
- Operations runbook
- User guide
- Deployment guide
- Quick start guide
- Contributing guidelines
- Project record

#### CI/CD
- GitHub Actions CI pipeline (tests + linting)
- GitHub Actions deploy pipeline (build + push + deploy)
- Setup scripts for development environment
- Test runner scripts

### Security
- All passwords hashed with bcrypt
- JWT tokens with expiration
- HTTPS enforcement in production
- Secrets stored in Kubernetes Secrets (not database)
- Rate limiting to prevent abuse
- Audit logging for compliance

### Performance
- Target: 100K events/sec ingestion rate
- Target: <5s p95 detection latency
- Target: <200ms p95 API response time
- Redis caching for frequently accessed data
- Database indexing for query optimization
- Horizontal pod autoscaling

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

---

## Release Notes

### v1.0.0 - Initial Release

KAYO is a production-ready cloud-native security platform providing real-time threat detection, behavior graph analysis, and deployment management for containerized applications.

**Highlights:**
- 5 microservices architecture
- Real-time threat detection with MITRE ATT&CK mapping
- Interactive attack graph visualization
- Multi-tenant SaaS platform
- Production-grade security and scalability
- Comprehensive testing and documentation

**What's Next:**
- Real-time WebSocket updates
- Additional detection rules
- Advanced ML models
- Compliance reporting
- Mobile application

**Known Limitations:**
- Single region deployment only
- Basic anomaly detection
- Limited RBAC (admin/member only)

**Upgrade Notes:**
- N/A (initial release)

---

[Unreleased]: https://github.com/your-org/kayo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/kayo/releases/tag/v1.0.0
