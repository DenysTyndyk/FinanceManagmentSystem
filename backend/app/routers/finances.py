import calendar
import re
import unicodedata
from datetime import date, timedelta
from typing import Optional
from app.database import get_db
from app.models.category import Category, CategoryLimit
from app.models.transaction import Transaction
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.finances import (
    CategoryCreate,
    CategoryItem,
    ExpenseListItem,
    ChartBarItem,
    DailyReportItem,
    DashboardData,
    DayExpenseItem,
    ExpenseCreate,
    GroupSettlement,
    LimitUpdate,
    ReportsData,
    TransactionItem,
    CategoryLimitItem,
)
from app.security import get_current_user
from sqlalchemy import extract, func, or_
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

    # Stałe limity użytkownika (obowiązują, dopóki ich nie zmieni); kategorie bez limitu nie wrócą z tego zapytania
    limits = (
        db.query(CategoryLimit, Category.slug, Category.name)
        .join(Category, CategoryLimit.category_id == Category.id)
        # Limit usuniętej (nieaktywnej) kategorii zostaje w bazie, ale nie jest pokazywany
        .filter(CategoryLimit.user_id == current_user.id, Category.is_active.is_(True))
        .all()
    )

    # shortcut: kolor zawsze "green", bo kolumny koloru nie ma w category_limits; przenieść do bazy, gdy będzie potrzebne
    category_limits = [
        CategoryLimitItem(
            id=cat_slug,
            label=cat_name,
            spent=category_spending.get(cat_slug, 0.0),
            limit=float(limit.limit_amount) if limit.limit_amount is not None else None,
            color="green",
        )
        for limit, cat_slug, cat_name in limits
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
    if not visible_expense_categories(db, current_user).filter(Category.id == payload.category_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono kategorii.")
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


def slugify(name: str) -> str:
    """Zamienia nazwę kategorii na slug, np. 'Kawa i słodycze' -> 'kawa-i-slodycze'."""
    # NFKD nie rozkłada litery „ł”, więc zamieniamy ją ręcznie
    text = unicodedata.normalize("NFKD", name.lower().replace("ł", "l"))
    text = text.encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "kategoria"


def visible_expense_categories(db: Session, user: User):
    """Aktywne kategorie wydatków widoczne dla użytkownika: systemowe i jego własne."""
    return db.query(Category).filter(
        Category.type == "Expense",
        Category.is_active.is_(True),
        or_(Category.is_system.is_(True), Category.user_id == user.id),
    )


@router.get("/categories", response_model=list[CategoryItem])
def list_expense_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kategorie wydatków: najpierw domyślne w ustalonej kolejności, potem własne; z liczbą wydatków użytkownika."""
    usage = (
        db.query(Transaction.category_id, func.count(Transaction.id).label("usage_count"))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.deleted_at.is_(None),
            Transaction.type == "Expense",
        )
        .group_by(Transaction.category_id)
        .subquery()
    )
    rows = (
        visible_expense_categories(db, current_user)
        .add_columns(func.coalesce(usage.c.usage_count, 0))
        .outerjoin(usage, usage.c.category_id == Category.id)
        .order_by(Category.is_system.desc(), Category.sort_order, Category.name)
        .all()
    )
    return [
        CategoryItem(
            id=cat.id, slug=cat.slug, name=cat.name, usage_count=count, is_own=not cat.is_system, color=cat.color
        )
        for cat, count in rows
    ]


@router.post("/categories", response_model=CategoryItem, status_code=status.HTTP_201_CREATED)
def create_expense_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tworzy własną kategorię wydatków użytkownika."""
    slug = slugify(payload.name)
    ensure_category_name_free(db, current_user, payload.name, slug)
    category = Category(
        user_id=current_user.id, name=payload.name, slug=slug, color=payload.color.lower(), type="Expense"
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryItem(id=category.id, slug=category.slug, name=category.name, is_own=True, color=category.color)


@router.patch("/categories/{category_id}", response_model=CategoryItem)
def update_expense_category(
    category_id: int,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Zmienia nazwę i kolor własnej kategorii (domyślnych nie można edytować)."""
    category = get_own_category(db, current_user, category_id)
    slug = slugify(payload.name)
    ensure_category_name_free(db, current_user, payload.name, slug, exclude_id=category.id)
    category.name = payload.name
    category.slug = slug
    category.color = payload.color.lower()
    db.commit()
    return CategoryItem(id=category.id, slug=category.slug, name=category.name, is_own=True, color=category.color)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Usuwa własną kategorię z list wyboru; nic nie jest kasowane — wydatki i limit zostają w bazie."""
    category = get_own_category(db, current_user, category_id)
    # Miękkie usunięcie, bo transakcje wskazują na kategorię; slug zwalniamy, żeby można było utworzyć ją ponownie
    category.is_active = False
    category.slug = f"{category.slug}--usunieta-{category.id}"
    db.commit()


def get_own_category(db: Session, user: User, category_id: int) -> Category:
    """Aktywna własna kategoria wydatków użytkownika; domyślnych nie można zmieniać."""
    category = db.get(Category, category_id)
    if category is None or not category.is_active or category.type != "Expense":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono kategorii.")
    if category.is_system:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Kategorii domyślnych nie można zmieniać.")
    if category.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono kategorii.")
    return category


def ensure_category_name_free(db: Session, user: User, name: str, slug: str, exclude_id: Optional[int] = None):
    """409, gdy widoczna kategoria ma już tę nazwę albo slug jest zajęty (indeks categories_user_id_slug_key)."""
    name_query = visible_expense_categories(db, user).filter(func.lower(Category.name) == name.lower())
    slug_query = db.query(Category).filter(Category.user_id == user.id, Category.slug == slug)
    if exclude_id is not None:
        name_query = name_query.filter(Category.id != exclude_id)
        slug_query = slug_query.filter(Category.id != exclude_id)
    if name_query.first() or slug_query.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Taka kategoria już istnieje.")


@router.get("/expenses", response_model=list[ExpenseListItem])
def list_expenses(
    category_id: Optional[int] = Query(None, description="Filtr: id kategorii"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Wydatki użytkownika od najnowszych, opcjonalnie tylko z jednej kategorii."""
    query = (
        db.query(Transaction, Category.name)
        .join(Category, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.deleted_at.is_(None),
            Transaction.type == "Expense",
        )
    )
    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)
    # shortcut: zawsze 100 najnowszych wydatków; dodać stronicowanie ("Pokaż starsze"), gdy lista urośnie
    rows = query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc()).limit(100).all()
    return [
        ExpenseListItem(
            id=tx.id,
            title=tx.description or cat_name,
            category=cat_name,
            category_id=tx.category_id,
            transaction_date=tx.transaction_date,
            amount=float(tx.amount),
        )
        for tx, cat_name in rows
    ]


@router.put("/limits/{category_id}")
def set_category_limit(
    category_id: int,
    payload: LimitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ustawia lub zmienia stały limit użytkownika dla kategorii wydatków."""
    category = db.get(Category, category_id)
    if (
        category is None
        or not category.is_active
        or category.type != "Expense"
        or not (category.is_system or category.user_id == current_user.id)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono kategorii.")

    limit = (
        db.query(CategoryLimit)
        .filter(CategoryLimit.user_id == current_user.id, CategoryLimit.category_id == category_id)
        .first()
    )
    if limit is None:
        limit = CategoryLimit(
            user_id=current_user.id,
            household_id=payload.household_id,
            category_id=category_id,
        )
        db.add(limit)
    limit.limit_amount = payload.limit_amount
    db.commit()

    return {"message": "Limit został zapisany", "limit": float(limit.limit_amount)}


@router.delete("/limits/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_limit(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Usuwa limit użytkownika dla kategorii (brak wpisu = brak limitu)."""
    db.query(CategoryLimit).filter(
        CategoryLimit.user_id == current_user.id,
        CategoryLimit.category_id == category_id,
    ).delete()
    db.commit()


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
