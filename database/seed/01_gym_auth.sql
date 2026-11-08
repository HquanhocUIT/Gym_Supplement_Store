-- ============================================================
-- database/seed/01_gym_auth.sql
-- Sample data Auth & Gym (Task 14) - run in Supabase SQL Editor
-- Run AFTER database/schema/01_auth_gym.sql
-- Idempotent: safe to re-run, no duplicate data
-- ============================================================

-- 1. Demo accounts admin / staff / member (bcrypt hashed passwords, cost 10)
--    Common demo passwords: Admin@123456 / Staff@123456 / Member@123456
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@gym.local',  '$2b$10$8K5eVz3uHehosolsN7TJ4.XCX5J9mnpHddDuCOQaHWoErkComnKwu', 'System Administrator', 'admin'),
  ('staff@gym.local',  '$2b$10$mvfie/lnpeV3eLueUTz80ejX3p362UBPrwpIq8iPF/41iygYYPQwy', 'Gym Staff Member', 'staff'),
  ('member@gym.local', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Demo Member', 'member'),
  ('alice.nguyen@gmail.com', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Alice Nguyen', 'member'),
  ('bob.tran@gmail.com',  '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Bob Tran', 'member'),
  ('carol.le@gmail.com',   '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Carol Le', 'member'),
  ('david.pham@gmail.com', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'David Pham', 'member'),
  ('eva.hoang@gmail.com','$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Eva Hoang', 'member'),
  ('frank.vu@gmail.com',   '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Frank Vu', 'member'),
  ('grace.dang@gmail.com', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Grace Dang', 'member'),
  ('henry.bui@gmail.com',  '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Henry Bui', 'member'),
  ('ivan.ngo@gmail.com',  '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Ivan Ngo', 'member')
ON CONFLICT (email) DO NOTHING;

-- 2. 4 membership packages (idempotent by package name)
INSERT INTO membership_plans (name, duration_days, price, status) VALUES
  ('1 Month Pass', 30,  250000, 'active'),
  ('3 Month Pass', 90,  690000, 'active'),
  ('6 Month Pass', 180, 1290000, 'active'),
  ('1 Year Pass',   365, 2390000, 'active')
ON CONFLICT (name) DO NOTHING;

-- 3. Members using packages (~10 members)
--    Delete existing rows for these emails first so re-run is safe
DELETE FROM memberships
WHERE user_id IN (SELECT id FROM users WHERE email IN (
  'admin@gym.local', 'staff@gym.local', 'member@gym.local',
  'alice.nguyen@gmail.com', 'bob.tran@gmail.com', 'carol.le@gmail.com',
  'david.pham@gmail.com', 'eva.hoang@gmail.com', 'frank.vu@gmail.com',
  'grace.dang@gmail.com', 'henry.bui@gmail.com', 'ivan.ngo@gmail.com'
));

INSERT INTO memberships (user_id, plan_id, start_date, end_date, status)
SELECT u.id, p.id, m.start_date, m.end_date, m.status
FROM (VALUES
  ('member@gym.local',        '1 Month Pass',  '2026-11-01', '2026-11-30', 'active'),
  ('alice.nguyen@gmail.com',  '3 Month Pass',  '2026-10-15', '2027-01-15', 'active'),
  ('bob.tran@gmail.com',    '6 Month Pass',  '2026-09-01', '2027-03-01', 'active'),
  ('carol.le@gmail.com',      '1 Year Pass',    '2026-06-01', '2027-06-01', 'active'),
  ('david.pham@gmail.com',    '1 Month Pass',  '2026-09-01', '2026-09-30', 'expired'),
  ('eva.hoang@gmail.com',   '3 Month Pass',  '2026-10-01', '2026-12-31', 'active'),
  ('frank.vu@gmail.com',      '1 Month Pass',  '2026-08-01', '2026-08-31', 'cancelled'),
  ('grace.dang@gmail.com',    '6 Month Pass',  '2026-08-15', '2027-02-15', 'active'),
  ('henry.bui@gmail.com',     '1 Year Pass',    '2026-05-01', '2027-05-01', 'active'),
  ('ivan.ngo@gmail.com',     '1 Month Pass',  '2026-09-10', '2026-10-10', 'expired')
) AS m(email, plan_name, start_date, end_date, status)
JOIN users u ON u.email = m.email
JOIN membership_plans p ON p.name = m.plan_name;

-- 4. Check-in history (gym entry history)
DELETE FROM checkins
WHERE user_id IN (SELECT id FROM users WHERE email IN (
  'member@gym.local', 'alice.nguyen@gmail.com', 'bob.tran@gmail.com',
  'carol.le@gmail.com', 'eva.hoang@gmail.com', 'grace.dang@gmail.com'
));

INSERT INTO checkins (user_id, checkin_time)
SELECT u.id, c.checkin_time
FROM (VALUES
  ('member@gym.local',        '2026-11-01 06:30:00+07'),
  ('member@gym.local',        '2026-11-03 07:00:00+07'),
  ('member@gym.local',        '2026-11-05 18:00:00+07'),
  ('alice.nguyen@gmail.com',  '2026-10-20 17:30:00+07'),
  ('alice.nguyen@gmail.com',  '2026-10-22 06:15:00+07'),
  ('bob.tran@gmail.com',    '2026-09-05 19:00:00+07'),
  ('carol.le@gmail.com',      '2026-06-10 07:00:00+07'),
  ('eva.hoang@gmail.com',   '2026-10-05 17:00:00+07'),
  ('eva.hoang@gmail.com',   '2026-10-07 06:45:00+07'),
  ('grace.dang@gmail.com',    '2026-09-20 18:30:00+07')
) AS c(email, checkin_time)
JOIN users u ON u.email = c.email;

-- ============================================================
-- Quick verification: confirm inserted data
-- ============================================================
-- SELECT role, count(*) FROM users GROUP BY role;
-- SELECT * FROM membership_plans;
-- SELECT u.full_name, mp.name, m.status FROM memberships m
--   JOIN users u ON u.id = m.user_id
--   JOIN membership_plans mp ON mp.id = m.plan_id;
-- SELECT count(*) AS checkin_count FROM checkins;
