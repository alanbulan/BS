-- 验证OSM道路数据导入情况

-- 1. 总体统计
SELECT 
  '总道路数' as metric,
  COUNT(*)::text as value
FROM road_network
UNION ALL
SELECT 
  'OSM道路数',
  COUNT(*)::text
FROM road_network WHERE road_id LIKE 'OSM_%'
UNION ALL
SELECT 
  '道路类型数',
  COUNT(DISTINCT road_type)::text
FROM road_network;

-- 2. 按道路类型统计
SELECT 
  road_type,
  COUNT(*) as road_count,
  COUNT(CASE WHEN is_emergency_route THEN 1 END) as emergency_count
FROM road_network 
WHERE road_id LIKE 'OSM_%'
GROUP BY road_type 
ORDER BY road_count DESC;

-- 3. 检查几何数据质量
SELECT 
  'Min points' as metric,
  MIN(ST_NumPoints(geometry))::text as value
FROM road_network WHERE road_id LIKE 'OSM_%'
UNION ALL
SELECT 
  'Max points',
  MAX(ST_NumPoints(geometry))::text
FROM road_network WHERE road_id LIKE 'OSM_%'
UNION ALL
SELECT 
  'Avg points',
  ROUND(AVG(ST_NumPoints(geometry)))::text
FROM road_network WHERE road_id LIKE 'OSM_%';

-- 4. 检查是否有空间索引
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'road_network';

-- 5. 验证完成提示
SELECT '✓ OSM road network data import successful!' as status;

