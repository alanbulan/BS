-- 快速设置测试场景：模拟用户在海淀香山风险区内

-- 1. 修复风险区域重叠（缩小到合理范围）
UPDATE risk_zones SET geometry = ST_Buffer(
  ST_Centroid(geometry)::geography,
  CASE 
    WHEN base_risk_level >= 4 THEN 3000
    WHEN base_risk_level >= 3 THEN 2000
    ELSE 1500
  END
)::geometry;

-- 2. 在海淀香山附近创建一个避难所（如果不存在）
INSERT INTO shelters (
  name, location, address, capacity, current_occupancy,
  shelter_type, is_active, facilities, contact_info
) VALUES (
  '香山应急避难所',
  ST_SetSRID(ST_MakePoint(116.18, 40.00), 4326),
  '北京市海淀区香山路',
  2000,
  0,
  '固定避难场所',
  true,
  '{"医疗":true,"食品":true,"饮用水":true,"通讯":true}'::jsonb,
  '{"电话":"010-12345","负责人":"应急管理部门"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 3. 创建活跃预警
INSERT INTO warnings (
  zone_id,
  title,
  content,
  warning_level,
  disaster_type_id,
  issue_time,
  expiry_time,
  issuing_authority,
  evacuation_required,
  status
) 
SELECT 
  (SELECT id FROM risk_zones WHERE name = '海淀香山'),
  '海淀香山地区地质滑坡红色预警',
  '受持续强降雨影响，海淀香山地区山体发生大面积滑坡风险极高。请立即撤离！前往香山应急避难所或其他安全地带。应急救援通道已开启。',
  4,
  (SELECT id FROM disaster_types WHERE name LIKE '%滑坡%' OR name LIKE '%地质%' LIMIT 1),
  NOW() - INTERVAL '30 minutes',
  NOW() + INTERVAL '24 hours',
  '北京市应急管理局',
  true,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM warnings 
  WHERE zone_id = (SELECT id FROM risk_zones WHERE name = '海淀香山')
    AND status = 'active'
);

-- 4. 输出测试场景信息
SELECT '========================================' as "INFO";
SELECT '🎬 真实灾害场景已创建' as "INFO";
SELECT '========================================' as "INFO";

SELECT 
  '场景名称' as item,
  '海淀香山地质滑坡灾害' as value
UNION ALL
SELECT 
  '风险区域',
  name
FROM risk_zones WHERE name = '海淀香山'
UNION ALL
SELECT 
  '风险等级',
  base_risk_level::text || '/5 (中高风险)'
FROM risk_zones WHERE name = '海淀香山'
UNION ALL
SELECT 
  '测试坐标（经度）',
  ST_X(ST_Centroid(geometry))::text
FROM risk_zones WHERE name = '海淀香山'
UNION ALL
SELECT 
  '测试坐标（纬度）',
  ST_Y(ST_Centroid(geometry))::text
FROM risk_zones WHERE name = '海淀香山'
UNION ALL
SELECT 
  '活跃预警数',
  COUNT(*)::text
FROM warnings 
WHERE zone_id = (SELECT id FROM risk_zones WHERE name = '海淀香山')
  AND status = 'active'
UNION ALL
SELECT 
  '最近避难所',
  s.name
FROM shelters s
WHERE ST_DWithin(
  s.location::geography,
  (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'),
  10000
)
ORDER BY ST_Distance(s.location::geography, (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'))
LIMIT 1;

SELECT '========================================' as "INFO";

-- 5. 验证场景完整性
SELECT '场景验证:' as "CHECK";
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM risk_zones WHERE ST_Overlaps(geometry, (SELECT geometry FROM risk_zones WHERE name = '海淀香山')) AND name != '海淀香山') = 0
    THEN '✓ 风险区域无重叠'
    ELSE '✗ 仍有重叠'
  END as status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM warnings WHERE zone_id = (SELECT id FROM risk_zones WHERE name = '海淀香山') AND status = 'active')
    THEN '✓ 活跃预警已激活'
    ELSE '✗ 无活跃预警'
  END as status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM shelters WHERE ST_DWithin(location::geography, (SELECT ST_Centroid(geometry)::geography FROM risk_zones WHERE name = '海淀香山'), 10000))
    THEN '✓ 周边有避难所'
    ELSE '✗ 周边无避难所'
  END as status;
