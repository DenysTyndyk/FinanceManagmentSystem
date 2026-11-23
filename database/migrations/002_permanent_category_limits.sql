-- Migracja 002: limity kategorii są stałe (bez podziału na miesiące) i należą do użytkownika
-- Użytkownik sam zmienia lub usuwa limit; jeden limit na parę (użytkownik, kategoria).
-- Uruchom na istniejącej bazie utworzonej z database/schema.sql. Skrypt jest idempotentny.

BEGIN;

-- Zostaw tylko najnowszy wpis dla każdej pary (użytkownik, kategoria), żeby założyć unikalność
DELETE FROM category_limits a
USING category_limits b
WHERE a.user_id = b.user_id
  AND a.category_id = b.category_id
  AND a.id < b.id;

-- Usunięcie kolumny usuwa też stare ograniczenie UNIQUE (household_id, category_id, month_year)
ALTER TABLE category_limits DROP COLUMN IF EXISTS month_year;

CREATE UNIQUE INDEX IF NOT EXISTS category_limits_user_id_category_id_key
    ON category_limits (user_id, category_id);

COMMIT;
