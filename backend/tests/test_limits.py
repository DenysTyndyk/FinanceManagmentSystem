from decimal import Decimal

import pytest
from app.routers.finances import slugify
from app.schemas.finances import CategoryCreate, LimitUpdate
from pydantic import ValidationError


def test_limit_update_validation():
  assert LimitUpdate(limit_amount="500.50", household_id=1).limit_amount == Decimal("500.50")
  # Limit musi być dodatni, mieć najwyżej 2 miejsca po przecinku i mieścić się w decimal(12, 2)
  for bad in ("0", "-10", "10.555", "12345678901.00"):
    with pytest.raises(ValidationError):
      LimitUpdate(limit_amount=bad, household_id=1)


def test_slugify():
  assert slugify("Kawa i słodycze") == "kawa-i-slodycze"
  assert slugify("  Żółć & Łódź!! ") == "zolc-lodz"
  assert slugify("???") == "kategoria"


def test_category_create_validation():
  assert CategoryCreate(name="  Kawa  ", color="#A1b2C3").name == "Kawa"
  for bad in ("", "   ", "x" * 101):
    with pytest.raises(ValidationError):
      CategoryCreate(name=bad, color="#3b6ff5")
  # Kolor tylko w formacie #RRGGBB
  for bad in ("", "red", "#fff", "#12345g", "3b6ff5", "#3b6ff5;"):
    with pytest.raises(ValidationError):
      CategoryCreate(name="Kawa", color=bad)
