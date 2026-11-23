-- Migracja 003: domyślna lista systemowych kategorii wydatków (w ustalonej kolejności)
-- Istniejąca kategoria systemowa o tym samym slugu jest aktualizowana (transakcje i limity zostają przy niej),
-- brakujące są dodawane, a pozostałe systemowe kategorie wydatków wyłączane (is_active = false, transakcje zostają).
-- Uruchom po schema.sql (i ewentualnie seed_test_data.sql). Skrypt jest idempotentny.

BEGIN;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order smallint NOT NULL DEFAULT 0;

CREATE TEMP TABLE default_categories (slug varchar(120), name varchar(100), icon varchar(50), sort_order smallint)
    ON COMMIT DROP;
INSERT INTO default_categories VALUES
    ('jedzenie',         'Jedzenie na mieście', 'utensils', 1),
    ('zakupy-spozywcze', 'Zakupy spożywcze',    'cart',     2),
    ('transport',        'Transport',           'car',      3),
    ('rozrywka',         'Rozrywka',            'film',     4),
    ('rachunki',         'Rachunki i opłaty',   'bolt',     5),
    ('mieszkanie',       'Mieszkanie',          'home',     6),
    ('zdrowie',          'Zdrowie',             'heart',    7),
    ('ubrania',          'Ubrania',             'shirt',    8),
    ('edukacja',         'Edukacja',            'book',     9),
    ('podroze',          'Podróże',             'plane',    10),
    ('prezenty',         'Prezenty',            'gift',     11),
    ('inne',             'Inne',                'dots',     12);

-- Aktualizacja istniejących kategorii systemowych (nazwa, kolejność, bez rodzica, aktywne)
UPDATE categories c
SET name = d.name, sort_order = d.sort_order, parent_id = NULL, is_active = true, updated_at = now()
FROM default_categories d
WHERE c.slug = d.slug AND c.is_system AND c.user_id IS NULL AND c.household_id IS NULL;

-- Dodanie brakujących
INSERT INTO categories (name, slug, icon, type, is_system, sort_order)
SELECT d.name, d.slug, d.icon, 'Expense', true, d.sort_order
FROM default_categories d
WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.slug = d.slug AND c.is_system AND c.user_id IS NULL AND c.household_id IS NULL
);

UPDATE categories c
SET is_active = false, updated_at = now()
WHERE c.is_system AND c.type = 'Expense' AND c.user_id IS NULL AND c.household_id IS NULL
  AND c.slug NOT IN (SELECT slug FROM default_categories);

COMMIT;
