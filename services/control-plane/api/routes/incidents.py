from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import logging

from database import get_db
from models.incident import Incident
from schemas.incident import IncidentResponse, IncidentUpdate
from services.auth import get_current_tenant_id
from config import settings

router = APIRouter(prefix="/api/incidents", tags=["incidents"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    skip: int = 0,
    limit: int = 100,
    severity: str = None,
    status_filter: str = None,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    List security incidents for current tenant.
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(n) where n is number of incidents (limited by pagination)
    """
    query = db.query(Incident).filter(Incident.tenant_id == tenant_id)
    
    if severity:
        query = query.filter(Incident.severity == severity)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    
    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()
    return incidents


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: uuid.UUID,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Get incident details including attack graph and AI explanation.
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(1) - indexed lookup
    """
    incident = (
        db.query(Incident)
        .filter(
            Incident.incident_id == incident_id,
            Incident.tenant_id == tenant_id
        )
        .first()
    )
    
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: uuid.UUID,
    incident_update: IncidentUpdate,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Update incident status (e.g., mark as resolved).
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(1)
    """
    incident = (
        db.query(Incident)
        .filter(
            Incident.incident_id == incident_id,
            Incident.tenant_id == tenant_id
        )
        .first()
    )
    
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    # Track changes for webhook
    changes = {}
    old_status = incident.status
    
    if incident_update.status is not None:
        changes['status'] = {'old': old_status, 'new': incident_update.status}
        incident.status = incident_update.status
        if incident_update.status == "resolved":
            from datetime import datetime
            incident.resolved_at = datetime.utcnow()
            changes['resolved_at'] = incident.resolved_at.isoformat()
    
    if incident_update.notes is not None:
        incident.notes = incident_update.notes
        changes['notes_updated'] = True
    
    db.commit()
    db.refresh(incident)
    
    logger.info(f"Updated incident: {incident_id} to status: {incident.status}")
    
    # Broadcast webhook event
    from services.event_broadcaster import EventBroadcaster
    broadcaster = EventBroadcaster(db)
    
    incident_data = {
        'title': incident.title,
        'severity': incident.severity,
        'status': incident.status,
        'resolved_at': incident.resolved_at.isoformat() if incident.resolved_at else None
    }
    
    if incident.status == 'resolved':
        broadcaster.broadcast_incident_resolved_sync(tenant_id, incident_id, incident_data)
    else:
        broadcaster.broadcast_incident_updated_sync(tenant_id, incident_id, incident_data, changes)
    
    return incident


@router.get("/{incident_id}/attack-path")
async def get_attack_path(
    incident_id: uuid.UUID,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Reconstruct attack path for incident.
    
    Returns:
        - root_cause: Initial access point entities
        - attack_chain: Step-by-step attack progression
        - timeline: Human-readable event timeline
        - confidence_score: Path reconstruction confidence (0.0-1.0)
        - affected_entities: All entities involved in attack
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(V + E) for graph traversal
    """
    from neo4j import GraphDatabase
    from models.tenant import Tenant
    import sys
    sys.path.append('../../../services/detection-engine')
    from attack_path_reconstructor import AttackPathReconstructor
    
    # Get incident
    incident = (
        db.query(Incident)
        .filter(
            Incident.incident_id == incident_id,
            Incident.tenant_id == tenant_id
        )
        .first()
    )
    
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    # Get tenant Neo4j database
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    
    neo4j_database = tenant.settings.get('neo4j_database')
    if not neo4j_database:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant graph database not provisioned"
        )
    
    # Connect to Neo4j
    from config import settings
    driver = GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_admin_user, settings.neo4j_admin_password)
    )
    
    try:
        # Reconstruct attack path
        reconstructor = AttackPathReconstructor(driver, neo4j_database)
        
        incident_data = {
            'incident_id': str(incident.incident_id),
            'graph_snapshot': incident.graph_snapshot or {}
        }
        
        attack_path = reconstructor.reconstruct_attack_path(incident_data, max_depth=10)
        
        logger.info(
            f"Reconstructed attack path for incident {incident_id}: "
            f"{len(attack_path['attack_chain'])} steps, "
            f"confidence: {attack_path['confidence_score']}"
        )
        
        return attack_path
    
    except Exception as e:
        logger.error(f"Failed to reconstruct attack path: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reconstruct attack path: {str(e)}"
        )
    
    finally:
        driver.close()


@router.post("/{incident_id}/explain")
async def generate_explanation(
    incident_id: uuid.UUID,
    force_regenerate: bool = False,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Generate AI-powered explanation for incident.
    
    Returns:
        - technical_summary: Detailed technical analysis
        - executive_summary: Non-technical business impact summary
        - attack_narrative: Chronological story of the attack
        - remediation: Actionable remediation steps
        - confidence_score: Explanation confidence (0.0-1.0)
    
    Security: Automatically filtered by tenant_id, rate limited
    Time complexity: O(1) cache hit, O(n) cache miss (LLM generation)
    """
    import sys
    sys.path.append('../../../services/ai-explainer')
    from explanation_service import ExplanationService
    
    # Verify incident exists and belongs to tenant
    incident = (
        db.query(Incident)
        .filter(
            Incident.incident_id == incident_id,
            Incident.tenant_id == tenant_id
        )
        .first()
    )
    
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    # Initialize explanation service
    service = ExplanationService()
    
    try:
        await service.initialize()
        
        # Check rate limits
        within_limits = await service.check_rate_limit(str(tenant_id))
        if not within_limits:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Daily token limit exceeded. Please try again tomorrow."
            )
        
        # Generate explanation
        explanation = await service.generate_incident_explanation(
            str(incident_id),
            str(tenant_id),
            force_regenerate=force_regenerate
        )
        
        # Update incident with AI summary
        incident.ai_summary = explanation.get('technical_summary')
        db.commit()
        
        logger.info(f"Generated AI explanation for incident {incident_id}")
        
        return explanation
    
    except Exception as e:
        logger.error(f"Failed to generate explanation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanation: {str(e)}"
        )
    
    finally:
        await service.cleanup()
