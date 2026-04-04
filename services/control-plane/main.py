from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from config import settings
from database import engine, Base, SessionLocal
from api.routes import tenants_router, auth_router, deployments_router, incidents_router, invitations_router, webhooks_router
from api.middleware.rate_limiter import RateLimitMiddleware
from api.middleware.audit_logger import AuditLogMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(
    RateLimitMiddleware,
    redis_url=settings.redis_url
)

# Audit logging middleware
app.add_middleware(
    AuditLogMiddleware,
    db_session_factory=SessionLocal
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all HTTP requests with timing information.
    
    Performance: Adds minimal overhead (<1ms per request)
    """
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.3f}s with status {response.status_code}"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handle uncaught exceptions gracefully.
    
    Security: Avoids leaking internal error details in production
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.debug:
        detail = str(exc)
    else:
        detail = "Internal server error"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    
    Returns:
        Status and version information
    
    Time complexity: O(1)
    """
    return {
        "status": "healthy",
        "version": settings.app_version,
        "service": "control-plane"
    }


# Include routers
app.include_router(auth_router)
app.include_router(tenants_router)
app.include_router(deployments_router)
app.include_router(incidents_router)
app.include_router(invitations_router)
app.include_router(webhooks_router)


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize application on startup.
    
    Creates database tables if they don't exist.
    """
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("Shutting down application")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )
