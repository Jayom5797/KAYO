# KAYO User Guide

## Getting Started

### What is KAYO?

KAYO is a cloud-native security platform that provides real-time threat detection and behavior analysis for containerized applications. It monitors your deployments, detects security incidents, and helps you investigate attacks through interactive behavior graphs.

### Key Features

- **Real-time Threat Detection**: Detect security incidents as they happen
- **Behavior Graph Analysis**: Visualize attack patterns and relationships
- **Deployment Management**: Deploy and monitor containerized applications
- **Team Collaboration**: Invite team members and manage access
- **Webhook Integration**: Integrate with your existing tools

---

## Account Setup

### Creating Your Account

1. Receive invitation email from your organization admin
2. Click "Accept Invitation" link
3. Create your password (minimum 8 characters)
4. Log in to your dashboard

### First Login

After logging in, you'll see:
- **Dashboard Overview**: System health and recent incidents
- **Incidents**: Security alerts and investigations
- **Deployments**: Your running applications
- **Settings**: Team and configuration management

---

## Managing Deployments

### Creating a Deployment

1. Navigate to **Deployments** → **New Deployment**
2. Fill in deployment details:
   - **Name**: Unique identifier (e.g., `my-app`)
   - **Container Image**: Docker image (e.g., `nginx:latest`)
   - **Replicas**: Number of instances (1-100)
   - **Resources**: CPU and memory limits
   - **Port**: Application port (optional)
   - **Environment Variables**: Configuration (optional)
3. Click **Create Deployment**

### Viewing Deployment Status

Deployment statuses:
- **Pending**: Deployment is being created
- **Building**: Container image is being built
- **Running**: Deployment is active
- **Failed**: Deployment encountered an error
- **Stopped**: Deployment has been stopped

### Deployment Details

Click on any deployment to view:
- **Status**: Current state
- **Replicas**: Running instances
- **Resources**: CPU and memory usage
- **Environment Variables**: Configuration
- **Build Logs**: Container build output
- **Runtime Logs**: Application logs

### Updating a Deployment

1. Go to deployment details
2. Click **Update**
3. Modify configuration
4. Click **Save Changes**

### Deleting a Deployment

1. Go to deployment details
2. Click **Delete**
3. Confirm deletion

---

## Investigating Security Incidents

### Understanding Incidents

Incidents are security alerts triggered by suspicious behavior in your applications. Each incident includes:
- **Severity**: Critical, High, Medium, Low
- **Status**: Open, Investigating, Resolved
- **MITRE ATT&CK**: Tactics and techniques
- **Affected Entities**: Impacted resources
- **Timeline**: Event sequence

### Incident Severity Levels

- **Critical**: Immediate threat requiring urgent action
- **High**: Significant security risk
- **Medium**: Potential security concern
- **Low**: Minor anomaly or informational

### Viewing Incidents

1. Navigate to **Incidents**
2. Filter by severity or status
3. Click on incident to view details

### Incident Investigation

#### Overview Tab
- Incident summary
- Severity and status
- Detection time
- MITRE ATT&CK mapping
- Affected entities

#### Attack Graph Tab
- Visual representation of attack progression
- Entity relationships
- Attack timeline
- Root cause analysis

#### Notes Tab
- Investigation notes
- Team collaboration
- Action items

### Using the Attack Graph

The attack graph visualizes how an attack progressed through your system:

**Node Types**:
- **Process** (Blue): Running processes
- **File** (Green): File system access
- **Network** (Orange): Network connections
- **User** (Purple): User accounts
- **Container** (Cyan): Container instances
- **Host** (Red): Host systems

**Interactions**:
- **Click**: View node details
- **Drag**: Reposition nodes
- **Zoom**: Mouse wheel or pinch
- **Pan**: Click and drag background

### Updating Incident Status

1. Open incident details
2. Click **Update Status**
3. Select new status:
   - **Open**: Newly detected
   - **Investigating**: Under review
   - **Resolved**: Mitigated
4. Add notes (optional)
5. Click **Save**

### Adding Investigation Notes

