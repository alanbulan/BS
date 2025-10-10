#!/usr/bin/env python3
"""
从OpenStreetMap获取北京市道路网络数据并转换为SQL
匹配 road_network 表结构
"""

import requests
import json
from datetime import datetime

# Overpass API地址（使用备用服务器以防主服务器繁忙）
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# 北京市边界（扩大范围以包含郊区）
BEIJING_BBOX = {
    'south': 39.4,   # 南纬
    'west': 115.7,   # 西经
    'north': 41.0,   # 北纬
    'east': 117.4    # 东经
}

# 核心区域（更密集的数据）
CORE_BBOX = {
    'south': 39.75,
    'west': 116.15,
    'north': 40.10,
    'east': 116.60
}

# OSM highway类型映射到系统道路类型
ROAD_TYPE_MAP = {
    'motorway': '高速公路',
    'motorway_link': '高速匝道',
    'trunk': '快速路',
    'trunk_link': '快速路匝道',
    'primary': '主干道',
    'primary_link': '主干道匝道',
    'secondary': '次干道',
    'secondary_link': '次干道匝道',
    'tertiary': '三级道路',
    'residential': '居民区道路',
    'service': '服务道路'
}

# 道路等级映射
ROAD_CLASS_MAP = {
    'motorway': 1,
    'trunk': 1,
    'primary': 2,
    'secondary': 3,
    'tertiary': 4,
    'residential': 5,
    'service': 6
}

# 路面类型映射
SURFACE_MAP = {
    'asphalt': '沥青',
    'concrete': '水泥',
    'paved': '铺装',
    'unpaved': '未铺装',
    'gravel': '碎石',
    'dirt': '土路'
}

def fetch_roads_from_osm(bbox, road_types):
    """从OSM获取道路数据"""
    
    # 构建Overpass查询
    query = f"""
    [out:json][timeout:90];
    (
      way["highway"~"{road_types}"]({bbox['south']},{bbox['west']},{bbox['north']},{bbox['east']});
    );
    out geom;
    """
    
    print(f"查询范围: {bbox}")
    print(f"道路类型: {road_types}")
    
    # 尝试多个服务器
    for url in OVERPASS_URLS:
        try:
            print(f"\n尝试连接: {url}")
            response = requests.post(
                url, 
                data={'data': query},
                timeout=120
            )
            response.raise_for_status()
            data = response.json()
            
            if 'elements' in data:
                print(f"[OK] Successfully fetched {len(data['elements'])} roads")
                return data['elements']
        except Exception as e:
            print(f"[ERROR] Request failed: {e}")
            continue
    
    return []

