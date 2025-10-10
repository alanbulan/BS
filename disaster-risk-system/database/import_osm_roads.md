# 从OpenStreetMap导入北京市道路网络数据

## 📋 方案说明

OpenStreetMap (OSM) 提供**完全免费**的全球道路数据，质量高且实时更新。

---

## 🚀 方法1：使用Overpass API（推荐）

### 步骤1：获取北京市主要道路数据

访问：https://overpass-turbo.eu/

粘贴以下查询语句：

```
[out:json][timeout:60];
// 北京市范围 (大致边界)
(
  // 主干道和高速公路
  way["highway"~"motorway|trunk|primary"](39.4,115.7,41.0,117.4);
  // 次干道
  way["highway"~"secondary|tertiary"](39.4,115.7,41.0,117.4);
);
out geom;
```

**参数说明：**
- `39.4,115.7,41.0,117.4` = 北京市边界 (南纬,西经,北纬,东经)
- `motorway` = 高速公路
- `trunk` = 快速路/国道
- `primary` = 主干道
- `secondary` = 次干道
- `tertiary` = 三级道路

### 步骤2：导出数据

1. 点击"运行" → 等待查询完成（30-60秒）
2. 点击"导出" → 选择 **"GeoJSON"**
3. 保存为 `beijing_roads.geojson`

### 步骤3：转换为SQL

我创建了一个Python脚本来转换：

**文件位置**: `database/convert_osm_to_sql.py`

---

## 🔧 方法2：使用Geofabrik下载（简单）

### 步骤1：下载中国数据

访问：https://download.geofabrik.de/asia/china.html

下载：
- **china-latest.osm.pbf** (完整数据，~1.5GB)
- 或 **beijing-latest.osm.pbf** (仅北京，如果有的话)

### 步骤2：使用osm2pgsql导入

```bash
# 安装osm2pgsql
# Windows: choco install osm2pgsql
# 或下载: https://github.com/openstreetmap/osm2pgsql/releases

# 导入到PostgreSQL
osm2pgsql -c -d disaster_risk_db -U disaster_user -H localhost \
  --hstore --style default.style \
  china-latest.osm.pbf

# 筛选北京市道路
psql -U disaster_user -d disaster_risk_db -c "
  INSERT INTO road_network (road_id, name, geometry, road_type)
  SELECT 
    'OSM_' || osm_id,
    name,
    way,
    highway
  FROM planet_osm_line
  WHERE highway IN ('motorway', 'trunk', 'primary', 'secondary', 'tertiary')
    AND ST_Intersects(way, ST_MakeEnvelope(115.7, 39.4, 117.4, 41.0, 4326));
"
```

---

## ⚡ 方法3：快速测试方案（最简单）

### 使用我提供的Python脚本直接获取

创建文件：`database/fetch_osm_roads.py`

```python
#!/usr/bin/env python3
"""
从OpenStreetMap Overpass API获取北京市道路数据
并转换为PostgreSQL SQL脚本
"""

import requests
import json

# Overpass API查询
overpass_url = "http://overpass-api.de/api/interpreter"
overpass_query = """
[out:json][timeout:90];
(
  way["highway"~"motorway|trunk|primary"](39.4,115.7,41.0,117.4);
  way["highway"~"secondary|tertiary"](39.7,116.0,40.2,116.8);
);
out geom;
"""

print("正在从OSM获取北京市道路数据...")
print("这可能需要30-60秒，请耐心等待...")

response = requests.post(overpass_url, data={'data': overpass_query})
data = response.json()

roads = data['elements']
print(f"\n成功获取 {len(roads)} 条道路！")

# 转换为SQL
sql_lines = []
sql_lines.append("-- 从OpenStreetMap导入的北京市道路网络数据")
sql_lines.append("-- 生成时间: " + datetime.now().isoformat())
sql_lines.append("")
sql_lines.append("-- 清空现有道路数据（可选）")
sql_lines.append("-- DELETE FROM road_network WHERE road_id LIKE 'OSM_%';")
sql_lines.append("")

road_type_map = {
    'motorway': '高速公路',
    'trunk': '快速路',
    'primary': '主干道',
    'secondary': '次干道',
    'tertiary': '三级道路'
}

for idx, road in enumerate(roads, 1):
    if road['type'] != 'way':
        continue
    
    # 提取几何坐标
    if 'geometry' not in road or len(road['geometry']) < 2:
        continue
    
    coords = ', '.join([f"{p['lon']} {p['lat']}" for p in road['geometry']])
    
    # 提取属性
    tags = road.get('tags', {})
    name = tags.get('name', f'未命名道路_{idx}')
    highway = tags.get('highway', 'unknown')
    road_type_zh = road_type_map.get(highway, '其他道路')
    
    # 生成SQL
    sql = f"""
INSERT INTO road_network (
  road_id, name, geometry, road_type, 
  road_class, is_bidirectional, is_emergency_route
) VALUES (
  'OSM_{road['id']}',
  '{name.replace("'", "''")}',
  ST_GeomFromText('LINESTRING({coords})', 4326),
  '{road_type_zh}',
  {1 if highway in ['motorway', 'trunk'] else 2 if highway == 'primary' else 3},
  true,
  {highway in ['motorway', 'trunk', 'primary']}
);"""
    
    sql_lines.append(sql)

# 保存SQL文件
output_file = 'osm_beijing_roads.sql'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"\n✅ SQL脚本已生成: {output_file}")
print(f"📊 共 {len(roads)} 条道路")
print(f"\n运行以下命令导入数据库：")
print(f"psql -U disaster_user -d disaster_risk_db -f {output_file}")
```

**使用方法：**
```bash
# 1. 安装requests
pip install requests

# 2. 运行脚本
python database/fetch_osm_roads.py

# 3. 导入SQL
cd database
psql -U disaster_user -d disaster_risk_db -f osm_beijing_roads.sql
```

---

**需要我现在就创建这个脚本吗？**

这样你就能获取**真实的**北京市道路网络，A*算法就能正常工作了！
