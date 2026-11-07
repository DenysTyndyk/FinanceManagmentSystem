from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class TransactionItem(BaseModel):
    id: int
    title: str
    category: str
    when: str
    amount: float
    kind: Literal["expense", "income"]


class GroupSettlement(BaseModel):
    trip_name: str
    participants_count: int
    user_share_percentage: int
    user_share_amount: float
    debtor_initials: str
    debtor_text: str
    debt_amount: float


class DashboardData(BaseModel):
    balance: float
    income: float
    expenses: float
    trend_percentage: float
    transactions: List[TransactionItem]
    group_summary: GroupSettlement


class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Kwota wydatku musi być większa od zera")
    currency: str = "PLN"
    category_id: int
    transaction_date: date
    description: Optional[str] = None
    household_id: int