def convert_to_sql(roads):
    """转换为SQL语句"""
    
    sql_lines = []
    sql_lines.append("-- 从OpenStreetMap导入的北京市道路网络数据")
    sql_lines.append(f"-- 生成时间: {datetime.now().isoformat()}")
    sql_lines.append(f"-- 数据来源: OpenStreetMap (ODbL License)")
    sql_lines.append(f"-- 道路数量: {len(roads)}")
    sql_lines.append("")
    sql_lines.append("BEGIN;")
    sql_lines.append("")
    sql_lines.append("-- 清空现有OSM道路数据")
    sql_lines.append("DELETE FROM road_network WHERE road_id LIKE 'OSM_%';")
    sql_lines.append("")
    
    valid_count = 0
    
    for road in roads:
        if road.get('type') != 'way':
            continue
        
        # 提取几何坐标
        geometry = road.get('geometry', [])
        if len(geometry) < 2:
            continue
        
        # 构建坐标字符串
        coords = ', '.join([f"{p['lon']} {p['lat']}" for p in geometry])
        
        # 提取标签
        tags = road.get('tags', {})
        osm_id = road.get('id', 0)
        name = tags.get('name', tags.get('name:zh', tags.get('name:en', f'道路_{osm_id}')))
        highway = tags.get('highway', 'unknown')
        
        # 映射字段
        road_type = ROAD_TYPE_MAP.get(highway, '其他道路')
        road_class = ROAD_CLASS_MAP.get(highway.replace('_link', ''), 5)
        
        # 宽度
        width = tags.get('width')
        width_sql = f"{float(width)}" if width else "NULL"
        
        # 路面类型
        surface = tags.get('surface', '')
        surface_type = SURFACE_MAP.get(surface, surface) if surface else 'NULL'
        surface_sql = f"'{surface_type}'" if surface_type != 'NULL' else 'NULL'
        
        # 最高速度
        maxspeed = tags.get('maxspeed', '')
        if maxspeed and maxspeed.isdigit():
            max_speed_sql = maxspeed
        else:
            # 根据道路类型估算
            speed_map = {'motorway': 120, 'trunk': 80, 'primary': 60, 'secondary': 50, 'tertiary': 40}
            max_speed_sql = str(speed_map.get(highway.replace('_link', ''), 30))
        
        # 双向道路
        oneway = tags.get('oneway', 'no')
        is_bidirectional = 'false' if oneway in ['yes', '1', 'true'] else 'true'
        
        # 应急路线（高速和主干道标记为应急路线）
        is_emergency = 'true' if highway in ['motorway', 'trunk', 'primary'] else 'false'
        
        # 车道数（用于估算traffic_capacity）
        lanes = tags.get('lanes', '')
        if lanes and lanes.isdigit():
            traffic_capacity = int(lanes) * 1800  # 每车道每小时1800辆车
        else:
            capacity_map = {'motorway': 7200, 'trunk': 5400, 'primary': 3600, 'secondary': 1800}
            traffic_capacity = capacity_map.get(highway.replace('_link', ''), 900)
        
        # 转义SQL字符串
        name_escaped = name.replace("'", "''")
        
        # 生成SQL INSERT语句
        sql = f"""INSERT INTO road_network (
  road_id, name, geometry, road_type, road_class,
  width, surface_type, max_speed, is_bidirectional,
  traffic_capacity, is_emergency_route
) VALUES (
  'OSM_{osm_id}',
  '{name_escaped}',
  ST_GeomFromText('LINESTRING({coords})', 4326),
  '{road_type}',
  {road_class},
  {width_sql},
  {surface_sql},
  {max_speed_sql},
  {is_bidirectional},
  {traffic_capacity},
  {is_emergency}
);"""
        
        sql_lines.append(sql)
        valid_count += 1
        
        # 每100条显示进度
        if valid_count % 100 == 0:
            print(f"  已处理 {valid_count} 条道路...")
    
    sql_lines.append("")
    sql_lines.append("COMMIT;")
    sql_lines.append("")
    sql_lines.append(f"-- 导入完成！共 {valid_count} 条有效道路")
    
    return sql_lines, valid_count

def main():
    print("=" * 60)
    print("OpenStreetMap 道路数据导入工具")
    print("=" * 60)
    print()
    
    all_roads = []
    
    # 第1步：获取核心区域的主要道路
    print("[Step 1/3] Fetching core area main roads...")
    core_roads = fetch_roads_from_osm(
        CORE_BBOX,
        "motorway|trunk|primary"
    )
    all_roads.extend(core_roads)
    
    # 第2步：获取核心区域的次要道路
    print("\n[Step 2/3] Fetching core area secondary roads...")
    core_secondary = fetch_roads_from_osm(
        CORE_BBOX,
        "secondary|tertiary"
    )
    all_roads.extend(core_secondary)
    
    # 第3步：获取整个北京市的高速和快速路
    print("\n[Step 3/3] Fetching city-wide highways...")
    highway_roads = fetch_roads_from_osm(
        BEIJING_BBOX,
        "motorway|trunk"
    )
    all_roads.extend(highway_roads)
    
    print("\n" + "=" * 60)
    print(f"[OK] Total roads fetched: {len(all_roads)}")
    print("=" * 60)
    
    # 去重（根据OSM ID）
    unique_roads = {}
    for road in all_roads:
        road_id = road.get('id')
        if road_id and road_id not in unique_roads:
            unique_roads[road_id] = road
    
    print(f"\nAfter deduplication: {len(unique_roads)} unique roads")
    
    # 转换为SQL
    print("\n[*] Converting to SQL...")
    sql_lines, count = convert_to_sql(list(unique_roads.values()))
    
    # 保存文件
    output_file = 'osm_beijing_roads.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"\n[OK] SQL script generated: {output_file}")
    print(f"[*] Valid roads: {count}")
    print(f"[*] File size: {len(''.join(sql_lines)) / 1024:.1f} KB")
    print()
    print("Run the following command to import:")
    print("=" * 60)
    print(f"cd database")
    print(f"$env:PGPASSWORD='123456'; psql -h localhost -p 5432 -U disaster_user -d disaster_risk_db -f {output_file}")
    print("=" * 60)

if __name__ == '__main__':
    main()
