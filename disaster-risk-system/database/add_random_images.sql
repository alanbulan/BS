-- 为用户报告添加随机图片
-- 使用 picsum.photos 免费占位图服务

-- 首先清理旧的示例图片
UPDATE user_reports 
SET images = '[]'::jsonb
WHERE images::text LIKE '%example.com%';

-- 查看当前的报告类型
SELECT DISTINCT report_type, COUNT(*) as count
FROM user_reports
GROUP BY report_type;

-- 为所有报告添加随机图片（根据ID生成不同的图片）
UPDATE user_reports 
SET images = jsonb_build_array(
  'https://picsum.photos/800/600?random=' || id || '01',
  'https://picsum.photos/800/600?random=' || id || '02'
)
WHERE id <= 50 AND (images IS NULL OR images::text = '[]' OR images::text LIKE '%example.com%');

-- 为部分报告添加第三张图片
UPDATE user_reports 
SET images = images || jsonb_build_array(
  'https://picsum.photos/800/600?random=' || id || '03'
)
WHERE id % 3 = 0 AND id <= 30;

-- 验证更新结果
SELECT 
  id,
  title,
  report_type,
  jsonb_array_length(COALESCE(images, '[]'::jsonb)) as image_count,
  images->0 as first_image_url
FROM user_reports 
WHERE jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0
ORDER BY id
LIMIT 10;

-- 统计信息
SELECT 
  report_type,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0 THEN 1 END) as reports_with_images,
  ROUND(AVG(jsonb_array_length(COALESCE(images, '[]'::jsonb))), 2) as avg_images_per_report
FROM user_reports
GROUP BY report_type
ORDER BY report_type;