1. Open incident details
2. Go to **Notes** tab
3. Click **Add Note**
4. Enter your findings
5. Click **Save**

---

## Team Management

### Inviting Team Members

1. Navigate to **Settings** → **Team**
2. Click **Invite Member**
3. Enter email address
4. Select role:
   - **Admin**: Full access
   - **Member**: View and investigate
5. Click **Send Invitation**

### Managing Invitations

View pending invitations:
- **Pending**: Not yet accepted
- **Accepted**: User has joined
- **Expired**: Invitation expired (7 days)

Actions:
- **Resend**: Send invitation again
- **Revoke**: Cancel invitation

### User Roles

**Admin**:
- Manage deployments
- Investigate incidents
- Invite team members
- Configure webhooks
- View billing

**Member**:
- View deployments
- Investigate incidents
- Add investigation notes

---

## Webhook Integration

### What are Webhooks?

Webhooks send real-time notifications to external services when events occur in KAYO.

### Supported Events

- `incident.created`: New incident detected
- `incident.updated`: Incident status changed
- `incident.resolved`: Incident resolved
- `deployment.created`: New deployment created
- `deployment.failed`: Deployment failed
- `deployment.succeeded`: Deployment running
- `alert.triggered`: Alert threshold exceeded

### Creating a Webhook

1. Navigate to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Enter webhook URL
4. Select event types
5. Click **Create**

### Webhook Payload

```json
{
  "event_type": "incident.created",
  "timestamp": "2026-03-12T10:30:00Z",
  "data": {
    "incident_id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Suspicious Process Execution",
    "severity": "high",
    "status": "open"
  }
}
```

### Webhook Security

All webhooks include HMAC-SHA256 signature in `X-Webhook-Signature` header:

```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

### Webhook Retry Logic

Failed deliveries are retried:
- **Retry 1**: After 1 second
- **Retry 2**: After 5 seconds
- **Retry 3**: After 15 seconds

After 3 failures, webhook is marked as failed.

---

## Best Practices

### Security

- Use strong passwords (12+ characters)
- Enable 2FA when available
- Review incidents daily
- Investigate high/critical incidents immediately
- Document investigation findings

### Deployment

- Use specific image tags (not `latest`)
- Set resource limits
- Use environment variables for configuration
- Monitor deployment logs
- Test in staging before production

### Incident Response

1. **Acknowledge**: Review incident immediately
2. **Assess**: Determine severity and scope
3. **Contain**: Isolate affected resources
4. **Investigate**: Use attack graph to understand attack
5. **Remediate**: Fix vulnerability
6. **Document**: Record findings and actions

### Team Collaboration

- Add investigation notes
- Tag team members
- Update incident status
- Share findings
- Conduct post-incident reviews

---

## Troubleshooting

### Cannot Log In

- Verify email and password
- Check invitation status
- Contact your admin
- Reset password if needed

### Deployment Stuck in Pending

- Check build logs
- Verify image exists
- Check resource quotas
- Contact support

### Missing Incidents

- Check severity filter
- Verify date range
- Check tenant selection
- Refresh page

### Webhook Not Receiving Events

- Verify webhook URL is accessible
- Check event type selection
- Review delivery logs
- Test webhook endpoint

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `g d` | Go to Dashboard |
| `g i` | Go to Incidents |
| `g p` | Go to Deployments |
| `g s` | Go to Settings |
| `/` | Search |
| `?` | Show shortcuts |

---

## Support

### Getting Help

- **Documentation**: docs.kayo.io
- **Email**: support@kayo.io
- **Status**: status.kayo.io
- **Community**: community.kayo.io

### Reporting Issues

When reporting issues, include:
- Description of problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser and version

---

## Glossary

**Attack Graph**: Visual representation of attack progression

**Deployment**: Containerized application running on KAYO

**Entity**: Resource in your system (process, file, network, etc.)

**Incident**: Security alert triggered by suspicious behavior

**MITRE ATT&CK**: Framework for categorizing attack techniques

**Severity**: Importance level of security incident

**Webhook**: HTTP callback for real-time event notifications

---

**Last Updated**: March 12, 2026  
**Version**: 1.0
