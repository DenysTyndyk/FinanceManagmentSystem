from app.database import Base
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, func

class RecurringSubscription(Base):
    __tablename__ = "recurring_subscriptions"

    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, ForeignKey("households.id"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, server_default="PLN")
    billing_day = Column(Integer, nullable=False)
    next_billing_date = Column(Date, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())