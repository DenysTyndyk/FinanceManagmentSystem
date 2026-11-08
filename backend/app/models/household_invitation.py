from app.database import Base
from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, String, func

class HouseholdInvitation(Base):
    __tablename__ = "household_invitations"
    
    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, ForeignKey("households.id"), nullable=False)
    email = Column(String(255), nullable=False)
    invited_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    accepted_by = Column(BigInteger, ForeignKey("users.id"))
    token = Column(String(255), nullable=False, unique=True)
    status = Column(Enum("Pending", "Accepted", "Declined", "Expired", name="invitation_status"), nullable=False, server_default="Pending")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())