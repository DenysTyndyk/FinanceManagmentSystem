-- Finance Management System: dane testowe (6 użytkowników)
-- Uruchamiaj tylko na bazie testowej lub dev, po database/schema.sql.
-- Hashe haseł to wartości zastępcze: tych kont nie da się zalogować prawdziwym hasłem.
--
-- Użytkownicy:
--   1 Anna   (Admin, Active, właścicielka wspólnego domu 7)
--   2 Piotr  (User, Active, członek domu 7)
--   3 Maria  (User, Active, Viewer domu 7)
--   4 Jan    (User, PendingVerification, ma oczekujące zaproszenie)
--   5 Tomasz (Manager, Suspended, konto zawieszone)
--   6 Ewa    (User, Active, zablokowana do przyszłej daty w locked_until)
-- Gospodarstwa 1-6 są osobiste, gospodarstwo 7 jest wspólne (Anna, Piotr, Maria).

BEGIN;

-- Gospodarstwa domowe
INSERT INTO households (id, name, currency, is_personal) VALUES
    (1, 'Personal - Anna',   'PLN', true),
    (2, 'Personal - Piotr',  'PLN', true),
    (3, 'Personal - Maria',  'PLN', true),
    (4, 'Personal - Jan',    'PLN', true),
    (5, 'Personal - Tomasz', 'PLN', true),
    (6, 'Personal - Ewa',    'PLN', true),
    (7, 'Dom Kowalskich',    'PLN', false);

-- Użytkownicy
INSERT INTO users (id, first_name, last_name, email, role, status, password_hash,
                   email_verified_at, failed_login_attempts, locked_until,
                   personal_household_id, email_verification_token, email_verification_expires_at) VALUES
    (1, 'Anna',   'Kowalska',     'anna@test.local',   'Admin',   'Active',              'test-hash-anna',
        '2026-09-01 10:00:00+00', 0, NULL, 1, NULL, NULL),
    (2, 'Piotr',  'Nowak',        'piotr@test.local',  'User',    'Active',              'test-hash-piotr',
        '2026-09-02 10:00:00+00', 0, NULL, 2, NULL, NULL),
    (3, 'Maria',  'Wisniewska',   'maria@test.local',  'User',    'Active',              'test-hash-maria',
        '2026-09-03 10:00:00+00', 0, NULL, 3, NULL, NULL),
    (4, 'Jan',    'Zielinski',    'jan@test.local',    'User',    'PendingVerification', 'test-hash-jan',
        NULL, 0, NULL, 4, 'test-verify-token-jan', '2026-11-30 00:00:00+00'),
    (5, 'Tomasz', 'Lis',          'tomasz@test.local', 'Manager', 'Suspended',           'test-hash-tomasz',
        '2026-08-15 10:00:00+00', 0, NULL, 5, NULL, NULL),
    (6, 'Ewa',    'Dabrowska',    'ewa@test.local',    'User',    'Active',              'test-hash-ewa',
        '2026-09-10 10:00:00+00', 5, '2026-12-31 00:00:00+00', 6, NULL, NULL);

-- Profile użytkowników
INSERT INTO user_profiles (id, user_id, phone_number, date_of_birth, preferred_language, preferred_chart,
                           consent_personal_data, consent_marketing, consent_updated_at) VALUES
    (1, 1, '+48500000001', '1985-04-12', 'pl', 'pie',  true,  true,  '2026-09-01 10:05:00+00'),
    (2, 2, '+48500000002', '1990-07-30', 'en', 'bar',  true,  false, '2026-09-02 10:05:00+00'),
    (3, 3, '+48500000003', '1994-01-18', 'pl', 'pie',  true,  false, '2026-09-03 10:05:00+00'),
    (4, 4, NULL,           NULL,         'pl', 'pie',  false, false, NULL),
    (5, 5, '+48500000005', '1979-11-05', 'pl', 'line', true,  false, '2026-08-15 10:05:00+00'),
    (6, 6, '+48500000006', '1988-06-21', 'pl', 'pie',  true,  true,  '2026-09-10 10:05:00+00');

-- Kategorie: najpierw systemowe (rodzice przed dziećmi)
INSERT INTO categories (id, user_id, household_id, name, slug, icon, color, type, parent_id, is_system, is_active) VALUES
    (1, NULL, NULL, 'Jedzenie',      'jedzenie',      'utensils', '#F59E0B', 'Expense',  NULL, true, true),
    (2, NULL, NULL, 'Transport',     'transport',     'car',      '#3B82F6', 'Expense',  NULL, true, true),
    (3, NULL, NULL, 'Rachunki',      'rachunki',      'bolt',     '#EF4444', 'Expense',  NULL, true, true),
    (4, NULL, NULL, 'Rozrywka',      'rozrywka',      'film',     '#8B5CF6', 'Expense',  NULL, true, true),
    (5, NULL, NULL, 'Wynagrodzenie', 'wynagrodzenie', 'wallet',   '#10B981', 'Income',   NULL, true, true),
    (6, NULL, NULL, 'Przelew',       'przelew',       'exchange', '#6B7280', 'Transfer', NULL, true, true);

INSERT INTO categories (id, user_id, household_id, name, slug, icon, color, type, parent_id, is_system, is_active) VALUES
    (7, NULL, NULL, 'Zakupy spozywcze', 'zakupy-spozywcze', 'cart',   '#F59E0B', 'Expense', 1, true,  true),
    (8, NULL, NULL, 'Paliwo',           'paliwo',           'fuel',   '#3B82F6', 'Expense', 2, true,  true);

-- Kategorie należące do użytkownika i do gospodarstwa
INSERT INTO categories (id, user_id, household_id, name, slug, icon, color, type, parent_id, is_system, is_active) VALUES
    (9,  1,    NULL, 'Hobby',         'hobby',          'palette', '#EC4899', 'Expense', NULL, false, true),
    (10, 2,    NULL, 'Freelance',     'freelance',      'laptop',  '#10B981', 'Income',  NULL, false, true),
    (11, NULL, 7,    'Wspolne wydatki', 'wspolne-wydatki', 'home',   '#6366F1', 'Expense', NULL, false, true);

-- Kursy walut
INSERT INTO exchange_rates (id, currency_code, rate, effective_date) VALUES
    (1, 'USD', 3.951200, '2026-10-01'),
    (2, 'USD', 3.962000, '2026-10-20'),
    (3, 'EUR', 4.281000, '2026-10-01'),
    (4, 'GBP', 5.120000, '2026-10-20');

-- Członkowie gospodarstw
INSERT INTO household_members (id, household_id, user_id, role, joined_at, left_at) VALUES
    (1, 1, 1, 'Owner',  '2026-09-01 10:00:00+00', NULL),
    (2, 2, 2, 'Owner',  '2026-09-02 10:00:00+00', NULL),
    (3, 3, 3, 'Owner',  '2026-09-03 10:00:00+00', NULL),
    (4, 4, 4, 'Owner',  '2026-09-04 10:00:00+00', NULL),
    (5, 5, 5, 'Owner',  '2026-08-15 10:00:00+00', NULL),
    (6, 6, 6, 'Owner',  '2026-09-10 10:00:00+00', NULL),
    (7, 7, 1, 'Owner',  '2026-09-05 10:00:00+00', NULL),
    (8, 7, 2, 'Member', '2026-09-06 10:00:00+00', NULL),
    (9, 7, 3, 'Viewer', '2026-09-20 10:00:00+00', NULL);

-- Zaproszenia do gospodarstw
INSERT INTO household_invitations (id, household_id, email, invited_by, accepted_by, token, status, expires_at) VALUES
    (1, 7, 'jan@test.local',   1, NULL, 'test-invite-pending-001',  'Pending',  '2026-12-31 00:00:00+00'),
    (2, 7, 'ewa@test.local',   2, NULL, 'test-invite-expired-002', 'Expired',  '2026-09-01 00:00:00+00'),
    (3, 7, 'maria@test.local', 1, 3,    'test-invite-accepted-003', 'Accepted', '2026-09-30 00:00:00+00');

-- Subskrypcje cykliczne (przed transactions, które się do nich odwołują)
INSERT INTO recurring_subscriptions (id, household_id, user_id, category_id, title, amount, currency,
                                     billing_day, next_billing_date, is_active) VALUES
    (1, 1, 1, 4, 'Netflix',  43.00, 'PLN', 5,  '2026-11-05', true),
    (2, 7, 1, 3, 'Internet', 69.00, 'PLN', 15, '2026-11-15', true);

-- Paragony (przed transactions, które się do nich odwołują)
INSERT INTO receipts (id, household_id, payer_id, created_by, status, merchant, receipt_date,
                      total_amount, currency, raw_text) VALUES
    (1, 7, 1, 1, 'Processed', 'Biedronka', '2026-10-12', 84.50, 'PLN',
        '{"items": [{"name": "Mleko 3.2%", "amount": 4.29}, {"name": "Chleb", "amount": 6.50}, {"name": "Jablka", "amount": 73.71}]}'::jsonb),
    (2, 7, 2, 2, 'Uploaded',  NULL,        NULL,         NULL,  'PLN', NULL);

