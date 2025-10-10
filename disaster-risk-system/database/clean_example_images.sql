-- 清理用户报告表中的示例图片数据
-- 将包含 example.com 的图片URL设置为空数组

-- 查看当前有多少条包含示例图片的记录
SELECT 
  id, 
  title,
  images::text as current_images
FROM user_reports 
WHERE images::text LIKE '%example.com%';

-- 清理示例图片数据
UPDATE user_reports 
SET images = '[]'::jsonb
WHERE images::text LIKE '%example.com%';

-- 同样清理视频示例数据
UPDATE user_reports 
SET videos = '[]'::jsonb
WHERE videos::text LIKE '%example.com%';

-- 验证清理结果
SELECT 
  COUNT(*) as total_reports,
  COUNT(CASE WHEN images::text != '[]' THEN 1 END) as reports_with_images,
  COUNT(CASE WHEN videos::text != '[]' THEN 1 END) as reports_with_videos
FROM user_reports;

-- 提示：运行此脚本后，用户报告将不再包含示例图片
-- 用户可以通过移动端重新上传真实图片

