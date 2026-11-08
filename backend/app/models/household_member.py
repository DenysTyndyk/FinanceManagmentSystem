from app.database import Base
from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, func

class HouseholdMember(Base):
    __tablename__ = "household_members"
    
    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, ForeignKey("households.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(Enum("Owner", "Member", "Viewer", name="household_role"), nullable=False, server_default="Member")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True))