-- Transakcje
INSERT INTO transactions (id, household_id, user_id, category_id, amount, currency, type,
                          base_amount, base_currency, exchange_rate, rate_date,
                          transaction_date, description, receipt_id, recurring_subscription_id, deleted_at) VALUES
    (1, 1, 1, 7,  120.40, 'PLN', 'Expense',  120.40, 'PLN', 1,        NULL,         '2026-10-03', 'Zakupy tydzien 40', NULL, NULL, NULL),
    (2, 1, 1, 5, 6500.00, 'PLN', 'Income',  6500.00, 'PLN', 1,        NULL,         '2026-10-01', 'Pensja',            NULL, NULL, NULL),
    (3, 1, 1, 4,  43.00,  'PLN', 'Expense',  43.00,  'PLN', 1,        NULL,         '2026-10-05', 'Netflix',           NULL, 1,    NULL),
    (4, 2, 2, 10, 300.00, 'USD', 'Income',  1188.60, 'PLN', 3.962000, '2026-10-20', '2026-10-20', 'Projekt dla klienta', NULL, NULL, NULL),
    (5, 3, 3, 8, 250.00, 'PLN', 'Expense',  250.00, 'PLN', 1,        NULL,         '2026-10-18', 'Tankowanie',        NULL, NULL, NULL),
    (6, 7, 1, 7,  84.50, 'PLN', 'Expense',   84.50, 'PLN', 1,        NULL,         '2026-10-12', 'Biedronka - zakupy', 1, NULL, NULL),
    (7, 7, 2, 3,  69.00, 'PLN', 'Expense',   69.00, 'PLN', 1,        NULL,         '2026-10-15', 'Internet',          NULL, 2, NULL),
    (8, 7, 1, 11, 400.00, 'PLN', 'Expense',  400.00, 'PLN', 1,        NULL,         '2026-10-10', 'Ikea (usuniete)',   NULL, NULL, '2026-10-20 10:00:00+00'),
    (9, 1, 1, 6, 500.00, 'PLN', 'Transfer', 500.00, 'PLN', 1,        NULL,         '2026-10-02', 'Przelew na oszczednosci', NULL, NULL, NULL);

-- Podziały transakcji (udziały muszą sumować się do kwoty transakcji)
INSERT INTO transaction_splits (id, transaction_id, user_id, percentage, share_amount) VALUES
    (1, 6, 1, 50.00, 42.25),
    (2, 6, 2, 50.00, 42.25),
    (3, 7, 1, 50.00, 34.50),
    (4, 7, 2, 50.00, 34.50);

-- Pozycje paragonów
INSERT INTO receipt_items (id, receipt_id, transaction_id, name, amount, category_id) VALUES
    (1, 1, NULL, 'Mleko 3.2%', 4.29,  7),
    (2, 1, NULL, 'Chleb',      6.50,  7),
    (3, 1, NULL, 'Jablka',    73.71,  7);

-- Rozliczenia
INSERT INTO settlements (id, household_id, payer_id, receiver_id, amount, currency, settled_at) VALUES
    (1, 7, 2, 1, 30.00, 'PLN', '2026-10-22 12:00:00+00');

-- Limity kategorii
INSERT INTO category_limits (id, user_id, household_id, category_id, limit_amount, month_year,
                             threshold_percentage, currency) VALUES
    (1, 1, 7, 7, 800.00,  '2026-10', 80, 'PLN'),
    (2, 2, 2, 1, 1000.00, '2026-10', 90, 'PLN');

-- Przesuwa sekwencje identity za jawnie użyte id, aby nowe wstawienia nie kolidowały
SELECT setval(pg_get_serial_sequence('households', 'id'),              (SELECT MAX(id) FROM households));
SELECT setval(pg_get_serial_sequence('users', 'id'),                   (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('user_profiles', 'id'),           (SELECT MAX(id) FROM user_profiles));
SELECT setval(pg_get_serial_sequence('categories', 'id'),              (SELECT MAX(id) FROM categories));
SELECT setval(pg_get_serial_sequence('category_limits', 'id'),         (SELECT MAX(id) FROM category_limits));
SELECT setval(pg_get_serial_sequence('exchange_rates', 'id'),          (SELECT MAX(id) FROM exchange_rates));
SELECT setval(pg_get_serial_sequence('household_members', 'id'),       (SELECT MAX(id) FROM household_members));
SELECT setval(pg_get_serial_sequence('household_invitations', 'id'),   (SELECT MAX(id) FROM household_invitations));
SELECT setval(pg_get_serial_sequence('recurring_subscriptions', 'id'), (SELECT MAX(id) FROM recurring_subscriptions));
SELECT setval(pg_get_serial_sequence('receipts', 'id'),                (SELECT MAX(id) FROM receipts));
SELECT setval(pg_get_serial_sequence('transactions', 'id'),            (SELECT MAX(id) FROM transactions));
SELECT setval(pg_get_serial_sequence('transaction_splits', 'id'),      (SELECT MAX(id) FROM transaction_splits));
SELECT setval(pg_get_serial_sequence('receipt_items', 'id'),           (SELECT MAX(id) FROM receipt_items));
SELECT setval(pg_get_serial_sequence('settlements', 'id'),             (SELECT MAX(id) FROM settlements));

COMMIT;

-- Aby wyczyścić dane testowe przed ponownym seedowaniem (tylko baza testowa!):
-- TRUNCATE settlements, receipt_items, transaction_splits, transactions, receipts,
--          recurring_subscriptions, category_limits, exchange_rates, household_invitations,
--          household_members, categories, user_profiles, users, households
--          RESTART IDENTITY CASCADE;
