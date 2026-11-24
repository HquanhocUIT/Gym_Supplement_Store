-- Chỉ đổi mô tả mẫu còn trùng nội dung seed cũ, giữ được mô tả đã tự chỉnh.
BEGIN;
WITH descriptions (name, old_description, new_description) AS (
  VALUES
  ('Daily Whey', 'Whey protein dùng hằng ngày', 'Whey protein for daily use'),
  ('Whey Blend', 'Hỗn hợp whey protein', 'A blend of whey proteins'),
  ('Whey Recovery', 'Protein dùng sau buổi tập', 'Protein for post-workout recovery'),
  ('Creatine Micronized', 'Creatine dạng bột mịn', 'Finely milled creatine powder'),
  ('Creatine Daily', 'Creatine dùng hằng ngày', 'Creatine for daily use'),
  ('Creatine Performance', 'Creatine hỗ trợ tập luyện', 'Creatine for training support'),
  ('Creatine Strength', 'Creatine dạng bột', 'Creatine powder'),
  ('Pre-workout Energy', 'Pre-workout trước buổi tập', 'Pre-workout for your training session'),
  ('Pre-workout Focus', 'Pre-workout hỗ trợ tập trung', 'Pre-workout for focus'),
  ('Pre-workout Pump', 'Pre-workout dùng trước khi tập', 'Pre-workout supplement'),
  ('Pre-workout Light', 'Pre-workout hương trái cây', 'Fruit-flavoured pre-workout'),
  ('Pre-workout Training', 'Pre-workout cho buổi tập', 'Pre-workout for training'),
  ('Lifting Strap Basic', 'Dây kéo hỗ trợ tập tạ', 'Lifting straps for weight training'),
  ('Lifting Strap Padded', 'Dây kéo có đệm', 'Padded lifting straps'),
  ('Lifting Belt Basic', 'Đai lưng tập tạ cơ bản', 'Basic weightlifting belt'),
  ('Lifting Belt Wide', 'Đai lưng tập tạ bản rộng', 'Wide weightlifting belt'),
  ('Lifting Belt Adjustable', 'Đai lưng có thể điều chỉnh', 'Adjustable weightlifting belt')
)
UPDATE products AS p
SET description = d.new_description, updated_at = now()
FROM descriptions AS d
WHERE p.name = d.name AND p.description = d.old_description;
COMMIT;
