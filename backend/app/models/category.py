from app.database import Base
from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, func


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    household_id = Column(BigInteger, ForeignKey("households.id"), index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(120), nullable=False)
    icon = Column(String(50))
    color = Column(String(7))
    type = Column(Enum("Expense", "Income", "Transfer", name="category_type"), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), index=True)
    is_system = Column(Boolean, nullable=False, server_default="false")
    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CategoryLimit(Base):
    __tablename__ = "category_limits"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    household_id = Column(BigInteger, ForeignKey("households.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    limit_amount = Column(Integer, nullable=False) # Zgodnie z decimal w schemacie, tu rzutujemy na float/int wg potrzeb
    month_year = Column(String(7), nullable=False)
    threshold_percentage = Column(Integer, nullable=False, server_default="80")
    currency = Column(String(3), nullable=False, server_default="PLN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())