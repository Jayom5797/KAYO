from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime
import uuid


class IncidentUpdate(BaseModel):
    """Schema for updating incident status"""
    status: Optional[str] = None


class IncidentResponse(BaseModel):
    """Schema for incident response"""
    incident_id: uuid.UUID
    tenant_id: uuid.UUID
    severity: str
    status: str
    attack_pattern: Optional[str]
    mitre_technique: Optional[str]
    root_event_id: Optional[uuid.UUID]
    event_chain: List[uuid.UUID]
    graph_snapshot: Dict
    ai_summary: Optional[str]
    remediation_steps: List
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    
    class Config:
        from_attributes = True
