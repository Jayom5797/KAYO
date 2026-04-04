from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import logging

from database import get_db
from models.deployment import Deployment
from schemas.deployment import DeploymentCreate, DeploymentResponse, DeploymentUpdate
from services.auth import get_current_user, get_current_tenant_id
from models.user import User

router = APIRouter(prefix="/api/deployments", tags=["deployments"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=DeploymentResponse, status_code=status.HTTP_201_CREATED)
async def create_deployment(
    deployment_data: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Create a new deployment.
    
    This will trigger the deployment orchestrator to:
    1. Clone Git repository
    2. Build container image
    3. Deploy to Kubernetes
    4. Inject monitoring sidecar
    
    Security: Scoped to current tenant
    Time complexity: O(1) for database operation
    """
    # Get tenant settings for namespace
    from models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    
    k8s_namespace = tenant.settings.get("k8s_namespace")
    if not k8s_namespace:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant namespace not provisioned"
        )
    
    # Create deployment record
    deployment = Deployment(
        tenant_id=tenant_id,
        app_name=deployment_data.app_name,
        git_repo=deployment_data.git_repo,
        git_branch=deployment_data.git_branch,
        k8s_namespace=k8s_namespace,
        env_vars=deployment_data.env_vars,
        status="pending"
    )
    
    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    
    logger.info(f"Created deployment: {deployment.deployment_id} for tenant: {tenant_id}")
    
    # TODO: Trigger deployment orchestrator asynchronously
    # This will be implemented in the deployment-orchestrator service
    
    return deployment


@router.get("/", response_model=List[DeploymentResponse])
async def list_deployments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    List deployments for current tenant.
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(n) where n is number of deployments (limited by pagination)
    """
    deployments = (
        db.query(Deployment)
        .filter(Deployment.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return deployments


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    deployment_id: uuid.UUID,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Get deployment details.
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(1) - indexed lookup
    """
    deployment = (
        db.query(Deployment)
        .filter(
            Deployment.deployment_id == deployment_id,
            Deployment.tenant_id == tenant_id
        )
        .first()
    )
    
    if not deployment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    
    return deployment


@router.patch("/{deployment_id}", response_model=DeploymentResponse)
async def update_deployment(
    deployment_id: uuid.UUID,
    deployment_update: DeploymentUpdate,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Update deployment configuration.
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(1)
    """
    deployment = (
        db.query(Deployment)
        .filter(
            Deployment.deployment_id == deployment_id,
            Deployment.tenant_id == tenant_id
        )
        .first()
    )
    
    if not deployment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    
    # Track old status for webhook
    old_status = deployment.status
    
    # Update fields
    if deployment_update.git_branch is not None:
        deployment.git_branch = deployment_update.git_branch
    if deployment_update.env_vars is not None:
        deployment.env_vars.update(deployment_update.env_vars)
    if deployment_update.status is not None:
        deployment.status = deployment_update.status
    
    db.commit()
    db.refresh(deployment)
    
    logger.info(f"Updated deployment: {deployment_id}")
    
    # Broadcast webhook if status changed
    if deployment_update.status and old_status != deployment.status:
        from services.event_broadcaster import EventBroadcaster
        broadcaster = EventBroadcaster(db)
        
        deployment_data = {
            'name': deployment.app_name,
            'image': deployment.image_tag or 'building',
            'updated_at': deployment.updated_at.isoformat() if deployment.updated_at else None
        }
        
        broadcaster.broadcast_deployment_status_changed_sync(
            tenant_id, deployment_id, deployment_data, old_status, deployment.status
        )
    
    return deployment


@router.delete("/{deployment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deployment(
    deployment_id: uuid.UUID,
    db: Session = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """
    Delete deployment.
    
    Security: Automatically filtered by tenant_id
    Time complexity: O(1) for database, O(n) for K8s resource cleanup
    """
    deployment = (
        db.query(Deployment)
        .filter(
            Deployment.deployment_id == deployment_id,
            Deployment.tenant_id == tenant_id
        )
        .first()
    )
    
    if not deployment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    
    # TODO: Delete Kubernetes resources
    # This will be implemented in the deployment-orchestrator service
    
    db.delete(deployment)
    db.commit()
    
    logger.info(f"Deleted deployment: {deployment_id}")
