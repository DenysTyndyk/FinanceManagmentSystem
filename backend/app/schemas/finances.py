from typing import List, Literal, Optional
from pydantic import BaseModel
from datetime import date


class ExpenseCreate(BaseModel):
    amount: float
    currency: str = "PLN"
    category_id: int
    transaction_date: date
    description: Optional[str] = None
    household_id: int


class TransactionItem(BaseModel):
    id: int
    title: str
    category: str
    categoryId: str  # Dodane dla frontendu
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


class CategoryLimitItem(BaseModel):
    id: str
    label: str
    spent: float
    limit: float
    color: str


class DashboardData(BaseModel):
    balance: float
    income: float
    expenses: float
    trend_percentage: float
    transactions: List[TransactionItem]
    category_limits: List[CategoryLimitItem] # Nowe pole przekazujące limity z bazy
    group_summary: GroupSettlement