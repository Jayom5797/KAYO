from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration"""
    
    # Application
    app_name: str = "KAYO Control Plane"
    app_version: str = "0.1.0"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://kayo:kayo_dev_password@localhost:5432/kayo_control_plane"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    
    # ClickHouse
    clickhouse_host: str = "localhost"
    clickhouse_port: int = 9000
    clickhouse_database: str = "kayo_events"
    clickhouse_user: str = "kayo"
    clickhouse_password: str = "kayo_dev_password"
    
    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "kayo_dev_password"
    
    # Security
    secret_key: str = "kayo-dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Kubernetes
    k8s_in_cluster: bool = False
    k8s_namespace_prefix: str = "tenant-"
    
    # Email (SMTP)
    smtp_host: str = "smtp.sendgrid.net"
    smtp_port: int = 587
    smtp_user: str = "apikey"
    smtp_password: str = ""
    from_email: str = "noreply@kayo.io"
    
    # Container Registry
    registry_url: str = "registry.kayo.internal"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
