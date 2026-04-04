# KAYO Deployment Guide

Complete guide for deploying KAYO to production.

## Prerequisites

- AWS Account with EKS access
- kubectl configured
- Terraform installed
- Docker installed
- Helm 3 installed

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────────┐
│   CloudFront    │  CDN
└────────┬────────┘
         │
┌────────▼────────┐
│   ALB/Ingress   │  Load Balancer
└────────┬────────┘
         │
┌────────▼────────┐
│   EKS Cluster   │
│                 │
│  ┌───────────┐  │
│  │ Services  │  │  Control Plane, Graph Engine, etc.
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │Monitoring │  │  Prometheus, Grafana
│  └───────────┘  │
└─────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌────┐  ┌─────────┐ ┌────────┐
│  RDS   │ │MSK │  │ElastiC. │ │  EC2   │
│Postgres│ │Kafka│  │  Redis  │ │ Neo4j  │
└────────┘ └────┘  └─────────┘ └────────┘
```

## Step 1: Infrastructure Provisioning

### 1.1 Configure AWS Credentials

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### 1.2 Initialize Terraform

```bash
cd infrastructure/terraform/environments/production
terraform init
```

### 1.3 Review and Apply

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

This provisions:
- EKS cluster with autoscaling node groups
- RDS PostgreSQL (Multi-AZ)
- MSK Kafka cluster
- ElastiCache Redis
- EC2 instances for Neo4j and ClickHouse
- VPC with public/private subnets
- Security groups and IAM roles

**Estimated Time**: 20-30 minutes

### 1.4 Configure kubectl

```bash
aws eks update-kubeconfig --name kayo-production --region us-east-1
kubectl get nodes
```

## Step 2: Database Setup

### 2.1 PostgreSQL Initialization

```bash
# Get RDS endpoint from Terraform output
export DB_HOST=$(terraform output -raw rds_endpoint)

# Run migrations
kubectl run -it --rm migration \
  --image=ghcr.io/your-org/kayo/control-plane:latest \
  --env="DATABASE_URL=postgresql://kayo:password@${DB_HOST}:5432/kayo" \
  -- alembic upgrade head
```

### 2.2 Neo4j Setup

```bash
# SSH to Neo4j instance
ssh -i key.pem ubuntu@<neo4j-ip>

# Initialize database
sudo systemctl start neo4j
sudo neo4j-admin set-initial-password <secure-password>
```

### 2.3 ClickHouse Setup

```bash
# SSH to ClickHouse instance
ssh -i key.pem ubuntu@<clickhouse-ip>

# Run initialization script
clickhouse-client < infrastructure/clickhouse/init.sql
```

## Step 3: Secrets Management

### 3.1 Create Kubernetes Secrets

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=kayo \
  --from-literal=password=<db-password> \
  --from-literal=host=<rds-endpoint>

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=host=<redis-endpoint> \
  --from-literal=port=6379

# Kafka credentials
kubectl create secret generic kafka-credentials \
  --from-literal=bootstrap-servers=<msk-endpoint>

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret-key=$(openssl rand -hex 32)

# Email credentials (SendGrid)
kubectl create secret generic email-credentials \
  --from-literal=smtp-host=smtp.sendgrid.net \
  --from-literal=smtp-port=587 \
  --from-literal=smtp-user=apikey \
  --from-literal=smtp-password=<sendgrid-api-key> \
  --from-literal=from-email=noreply@kayo.io
```

## Step 4: Deploy Monitoring Stack

### 4.1 Install Prometheus Operator

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values infrastructure/kubernetes/monitoring/prometheus-values.yaml
```

### 4.2 Deploy Grafana Dashboards

```bash
kubectl apply -f infrastructure/grafana/dashboards/
```

### 4.3 Configure Alerts

```bash
kubectl apply -f infrastructure/monitoring/prometheus-alerts.yaml
```

## Step 5: Deploy Application Services

### 5.1 Build and Push Docker Images

```bash
# Control Plane
docker build -t ghcr.io/your-org/kayo/control-plane:v1.0.0 services/control-plane
docker push ghcr.io/your-org/kayo/control-plane:v1.0.0

# Graph Engine
docker build -t ghcr.io/your-org/kayo/graph-engine:v1.0.0 services/graph-engine
docker push ghcr.io/your-org/kayo/graph-engine:v1.0.0

# Detection Engine
docker build -t ghcr.io/your-org/kayo/detection-engine:v1.0.0 services/detection-engine
docker push ghcr.io/your-org/kayo/detection-engine:v1.0.0

# Deployment Orchestrator
docker build -t ghcr.io/your-org/kayo/deployment-orchestrator:v1.0.0 services/deployment-orchestrator
docker push ghcr.io/your-org/kayo/deployment-orchestrator:v1.0.0

# AI Explainer
docker build -t ghcr.io/your-org/kayo/ai-explainer:v1.0.0 services/ai-explainer
docker push ghcr.io/your-org/kayo/ai-explainer:v1.0.0
```

### 5.2 Deploy Services

```bash
# Control Plane
kubectl apply -f services/control-plane/k8s/

# Graph Engine
kubectl apply -f services/graph-engine/k8s/

# Detection Engine
kubectl apply -f services/detection-engine/k8s/

# Deployment Orchestrator
kubectl apply -f services/deployment-orchestrator/k8s/

# AI Explainer
kubectl apply -f services/ai-explainer/k8s/
```

### 5.3 Verify Deployments

```bash
kubectl get pods -n kayo
kubectl get svc -n kayo
```

## Step 6: Deploy Frontend

### 6.1 Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 6.2 Deploy to Vercel/Netlify

```bash
# Vercel
vercel --prod

# Or Netlify
netlify deploy --prod
```

### 6.3 Configure Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.kayo.io
```

## Step 7: Configure DNS and SSL

### 7.1 Create DNS Records

```
api.kayo.io     A     <alb-ip>
app.kayo.io     CNAME <vercel-domain>
```

### 7.2 Configure SSL Certificates

```bash
# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Create ClusterIssuer
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuer.yaml
```

## Step 8: Smoke Tests

### 8.1 Health Checks

```bash
curl https://api.kayo.io/health
curl https://api.kayo.io/metrics
```

### 8.2 Authentication Test

```bash
curl -X POST https://api.kayo.io/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@kayo.io&password=<password>"
```

### 8.3 Frontend Test

Open https://app.kayo.io and verify:
- Login page loads
- Authentication works
- Dashboard displays

## Step 9: Load Testing

```bash
cd tests/load
k6 run --vus 100 --duration 5m telemetry-ingestion.js
k6 run --vus 50 --duration 5m api-performance.js
```

## Step 10: Monitoring Setup

### 10.1 Access Grafana

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Open http://localhost:3000 (admin/prom-operator)

### 10.2 Configure Alerts

- PagerDuty integration
- Slack notifications
- Email alerts

## Rollback Procedure

If deployment fails:

```bash
# Rollback Kubernetes deployment
kubectl rollout undo deployment/control-plane -n kayo

# Rollback database migration
kubectl run -it --rm migration \
  --image=ghcr.io/your-org/kayo/control-plane:previous \
  -- alembic downgrade -1
```

## Post-Deployment Checklist

- [ ] All pods running
- [ ] Health checks passing
- [ ] Metrics collecting
- [ ] Alerts configured
- [ ] DNS resolving
- [ ] SSL certificates valid
- [ ] Frontend accessible
- [ ] Authentication working
- [ ] Load tests passing
- [ ] Monitoring dashboards configured
- [ ] Backup jobs scheduled
- [ ] Documentation updated

## Maintenance

### Daily
- Monitor dashboards
- Review alerts
- Check error logs

### Weekly
- Review metrics trends
- Update dependencies
- Security patches

### Monthly
- Disaster recovery drill
- Performance review
- Cost optimization

## Troubleshooting

See [OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) for detailed troubleshooting procedures.

## Support

- Email: ops@kayo.io
- Slack: #kayo-ops
- On-call: PagerDuty

---

**Last Updated**: March 12, 2026
