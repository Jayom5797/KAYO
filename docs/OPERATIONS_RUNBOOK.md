# KAYO Operations Runbook

## Table of Contents
1. [Deployment Procedures](#deployment-procedures)
2. [Scaling Procedures](#scaling-procedures)
3. [Backup and Restore](#backup-and-restore)
4. [Incident Response](#incident-response)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [On-Call Procedures](#on-call-procedures)

---

## Deployment Procedures

### Initial Deployment

1. **Provision Infrastructure**
```bash
cd infrastructure/terraform/environments/production
terraform init
terraform plan
terraform apply
```

2. **Deploy Monitoring Stack**
```bash
kubectl apply -f infrastructure/kubernetes/base/monitoring-stack.yaml
```

3. **Deploy Services**
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

4. **Run Database Migrations**
```bash
kubectl exec -it <control-plane-pod> -- alembic upgrade head
```

5. **Verify Deployment**
```bash
kubectl get pods -n kayo
kubectl get svc -n kayo
```

### Rolling Updates

```bash
# Update image
kubectl set image deployment/<service-name> <container>=<new-image>

# Monitor rollout
kubectl rollout status deployment/<service-name>

# Rollback if needed
kubectl rollout undo deployment/<service-name>
```

---

## Scaling Procedures

### Horizontal Pod Autoscaling

```bash
# Enable HPA
kubectl autoscale deployment <service-name> --min=3 --max=10 --cpu-percent=70

# Check HPA status
kubectl get hpa
```

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment <service-name> --replicas=5

# Verify
kubectl get deployment <service-name>
```

### Node Scaling

```bash
# Update node group size (EKS)
aws eks update-nodegroup-config \
  --cluster-name kayo-production \
  --nodegroup-name workload-nodes \
  --scaling-config minSize=5,maxSize=20,desiredSize=10
```

---

## Backup and Restore

### PostgreSQL Backup

```bash
# Create backup
kubectl exec -it <postgres-pod> -- pg_dump -U postgres kayo > backup.sql

# Restore
kubectl exec -i <postgres-pod> -- psql -U postgres kayo < backup.sql
```

### Neo4j Backup

```bash
# Create backup
kubectl exec -it <neo4j-pod> -- neo4j-admin backup \
  --backup-dir=/backups \
  --name=graph-$(date +%Y%m%d)

# Restore
kubectl exec -it <neo4j-pod> -- neo4j-admin restore \
  --from=/backups/graph-20260312 \
  --database=neo4j
```

### ClickHouse Backup

```bash
# Create backup
kubectl exec -it <clickhouse-pod> -- clickhouse-backup create

# Restore
kubectl exec -it <clickhouse-pod> -- clickhouse-backup restore <backup-name>
```

### Automated Backups

Backups run daily at 02:00 UTC via CronJob:
```bash
kubectl get cronjob -n kayo
```

---

## Incident Response

### Severity Levels

- **P0 (Critical)**: Complete service outage
- **P1 (High)**: Major functionality impaired
- **P2 (Medium)**: Minor functionality impaired
- **P3 (Low)**: Cosmetic issues

### Response Procedures

#### P0 - Complete Outage

1. **Acknowledge**: Page on-call engineer
2. **Assess**: Check monitoring dashboards
3. **Communicate**: Update status page
4. **Mitigate**: Rollback or hotfix
5. **Resolve**: Verify service restored
6. **Post-mortem**: Document incident

#### P1 - Major Impairment

1. **Acknowledge**: Notify on-call engineer
2. **Investigate**: Review logs and metrics
3. **Fix**: Deploy fix or workaround
4. **Verify**: Test affected functionality
5. **Document**: Update incident log

---

## Troubleshooting

### High Detection Latency

**Symptoms**: Detection latency >5s

**Diagnosis**:
```bash
# Check Kafka consumer lag
kubectl exec -it <kafka-pod> -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group detection-engine

# Check detection engine logs
kubectl logs -f deployment/detection-engine --tail=100

# Check Neo4j query performance
kubectl exec -it <neo4j-pod> -- cypher-shell \
  "CALL dbms.listQueries();"
```

**Resolution**:
- Scale detection engine pods
- Optimize Neo4j queries
- Increase Kafka partitions

### Kafka Consumer Lag

**Symptoms**: Consumer lag >10K messages

**Diagnosis**:
```bash
# Check consumer lag
kubectl exec -it <kafka-pod> -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --all-groups

# Check consumer health
kubectl get pods -l app=graph-engine
kubectl logs -f deployment/graph-engine
```

**Resolution**:
- Scale consumer pods
- Increase consumer parallelism
- Check for slow queries

### Database Connection Issues

**Symptoms**: Connection timeouts, pool exhaustion

**Diagnosis**:
```bash
# Check PostgreSQL connections
kubectl exec -it <postgres-pod> -- psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool metrics
kubectl logs -f deployment/control-plane | grep "pool"
```

**Resolution**:
- Increase connection pool size
- Check for connection leaks
- Restart affected pods

### Build Failures

**Symptoms**: Deployments stuck in pending

**Diagnosis**:
```bash
# Check orchestrator logs
kubectl logs -f deployment/deployment-orchestrator

# Check build pod logs
kubectl logs <build-pod-name>

# Check image pull status
kubectl describe pod <deployment-pod>
```

**Resolution**:
- Check image registry credentials
- Verify build configuration
- Check resource quotas

### API Errors

**Symptoms**: High error rate (>5%)

**Diagnosis**:
```bash
# Check control plane logs
kubectl logs -f deployment/control-plane --tail=100

# Check error metrics
curl http://control-plane:8000/metrics | grep error

# Check database health
kubectl exec -it <postgres-pod> -- pg_isready
```

**Resolution**:
- Check database connectivity
- Review recent deployments
- Check rate limiting

---

## Monitoring and Alerting

### Key Metrics

- **Ingestion Rate**: Events/sec
- **Detection Latency**: p95 latency
- **API Response Time**: p95 response time
- **Error Rate**: Errors/total requests
- **Kafka Lag**: Messages behind

### Grafana Dashboards

- **System Overview**: `infrastructure/grafana/dashboards/system-overview.json`
- **Tenant Metrics**: `infrastructure/grafana/dashboards/tenant-metrics.json`

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Detection Latency | >3s | >5s |
| Kafka Lag | >5K | >10K |
| API Error Rate | >3% | >5% |
| CPU Usage | >70% | >90% |
| Memory Usage | >80% | >95% |

### Alert Channels

- **PagerDuty**: P0, P1 incidents
- **Slack**: All alerts
- **Email**: Daily summaries

---

## On-Call Procedures

### On-Call Schedule

- **Primary**: 24/7 rotation
- **Secondary**: Backup escalation
- **Rotation**: Weekly

### Escalation Path

1. **Primary On-Call**: 5 minutes
2. **Secondary On-Call**: 15 minutes
3. **Engineering Manager**: 30 minutes
4. **CTO**: 1 hour

### On-Call Checklist

**Start of Shift**:
- [ ] Test PagerDuty notifications
- [ ] Review open incidents
- [ ] Check system health dashboards
- [ ] Review recent deployments

**During Shift**:
- [ ] Respond to alerts within SLA
- [ ] Document all incidents
- [ ] Escalate if needed
- [ ] Update status page

**End of Shift**:
- [ ] Hand off open incidents
- [ ] Update runbook if needed
- [ ] Complete incident reports

### Common Commands

```bash
# Check system health
kubectl get pods -n kayo
kubectl top nodes
kubectl top pods -n kayo

# View logs
kubectl logs -f deployment/<service> --tail=100

# Restart service
kubectl rollout restart deployment/<service>

# Scale service
kubectl scale deployment/<service> --replicas=5

# Check metrics
curl http://<service>:8000/metrics
```

### Contact Information

- **Engineering Manager**: [email]
- **DevOps Lead**: [email]
- **Security Team**: [email]
- **PagerDuty**: [phone]

---

## Maintenance Windows

### Scheduled Maintenance

- **Frequency**: Monthly
- **Duration**: 2 hours
- **Time**: Sunday 02:00-04:00 UTC

### Maintenance Checklist

- [ ] Notify customers 7 days in advance
- [ ] Update status page
- [ ] Create database backups
- [ ] Apply security patches
- [ ] Update dependencies
- [ ] Run database maintenance
- [ ] Verify system health
- [ ] Update documentation

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Primary | [name] | [phone] | [email] |
| On-Call Secondary | [name] | [phone] | [email] |
| Engineering Manager | [name] | [phone] | [email] |
| DevOps Lead | [name] | [phone] | [email] |

---

## RTO/RPO Targets

| Component | RTO | RPO |
|-----------|-----|-----|
| Control Plane | 1 hour | 15 minutes |
| Graph Engine | 2 hours | 1 hour |
| Detection Engine | 2 hours | 1 hour |
| PostgreSQL | 1 hour | 15 minutes |
| Neo4j | 2 hours | 1 hour |
| ClickHouse | 4 hours | 1 hour |

---

**Last Updated**: March 12, 2026
**Version**: 1.0
