import calendar
from datetime import date, timedelta
from typing import Optional
from app.database import get_db
from app.models.category import Category, CategoryLimit
from app.models.transaction import Transaction
from app.models.user import User
from fastapi import APIRouter, Depends, Query, status
from app.schemas.finances import (
    ChartBarItem,
    DailyReportItem,
    DashboardData,
    DayExpenseItem,
    ExpenseCreate,
    GroupSettlement,
    ReportsData,
    TransactionItem,
    CategoryLimitItem,
)
from app.security import get_current_user
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/finances", tags=["Finances"])

POLISH_MONTH_SHORT = [
    "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
    "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"
]
POLISH_WEEKDAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"]


def format_date_label(tx_date: date) -> str:
    """Konwertuje datę transakcji na etykietę (np. 'Dziś', 'Wczoraj' lub '24 Paź 2026')"""
    today = date.today()
    if tx_date == today:
        return "Dziś"
    if (today - tx_date).days == 1:
        return "Wczoraj"
    return tx_date.strftime("%d.%m.%Y")

@router.get("/dashboard", response_model=DashboardData)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    current_year = today.year
    current_month = today.month

    # Pobranie wszystkich transakcji użytkownika z obecnego miesiąca
    monthly_transactions = (
        db.query(Transaction, Category.name.label("category_name"), Category.slug)
        .join(Category, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.deleted_at.is_(None),
            extract('year', Transaction.transaction_date) == current_year,
            extract('month', Transaction.transaction_date) == current_month,
        )
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .all()
    )

    # Agregacja: Przychody i wydatki
    income = sum(float(tx.Transaction.amount) for tx in monthly_transactions if tx.Transaction.type == "Income")
    expenses = sum(float(tx.Transaction.amount) for tx in monthly_transactions if tx.Transaction.type == "Expense")
    balance = income - expenses  # Wydatki tu są sumowane na plusie, bilans to różnica

    # Formatowanie ostatnich 10 transakcji dla frontendu
    transaction_items = []
    for tx, cat_name, cat_slug in monthly_transactions[:10]:
        transaction_items.append(
            TransactionItem(
                id=tx.id,
                title=tx.description or cat_name,
                category=cat_name,
                categoryId=cat_slug,
                when=format_date_label(tx.transaction_date),
                amount=float(tx.amount) if tx.type == "Income" else -float(tx.amount),
                kind="income" if tx.type == "Income" else "expense"
            )
        )

    # Agregacja: Wydatki według kategorii na potrzeby limitów
    # Na razie mockujemy limity, ale mapujemy je na realne wydatki w kategoriach
    category_spending = {}
    for tx, cat_name, cat_slug in monthly_transactions:
        if tx.type == "Expense":
            category_spending[cat_slug] = category_spending.get(cat_slug, 0) + float(tx.amount)

    category_limits = [
        CategoryLimitItem(
            id="jedzenie", 
            label="Jedzenie na mieście", 
            spent=category_spending.get("jedzenie", 0.0), 
            limit=500.0, 
            color="green"
        ),
        CategoryLimitItem(
            id="zakupy", 
            label="Zakupy spożywcze", 
            spent=category_spending.get("zakupy", 0.0), 
            limit=1200.0, 
            color="green"
        ),
        CategoryLimitItem(
            id="transport", 
            label="Transport", 
            spent=category_spending.get("transport", 0.0), 
            limit=300.0, 
            color="blue"
        )
    ]

    # Mock dla rozliczeń grupowych (zgodnie z poprzednim zachowaniem)
    group_summary = GroupSettlement(
        trip_name="Wyjazd do Pragi",
        participants_count=3,
        user_share_percentage=40,
        user_share_amount=1200.00,
        debtor_initials="DF",
        debtor_text="zwraca Tobie",
        debt_amount=150.00,
    )

    return DashboardData(
        balance=balance,
        income=income,
        expenses=expenses,
        trend_percentage=0.0, # Na ten moment brak danych z poprzedniego miesiąca, żeby wyliczyć trend
        transactions=transaction_items,
        category_limits=category_limits,
        group_summary=group_summary
    )

# Zostawiam poprzednią wersje w razie problemów (prawdopodobniej, jeżeli baza jest pusta)
# @router.get("/dashboard", response_model=DashboardData)
# def get_dashboard_data():
#     # Zwraca dane dokładnie odpowiadające stałym z Dashboard.jsx
#     return {
#         "balance": 8450.00,
#         "income": 12200.00,
#         "expenses": -3750.00,
#         "trend_percentage": 12.5,
#         "transactions": [
#             {
#                 "id": 1,
#                 "title": "Biedronka - Zakupy spożywcze",
#                 "category": "Jedzenie",
#                 "when": "Dziś, 14:30",
#                 "amount": -145.50,
#                 "kind": "expense",
#             },
#             {
#                 "id": 2,
#                 "title": "Netflix Subscription",
#                 "category": "Rozrywka",
#                 "when": "Dziś, 09:00",
#                 "amount": -60.00,
#                 "kind": "expense",
#             },
#             {
#                 "id": 3,
#                 "title": "Wynagrodzenie - Październik",
#                 "category": "Przychód",
#                 "when": "Wczoraj, 08:15",
#                 "amount": 8200.00,
#                 "kind": "income",
#             },
#             {
#                 "id": 4,
#                 "title": "Orlen - Paliwo",
#                 "category": "Transport",
#                 "when": "23 Paź 2026",
#                 "amount": -250.00,
#                 "kind": "expense",
#             },
#         ],
#         "group_summary": {
#             "trip_name": "Wyjazd do Pragi",
#             "participants_count": 3,
#             "user_share_percentage": 40,
#             "user_share_amount": 1200.00,
#             "debtor_initials": "DF",
#             "debtor_text": "zwraca Tobie",
#             "debt_amount": 150.00,
#         },
#     }


