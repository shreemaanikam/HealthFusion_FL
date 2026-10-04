from app.core.database import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
import datetime
from app.core.security import RoleEnum

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    google_sub = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.DOCTOR)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    organization = relationship("Organization", back_populates="users")

class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, index=True)
    version = Column(String)
    model_type = Column(String)
    metrics = Column(JSON)
    training_mode = Column(String)
    status = Column(String)
    artifact_path = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FederatedRound(Base):
    __tablename__ = "federated_rounds"
    id = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer)
    strategy = Column(String)
    num_clients = Column(Integer)
    global_metrics = Column(JSON)
    status = Column(String)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class FederatedClient(Base):
    __tablename__ = "federated_clients"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, unique=True, index=True)
    name = Column(String)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    status = Column(String)
    last_seen = Column(DateTime)

class ClientMetric(Base):
    __tablename__ = "client_metrics"
    id = Column(Integer, primary_key=True, index=True)
    federated_round_id = Column(Integer, ForeignKey("federated_rounds.id"))
    client_id = Column(String, ForeignKey("federated_clients.client_id"))
    metrics = Column(JSON)
    num_examples = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    input_data = Column(JSON)
    prediction = Column(Integer)
    probability = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Explanation(Base):
    __tablename__ = "explanations"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    feature_contributions = Column(JSON)
    top_positive = Column(JSON)
    top_negative = Column(JSON)
    method = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    actor_id = Column(Integer, nullable=True)
    organization_id = Column(Integer, nullable=True)
    event_type = Column(String)
    object_type = Column(String)
    object_id = Column(String)
    status = Column(String)
    metadata_ = Column("metadata", JSON) # Renamed attribute to avoid conflict with Base.metadata

class SystemEvent(Base):
    __tablename__ = "system_events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)
    severity = Column(String)
    message = Column(String)
    metadata_ = Column("metadata", JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
