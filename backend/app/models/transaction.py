from app.database import Base
from sqlalchemy import BigInteger, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, ForeignKey("households.id"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, server_default="PLN")
    type = Column(Enum("Expense", "Income", "Transfer", name="category_type", create_type=False), nullable=False)
    base_amount = Column(Numeric(12, 2), nullable=False)
    base_currency = Column(String(3), nullable=False, server_default="PLN")
    exchange_rate = Column(Numeric(12, 6), nullable=False, server_default="1")
    rate_date = Column(Date)
    transaction_date = Column(Date, nullable=False)
    description = Column(String(255))
    receipt_id = Column(BigInteger, ForeignKey("receipts.id"), index=True)
    recurring_subscription_id = Column(BigInteger, ForeignKey("recurring_subscriptions.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))