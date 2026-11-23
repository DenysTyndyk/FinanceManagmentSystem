from decimal import Decimal

import pytest
from app.schemas.finances import LimitUpdate
from pydantic import ValidationError


def test_limit_update_validation():
  assert LimitUpdate(limit_amount="500.50", household_id=1).limit_amount == Decimal("500.50")
  # Limit musi być dodatni, mieć najwyżej 2 miejsca po przecinku i mieścić się w decimal(12, 2)
  for bad in ("0", "-10", "10.555", "12345678901.00"):
    with pytest.raises(ValidationError):
      LimitUpdate(limit_amount=bad, household_id=1)
