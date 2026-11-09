-- Thêm bốn danh mục mẫu; chạy lại không tạo tên trùng.
INSERT INTO categories (name)
VALUES
  ('Whey Protein'),
  ('Creatine'),
  ('Pre-workout'),
  ('Gym Accessories')
ON CONFLICT (name) DO NOTHING;

-- Thêm 20 sản phẩm mẫu, chia đều cho bốn danh mục.
WITH sample_products (category_name, product_name, description) AS (
  VALUES
    ('Whey Protein', 'Daily Whey', 'Whey protein dùng hằng ngày'),
    ('Whey Protein', 'Whey Isolate', 'Whey isolate'),
    ('Whey Protein', 'Whey Concentrate', 'Whey concentrate'),
    ('Whey Protein', 'Whey Blend', 'Hỗn hợp whey protein'),
    ('Whey Protein', 'Whey Recovery', 'Protein dùng sau buổi tập'),
    ('Creatine', 'Pure Creatine', 'Creatine monohydrate'),
    ('Creatine', 'Creatine Micronized', 'Creatine dạng bột mịn'),
    ('Creatine', 'Creatine Daily', 'Creatine dùng hằng ngày'),
    ('Creatine', 'Creatine Performance', 'Creatine hỗ trợ tập luyện'),
    ('Creatine', 'Creatine Strength', 'Creatine dạng bột'),
    ('Pre-workout', 'Pre-workout Energy', 'Pre-workout trước buổi tập'),
    ('Pre-workout', 'Pre-workout Focus', 'Pre-workout hỗ trợ tập trung'),
    ('Pre-workout', 'Pre-workout Pump', 'Pre-workout dùng trước khi tập'),
    ('Pre-workout', 'Pre-workout Light', 'Pre-workout hương trái cây'),
    ('Pre-workout', 'Pre-workout Training', 'Pre-workout cho buổi tập'),
    ('Gym Accessories', 'Lifting Strap Basic', 'Dây kéo hỗ trợ tập tạ'),
    ('Gym Accessories', 'Lifting Strap Padded', 'Dây kéo có đệm'),
    ('Gym Accessories', 'Lifting Belt Basic', 'Đai lưng tập tạ cơ bản'),
    ('Gym Accessories', 'Lifting Belt Wide', 'Đai lưng tập tạ bản rộng'),
    ('Gym Accessories', 'Lifting Belt Adjustable', 'Đai lưng có thể điều chỉnh')
)
INSERT INTO products (category_id, name, description)
SELECT c.id, s.product_name, s.description
FROM sample_products AS s
JOIN categories AS c ON c.name = s.category_name
WHERE NOT EXISTS (
  SELECT 1
  FROM products AS p
  WHERE p.category_id = c.id
    AND p.name = s.product_name
);

-- Mỗi sản phẩm có một variant mẫu với giá VND và số lượng ban đầu.
WITH sample_variants (category_name, product_name, flavor, size, price, stock) AS (
  VALUES
    ('Whey Protein', 'Daily Whey', 'Vanilla', '1 kg', 790000, 20),
    ('Whey Protein', 'Whey Isolate', 'Chocolate', '1 kg', 990000, 15),
    ('Whey Protein', 'Whey Concentrate', 'Vanilla', '1 kg', 750000, 18),
    ('Whey Protein', 'Whey Blend', 'Strawberry', '1 kg', 820000, 12),
    ('Whey Protein', 'Whey Recovery', 'Chocolate', '900 g', 780000, 14),
    ('Creatine', 'Pure Creatine', 'Unflavored', '300 g', 420000, 30),
    ('Creatine', 'Creatine Micronized', 'Unflavored', '300 g', 450000, 22),
    ('Creatine', 'Creatine Daily', 'Unflavored', '250 g', 380000, 25),
    ('Creatine', 'Creatine Performance', 'Unflavored', '500 g', 590000, 16),
    ('Creatine', 'Creatine Strength', 'Unflavored', '300 g', 430000, 20),
    ('Pre-workout', 'Pre-workout Energy', 'Fruit Punch', '300 g', 520000, 15),
    ('Pre-workout', 'Pre-workout Focus', 'Orange', '300 g', 550000, 14),
    ('Pre-workout', 'Pre-workout Pump', 'Berry', '300 g', 580000, 12),
    ('Pre-workout', 'Pre-workout Light', 'Lemon', '250 g', 470000, 18),
    ('Pre-workout', 'Pre-workout Training', 'Grape', '300 g', 510000, 16),
    ('Gym Accessories', 'Lifting Strap Basic', NULL, 'One size', 120000, 30),
    ('Gym Accessories', 'Lifting Strap Padded', NULL, 'One size', 180000, 25),
    ('Gym Accessories', 'Lifting Belt Basic', NULL, 'M', 350000, 12),
    ('Gym Accessories', 'Lifting Belt Wide', NULL, 'L', 480000, 10),
    ('Gym Accessories', 'Lifting Belt Adjustable', NULL, 'M', 420000, 15)
)
INSERT INTO product_variants (product_id, flavor, size, price, stock)
SELECT p.id, s.flavor, s.size, s.price, s.stock
FROM sample_variants AS s
JOIN categories AS c ON c.name = s.category_name
JOIN products AS p
  ON p.category_id = c.id
 AND p.name = s.product_name
WHERE NOT EXISTS (
  SELECT 1
  FROM product_variants AS v
  WHERE v.product_id = p.id
    AND v.flavor IS NOT DISTINCT FROM s.flavor
    AND v.size = s.size
);
