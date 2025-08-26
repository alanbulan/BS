-- 更新系统配置分类为中文
-- 将英文分类名称更新为中文分类名称

UPDATE system_config SET category = 'assessment' WHERE category = '璇勪及璁剧疆';
UPDATE system_config SET category = 'warning' WHERE category = '棰勮璁剧疆';
UPDATE system_config SET category = 'map' WHERE category = '鍦板浘璁剧疆';
UPDATE system_config SET category = 'emergency' WHERE category = '搴旀璁剧疆';
UPDATE system_config SET category = 'data' WHERE category = '鏁版嵁璁剧疆';
UPDATE system_config SET category = 'notification' WHERE category = '閫氱煡璁剧疆';
UPDATE system_config SET category = 'api' WHERE category = 'API璁剧疆';
UPDATE system_config SET category = 'system' WHERE category = '绯荤粺璁剧疆';

-- 查看更新结果
SELECT DISTINCT category FROM system_config ORDER BY category;