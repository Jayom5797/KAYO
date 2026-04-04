# KAYO Architecture

## System Overview

KAYO is built as a cloud-native microservices architecture designed for scalability, resilience, and multi-tenancy.

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  Next.js 14 + TypeScript + Tailwind CSS + D3.js            │
│  - Authentication UI                                         │
│  - Dashboard & Monitoring                                    │
│  - Attack Graph Visualization                                │
│  - Deployment Management                                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────▼────────────────────────────────────┐
│                   Control Plane (API Gateway)                │
│  FastAPI + PostgreSQL + Redis                               │
│  - Authentication & Authorization                            │
│  - Multi-tenant Management                                   │
│  - Rate Limiting & Audit Logging                            │
│  - Webhook Management                                        │
└─┬──────────┬──────────┬──────────┬──────────┬──────────────┘
  │          │          │          │          │
  │ Kafka    │ Neo4j    │ K8s API  │ LLM API  │ ClickHouse
  │          │          │          │          │
┌─▼────┐ ┌──▼────┐ ┌───▼────┐ ┌──▼────┐ ┌──▼────────┐
│Graph │ │Detect.│ │Deploy  │ │  AI   │ │Telemetry  │
│Engine│ │Engine │ │Orch.   │ │Explain│ │Ingestion  │
└──────┘ └───────┘ └────────┘ └───────┘ └───────────┘
```

## Core Services

### 1. Control Plane
**Technology**: FastAPI + PostgreSQL + Redis  
**Responsibilities**:
- API gateway for all client requests
- Authentication (JWT) and authorization (RBAC)
- Multi-tenant data isolation
- Rate limiting per tenant tier
- Audit logging for compliance
- Webhook configuration and management
- User and team management

**Key Features**:
- RESTful API with OpenAPI documentation
- JWT token-based authentication
- Role-based access control (admin/member)
- Redis-based rate limiting (sliding window)
- Comprehensive audit trail
- Webhook delivery with retry logic

### 2. Graph Engine
**Technology**: Python + Neo4j  
**Responsibilities**:
- Consume telemetry events from Kafka
- Build behavior graphs in Neo4j
- Track entity relationships
- Provide graph query API
- Generate attack paths

**Key Features**:
- Real-time graph construction
- Entity deduplication
- Relationship tracking
- Cypher query optimization
- Attack path computation

### 3. Detection Engine
**Technology**: Python + Neo4j  
**Responsibilities**:
- Monitor behavior graphs for threats
- Execute detection rules
- Generate security incidents
- Classify by MITRE ATT&CK
- Trigger alerts

**Key Features**:
- Rule-based detection (4 MITRE rules)
- Graph pattern matching
- Anomaly detection
- Incident creation and classification
- Alert broadcasting

### 4. Deployment Orchestrator
**Technology**: Python + Kubernetes API  
**Responsibilities**:
- Manage Kubernetes deployments
- Provision tenant namespaces
- Handle container lifecycle
- Collect logs and metrics
- Monitor deployment health

**Key Features**:
- Kubernetes-native orchestration
- Namespace isolation per tenant
- Resource quota management
- Log aggregation
- Health monitoring

### 5. AI Explainer
**Technology**: Python + LLM API  
**Responsibilities**:
- Generate incident explanations
- Provide remediation guidance
- Analyze attack patterns
- Create human-readable summaries

**Key Features**:
- LLM-powered explanations
- Context-aware analysis
- Remediation recommendations
- Natural language summaries

## Data Stores

### PostgreSQL
**Purpose**: Primary relational database  
**Stores**:
- Users and authentication
- Tenants and subscriptions
- Incidents and deployments
- Webhooks and invitations
- Audit logs

**Schema Design**:
- Multi-tenant with tenant_id foreign keys
- Indexed for query performance
- Alembic migrations for versioning

### Neo4j
**Purpose**: Behavior graph database  
**Stores**:
- Entities (processes, files, network, users)
- Relationships (spawned, accessed, connected)
- Temporal data (timestamps)
- Attack paths

**Graph Model**:
- Nodes: Process, File, Network, User, Container, Host
- Edges: SPAWNED, ACCESSED, CONNECTED, EXECUTED
- Properties: timestamps, metadata

### ClickHouse
**Purpose**: Analytics database  
**Stores**:
- Raw telemetry events
- Time-series metrics
- Aggregated statistics
- Historical data

**Schema Design**:
- Columnar storage for analytics
- Partitioned by date
- Optimized for time-range queries

### Redis
**Purpose**: Cache and rate limiting  
**Stores**:
- Session data
- Rate limit counters
- Cached API responses
- Temporary data

**Data Structures**:
- Sorted sets for sliding window rate limiting
- Strings for caching
- Hashes for session data

### Kafka
**Purpose**: Event streaming  
**Topics**:
- telemetry-events: Raw telemetry data
- incidents: Security incidents
- deployments: Deployment events
- alerts: Alert notifications

**Configuration**:
- 3 partitions per topic
- Replication factor: 3
- Retention: 7 days

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Control Plane validates against PostgreSQL
3. JWT token generated with tenant_id and user_id
4. Token returned to client
5. Client includes token in Authorization header
6. Control Plane validates token on each request
```

