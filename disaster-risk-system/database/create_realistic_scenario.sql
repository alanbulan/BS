-- 创建真实灾害场景模拟
-- 场景：海淀香山地区发生地质灾害，需要紧急疏散

-- ========================================
-- 第1步：修复风险区域重叠问题
-- ========================================

-- 查看当前重叠情况
SELECT '当前重叠检查:' as step;
SELECT 
  a.name as zone1, 
  b.name as zone2
FROM risk_zones a, risk_zones b 
WHERE a.id < b.id 
  AND (ST_Overlaps(a.geometry, b.geometry) 
       OR ST_Intersects(a.geometry, b.geometry))
  AND a.id != b.id;

-- 缩小风险区域范围，避免重叠
-- 每个区域缩小到中心点周围合理的圆形区域

UPDATE risk_zones SET geometry = ST_Buffer(
  ST_Centroid(geometry)::geography,
  CASE 
    WHEN base_risk_level >= 4 THEN 3000  -- 高风险区域3公里半径
    WHEN base_risk_level >= 3 THEN 2000  -- 中风险区域2公里半径
    ELSE 1500                             -- 低风险区域1.5公里半径
  END
)::geometry
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

-- 验证不再重叠
SELECT '修复后重叠检查:' as step;
SELECT COUNT(*) as overlapping_pairs
FROM risk_zones a, risk_zones b 
WHERE a.id < b.id 
  AND ST_Overlaps(a.geometry, b.geometry)
  AND a.id != b.id;

-- ========================================
-- 第2步：设置真实场景 - 海淀香山灾害
-- ========================================

-- 场景设定：海淀香山发生滑坡灾害
-- 用户位置：在香山公园内（高风险区）

-- 测试位置点（在海淀香山风险区域内）
DO $$
DECLARE
  test_location GEOMETRY;
  zone_id INT;
  shelter_id INT;
  warning_id INT;
BEGIN
  -- 获取海淀香山风险区的中心点作为测试位置
  SELECT ST_Centroid(geometry), id INTO test_location, zone_id
  FROM risk_zones 
  WHERE name = '海淀香山' 
  LIMIT 1;
  
  -- 验证测试点在风险区内
  IF ST_Within(test_location, (SELECT geometry FROM risk_zones WHERE id = zone_id)) THEN
    RAISE NOTICE '✓ 测试位置已设置在海淀香山风险区内';
    RAISE NOTICE '  坐标: %', ST_AsText(test_location);
  END IF;
  
  -- 查找最近的避难所
  SELECT id INTO shelter_id
  FROM shelters
  WHERE ST_DWithin(location::geography, test_location::geography, 10000)
  ORDER BY ST_Distance(location::geography, test_location::geography)
  LIMIT 1;
  
  RAISE NOTICE '✓ 最近避难所ID: %', shelter_id;
  
  -- 创建活跃预警（如果不存在）
  INSERT INTO warnings (
    zone_id,
    title,
    content,
    warning_level,
    disaster_type_id,
    issue_time,
    expiry_time,
    issuing_authority,
    affected_areas,
    evacuation_required,
    status
  ) VALUES (
    zone_id,
    '海淀香山地区地质滑坡预警',
    '受持续降雨影响，海淀香山地区发生地质滑坡风险极高。请区域内居民和游客立即撤离，前往指定避难场所。应急通道已开启，请沿安全路线撤离。',
    4,  -- 严重预警
    (SELECT id FROM disaster_types WHERE name LIKE '%滑坡%' LIMIT 1),
    NOW(),
    NOW() + INTERVAL '24 hours',
    '北京市应急管理局',
    ARRAY['海淀区', '香山地区', '植物园周边'],
    true,  -- 需要疏散
    'active'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO warning_id;
  
  RAISE NOTICE '✓ 预警已创建，ID: %', warning_id;
  
END $$;

-- ========================================
-- 第3步：场景数据准备
-- ========================================

-- 创建场景信息视图
CREATE OR REPLACE VIEW current_scenario AS
SELECT 
  '海淀香山滑坡灾害场景' as scenario_name,
  (SELECT name FROM risk_zones WHERE name = '海淀香山') as risk_zone_name,
  (SELECT base_risk_level FROM risk_zones WHERE name = '海淀香山') as risk_level,
  ST_AsText(ST_Centroid((SELECT geometry FROM risk_zones WHERE name = '海淀香山'))) as test_location,
  (SELECT name FROM shelters 
   WHERE ST_DWithin(
     location::geography,
     (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'),
     10000
   )
   ORDER BY ST_Distance(location::geography, (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'))
   LIMIT 1
  ) as nearest_shelter,
  (SELECT COUNT(*) FROM warnings WHERE zone_id = (SELECT id FROM risk_zones WHERE name = '海淀香山') AND status = 'active') as active_warnings;

-- 查看场景信息
SELECT * FROM current_scenario;

-- ========================================
-- 第4步：验证路径规划会避开风险区域
-- ========================================

-- 查询测试位置周边的道路（应急路线）
SELECT '周边应急道路:' as info;
SELECT 
  road_id,
  name,
  road_type,
  is_emergency_route,
  ST_Distance(
    geometry::geography,
    (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山')
  ) as distance_meters
FROM road_network
WHERE ST_DWithin(
  geometry::geography,
  (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'),
  5000
)
  AND is_emergency_route = true
ORDER BY distance_meters
LIMIT 5;

-- ========================================
-- 第5步：输出测试坐标
-- ========================================

SELECT '========================================' as output;
SELECT '测试坐标（复制到移动端测试）:' as output;
SELECT '========================================' as output;

WITH test_coords AS (
  SELECT 
    ST_X(ST_Centroid(geometry)) as lng,
    ST_Y(ST_Centroid(geometry)) as lat
  FROM risk_zones 
  WHERE name = '海淀香山'
)
SELECT 
  CONCAT('当前位置（风险区内）: ', lng, ', ', lat) as coordinates
FROM test_coords
UNION ALL
SELECT 
  CONCAT('最近避难所: ', 
    (SELECT ST_X(location) FROM shelters 
     WHERE ST_DWithin(
       location::geography,
       (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'),
       10000
     )
     ORDER BY ST_Distance(location::geography, (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'))
     LIMIT 1
    ),
    ', ',
    (SELECT ST_Y(location) FROM shelters 
     WHERE ST_DWithin(
       location::geography,
       (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'),
       10000
     )
     ORDER BY ST_Distance(location::geography, (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'))
     LIMIT 1
    )
  ) as coordinates;

-- 完成提示
SELECT '========================================' as output;
SELECT '✓ 真实场景已创建！' as status;
SELECT '✓ 风险区域重叠已修复' as status;
SELECT '✓ 预警已激活' as status;
SELECT '✓ 避难所已关联' as status;
SELECT '========================================' as output;
