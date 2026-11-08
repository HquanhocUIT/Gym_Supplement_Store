-- ============================================================
-- database/seed/01_gym_auth.sql
-- Du lieu mau Auth & Gym (Task 14) - chay trong Supabase SQL Editor
-- Chay SAU file database/schema/01_auth_gym.sql
-- Idempotent: chay lai lai duoc khong bi trung lap du lieu
-- ============================================================

-- 1. Tai khoan demo admin / staff / member (mat khau da hash bcrypt, chi phi 10)
--    Mat khau gan het tat ca tai khoan vien: Admin@123456 / Staff@123456 / Member@123456
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@gym.local',  '$2b$10$8K5eVz3uHehosolsN7TJ4.XCX5J9mnpHddDuCOQaHWoErkComnKwu', 'Quan tri vien', 'admin'),
  ('staff@gym.local',  '$2b$10$mvfie/lnpeV3eLueUTz80ejX3p362UBPrwpIq8iPF/41iygYYPQwy', 'Nhan vien phong tap', 'staff'),
  ('member@gym.local', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Hoi vien demo', 'member'),
  ('nguyen.van.a@gmail.com', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Nguyen Van A', 'member'),
  ('tran.thi.b@gmail.com',  '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Tran Thi B', 'member'),
  ('le.van.c@gmail.com',   '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Le Van C', 'member'),
  ('pham.thi.d@gmail.com', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Pham Thi D', 'member'),
  ('hoang.van.e@gmail.com','$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Hoang Van E', 'member'),
  ('vu.thi.f@gmail.com',   '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Vu Thi F', 'member'),
  ('dang.van.g@gmail.com', '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Dang Van G', 'member'),
  ('bui.thi.h@gmail.com',  '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Bui Thi H', 'member'),
  ('ngo.van.i@gmail.com',  '$2b$10$8FrTE8Bvssx4tt9nFXcqxuogxjMD0GXZHg8.F8P/wW4/0UocMdmHi', 'Ngo Van I', 'member')
ON CONFLICT (email) DO NOTHING;

-- 2. 4 goi tap (idempotent theo ten goi)
INSERT INTO membership_plans (name, duration_days, price, status) VALUES
  ('Goi 1 thang', 30,  250000, 'active'),
  ('Goi 3 thang', 90,  690000, 'active'),
  ('Goi 6 thang', 180, 1290000, 'active'),
  ('Goi 1 nam',   365, 2390000, 'active')
ON CONFLICT (name) DO NOTHING;

-- 3. Hoi vien su dung goi tap (~10 hoi vien)
--    Xoa cua cac email nay roi chen lai de chay lai duoc an toan
DELETE FROM memberships
WHERE user_id IN (SELECT id FROM users WHERE email IN (
  'admin@gym.local', 'staff@gym.local', 'member@gym.local',
  'nguyen.van.a@gmail.com', 'tran.thi.b@gmail.com', 'le.van.c@gmail.com',
  'pham.thi.d@gmail.com', 'hoang.van.e@gmail.com', 'vu.thi.f@gmail.com',
  'dang.van.g@gmail.com', 'bui.thi.h@gmail.com', 'ngo.van.i@gmail.com'
));

INSERT INTO memberships (user_id, plan_id, start_date, end_date, status)
SELECT u.id, p.id, m.start_date, m.end_date, m.status
FROM (VALUES
  ('member@gym.local',        'Goi 1 thang',  '2026-11-01', '2026-11-30', 'active'),
  ('nguyen.van.a@gmail.com',  'Goi 3 thang',  '2026-10-15', '2027-01-15', 'active'),
  ('tran.thi.b@gmail.com',    'Goi 6 thang',  '2026-09-01', '2027-03-01', 'active'),
  ('le.van.c@gmail.com',      'Goi 1 nam',    '2026-06-01', '2027-06-01', 'active'),
  ('pham.thi.d@gmail.com',    'Goi 1 thang',  '2026-09-01', '2026-09-30', 'expired'),
  ('hoang.van.e@gmail.com',   'Goi 3 thang',  '2026-10-01', '2026-12-31', 'active'),
  ('vu.thi.f@gmail.com',      'Goi 1 thang',  '2026-08-01', '2026-08-31', 'cancelled'),
  ('dang.van.g@gmail.com',    'Goi 6 thang',  '2026-08-15', '2027-02-15', 'active'),
  ('bui.thi.h@gmail.com',     'Goi 1 nam',    '2026-05-01', '2027-05-01', 'active'),
  ('ngo.van.i@gmail.com',     'Goi 1 thang',  '2026-09-10', '2026-10-10', 'expired')
) AS m(email, plan_name, start_date, end_date, status)
JOIN users u ON u.email = m.email
JOIN membership_plans p ON p.name = m.plan_name;

-- 4. Lich su check-in (lich su vao phong tap)
DELETE FROM checkins
WHERE user_id IN (SELECT id FROM users WHERE email IN (
  'member@gym.local', 'nguyen.van.a@gmail.com', 'tran.thi.b@gmail.com',
  'le.van.c@gmail.com', 'hoang.van.e@gmail.com', 'dang.van.g@gmail.com'
));

INSERT INTO checkins (user_id, checkin_time)
SELECT u.id, c.checkin_time
FROM (VALUES
  ('member@gym.local',        '2026-11-01 06:30:00+07'),
  ('member@gym.local',        '2026-11-03 07:00:00+07'),
  ('member@gym.local',        '2026-11-05 18:00:00+07'),
  ('nguyen.van.a@gmail.com',  '2026-10-20 17:30:00+07'),
  ('nguyen.van.a@gmail.com',  '2026-10-22 06:15:00+07'),
  ('tran.thi.b@gmail.com',    '2026-09-05 19:00:00+07'),
  ('le.van.c@gmail.com',      '2026-06-10 07:00:00+07'),
  ('hoang.van.e@gmail.com',   '2026-10-05 17:00:00+07'),
  ('hoang.van.e@gmail.com',   '2026-10-07 06:45:00+07'),
  ('dang.van.g@gmail.com',    '2026-09-20 18:30:00+07')
) AS c(email, checkin_time)
JOIN users u ON u.email = c.email;

-- ============================================================
-- Ket qua nhanh: kiem tra du lieu da nhap
-- ============================================================
-- SELECT role, count(*) FROM users GROUP BY role;
-- SELECT * FROM membership_plans;
-- SELECT u.full_name, mp.name, m.status FROM memberships m JOIN users u ON u.id=m.user_id JOIN membership_plans mp ON mp.id=m.plan_id;
-- SELECT count(*) AS so_lan_checkin FROM checkins;