### Multi-Tenant Isolation

**Database Level**:
- All tables include tenant_id column
- Queries filtered by tenant_id
- Foreign key constraints enforce isolation

**Kubernetes Level**:
- Each tenant gets dedicated namespace
- Network policies restrict cross-tenant traffic
- Resource quotas prevent resource exhaustion

**Application Level**:
- JWT token includes tenant_id
- All queries scoped to tenant
- Rate limiting per tenant tier

### Rate Limiting

**Algorithm**: Sliding window with Redis sorted sets  
**Tiers**:
- Free: 100 requests/minute
- Pro: 1000 requests/minute
- Enterprise: 10000 requests/minute

**Implementation**:
```python
# Add request timestamp to sorted set
redis.zadd(f"rate_limit:{tenant_id}", {timestamp: timestamp})

# Remove old entries outside window
redis.zremrangebyscore(f"rate_limit:{tenant_id}", 0, now - 60)

# Count requests in window
count = redis.zcard(f"rate_limit:{tenant_id}")

# Check against limit
if count > limit:
    return 429  # Too Many Requests
```

## Scalability

### Horizontal Scaling
- All services are stateless
- Kubernetes HPA for auto-scaling
- Load balancing via Kubernetes Service

### Database Scaling
- PostgreSQL: Read replicas for read-heavy workloads
- Neo4j: Clustering for high availability
- ClickHouse: Distributed tables for large datasets
- Redis: Cluster mode for high throughput

### Message Queue
- Kafka partitioning for parallel processing
- Consumer groups for load distribution
- Backpressure handling

## Observability

### Metrics (Prometheus)
- Request rate, latency, errors (RED metrics)
- Resource utilization (CPU, memory)
- Business metrics (incidents, deployments)
- Custom metrics per service

### Logging (Vector + Loki)
- Structured JSON logging
- Centralized log aggregation
- Log correlation with trace IDs
- Log retention policies

### Tracing (OpenTelemetry)
- Distributed tracing across services
- Request flow visualization
- Performance bottleneck identification
- Error tracking

### Dashboards (Grafana)
- System health overview
- Per-tenant metrics
- Service-specific dashboards
- Alert visualization

## Deployment Architecture

### Development
- Docker Compose for local development
- All services run locally
- Shared databases

### Staging
- Kubernetes cluster (EKS)
- Separate namespace per environment
- Shared infrastructure services
- Blue-green deployments

### Production
- Multi-AZ Kubernetes cluster (EKS)
- Managed databases (RDS, MSK, ElastiCache)
- Auto-scaling enabled
- High availability configuration
- Disaster recovery setup

## Network Architecture

```
Internet
    │
    ▼
┌─────────────┐
│  CloudFront │  CDN (Frontend)
└──────┬──────┘
       │
┌──────▼──────┐
│     ALB     │  Application Load Balancer
└──────┬──────┘
       │
┌──────▼──────────────────────┐
│      EKS Cluster            │
│  ┌────────────────────────┐ │
│  │  Public Subnet         │ │
│  │  - Ingress Controller  │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │  Private Subnet        │ │
│  │  - Application Pods    │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
       │
┌──────▼──────────────────────┐
│  Data Layer (Private)       │
│  - RDS (PostgreSQL)         │
│  - MSK (Kafka)              │
│  - ElastiCache (Redis)      │
│  - EC2 (Neo4j, ClickHouse)  │
└─────────────────────────────┘
```

## Design Decisions

### Why Microservices?
- Independent scaling per service
- Technology flexibility
- Fault isolation
- Team autonomy

### Why Neo4j?
- Native graph database for behavior graphs
- Efficient graph traversal (Cypher)
- Pattern matching for detection
- Attack path computation

### Why Kafka?
- High throughput (100K+ events/sec)
- Durability and replay capability
- Decoupling of producers and consumers
- Scalable partitioning

### Why FastAPI?
- High performance (async/await)
- Automatic OpenAPI documentation
- Type safety with Pydantic
- Modern Python framework

### Why Next.js?
- Server-side rendering for performance
- File-based routing
- Built-in optimization
- TypeScript support

---

**Last Updated**: March 12, 2026