@router.post("/expenses", status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_tx = Transaction(
        household_id=payload.household_id,
        user_id=current_user.id,
        category_id=payload.category_id,
        amount=payload.amount,
        currency=payload.currency,
        type="Expense",
        base_amount=payload.amount,
        transaction_date=payload.transaction_date,
        description=payload.description
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    
    return {"message": "Wydatek został pomyślnie dodany", "transaction_id": new_tx.id}


@router.get("/reports", response_model=ReportsData)
def get_reports_data(
    month: Optional[str] = Query(None, description="Miesiąc w formacie YYYY-MM (np. 2026-11)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pobiera dane analityczne wydatków: dzienną listę do kalendarza/heatmapy oraz słupki wykresów."""
    today = date.today()
    if month:
        try:
            parts = month.strip().split("-")
            target_year = int(parts[0])
            target_month = int(parts[1])
            if not (1 <= target_month <= 12 and 1900 <= target_year <= 2100):
                target_year, target_month = today.year, today.month
        except (ValueError, IndexError):
            target_year, target_month = today.year, today.month
    else:
        target_year, target_month = today.year, today.month

    month_str = f"{target_year:04d}-{target_month:02d}"
    num_days = calendar.monthrange(target_year, target_month)[1]

    # Pobranie wydatków użytkownika z wybranego miesiąca
    monthly_expenses = (
        db.query(Transaction, Category.name.label("category_name"), Category.slug)
        .join(Category, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.deleted_at.is_(None),
            Transaction.type == "Expense",
            extract("year", Transaction.transaction_date) == target_year,
            extract("month", Transaction.transaction_date) == target_month,
        )
        .order_by(Transaction.transaction_date.asc(), Transaction.created_at.asc())
        .all()
    )

    # Grupowanie wydatków według dnia miesiąca
    daily_map = {d: [] for d in range(1, num_days + 1)}
    for tx, cat_name, cat_slug in monthly_expenses:
        day_num = tx.transaction_date.day
        if 1 <= day_num <= num_days:
            daily_map[day_num].append(
                DayExpenseItem(
                    id=tx.id,
                    title=tx.description or cat_name,
                    amount=float(tx.amount),
                    category=cat_name,
                    category_id=cat_slug,
                )
            )

    daily_expenses: list[DailyReportItem] = []
    total_expenses = 0.0
    max_daily_expense = 0.0

    for d in range(1, num_days + 1):
        day_date = f"{target_year:04d}-{target_month:02d}-{d:02d}"
        txs = daily_map[d]
        day_total = sum(item.amount for item in txs)
        total_expenses += day_total
        if day_total > max_daily_expense:
            max_daily_expense = day_total
        daily_expenses.append(
            DailyReportItem(
                date=day_date,
                day=d,
                total_amount=round(day_total, 2),
                count=len(txs),
                transactions=txs,
            )
        )

    # Budowanie słupków wykresu miesięcznego (wagi 0-100)
    month_name = POLISH_MONTH_SHORT[target_month - 1]
    chart_month_bars: list[ChartBarItem] = []
    for item in daily_expenses:
        weight = int((item.total_amount / max_daily_expense) * 100) if max_daily_expense > 0 else 0
        chart_month_bars.append(
            ChartBarItem(
                day=f"{item.day} {month_name}",
                weight=weight,
                solid=item.day % 2 == 1,
                amount=item.total_amount,
            )
        )

    # Budowanie słupków wykresu tygodniowego
    if target_year == today.year and target_month == today.month:
        ref_date = today
    else:
        ref_date = date(target_year, target_month, min(15, num_days))

    monday = ref_date - timedelta(days=ref_date.weekday())
    chart_week_bars: list[ChartBarItem] = []
    week_max = 0.0
    week_totals = []

    for i in range(7):
        current_day = monday + timedelta(days=i)
        if current_day.year == target_year and current_day.month == target_month:
            day_sum = sum(tx.amount for tx in daily_map.get(current_day.day, []))
        else:
            day_sum = 0.0
        week_totals.append((current_day, day_sum))
        if day_sum > week_max:
            week_max = day_sum

    for i, (current_day, day_sum) in enumerate(week_totals):
        weight = int((day_sum / week_max) * 100) if week_max > 0 else 0
        chart_week_bars.append(
            ChartBarItem(
                day=POLISH_WEEKDAYS[i],
                weight=weight,
                solid=i in (0, 1, 3, 4, 6),
                amount=round(day_sum, 2),
            )
        )

    return ReportsData(
        month=month_str,
        total_expenses=round(total_expenses, 2),
        max_daily_expense=round(max_daily_expense, 2),
        daily_expenses=daily_expenses,
        chart_month_bars=chart_month_bars,
        chart_week_bars=chart_week_bars,
    )
