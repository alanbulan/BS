"""
数据库加载器
从PostgreSQL数据库加载监测数据用于ML模型训练和推理
"""

import asyncpg
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class DatabaseLoader:
    """
    数据库加载器 - 负责从PostgreSQL加载监测数据
    """
    
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'disaster_risk_db',
            'user': 'disaster_user',
            'password': '123456'
        }
        self.pool = None
    
    async def connect(self):
        """建立数据库连接池"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(**self.db_config, min_size=1, max_size=10)
            logger.info("数据库连接池已创建")
    
    async def close(self):
        """关闭数据库连接"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("数据库连接已关闭")
    
    async def test_connection(self):
        """测试数据库连接"""
        await self.connect()
        async with self.pool.acquire() as conn:
            result = await conn.fetchval('SELECT 1')
            logger.info(f"数据库连接测试成功: {result}")
    
    async def get_zone_monitoring_data(self, zone_id: int, hours: int = 24) -> List[Dict]:
        """
        获取风险区域内监测站的最近监测数据
        
        Args:
            zone_id: 风险区域ID
            hours: 获取最近N小时的数据
        
        Returns:
            监测数据列表 [{station_id, data_type, value, unit, timestamp}, ...]
        """
        await self.connect()
        
        try:
            query = """
                SELECT 
                    md.station_id,
                    md.data_type,
                    md.value,
                    md.unit,
                    md.timestamp,
                    md.quality_flag,
                    ms.name as station_name,
                    ms.station_type
                FROM monitoring_data md
                INNER JOIN monitoring_stations ms ON md.station_id = ms.station_id
                WHERE ms.zone_id = $1
                    AND md.timestamp >= NOW() - INTERVAL '1 hour' * $2
                    AND md.quality_flag >= 1
                ORDER BY md.timestamp DESC
                LIMIT 5000
            """
            
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, zone_id, hours)
                
                data = []
                for row in rows:
                    data.append({
                        'station_id': row['station_id'],
                        'station_name': row['station_name'],
                        'station_type': row['station_type'],
                        'data_type': row['data_type'],
                        'value': float(row['value']),
                        'unit': row['unit'],
                        'timestamp': row['timestamp'],
                        'quality_flag': row['quality_flag']
                    })
                
                logger.info(f"[DB] 查询到风险区域{zone_id}的{len(data)}条监测数据")
                return data
                
        except Exception as e:
            logger.error(f"[DB] 查询监测数据失败: {e}")
            return []
    
    async def get_location_features(self, latitude: float, longitude: float) -> pd.DataFrame:
        """
        获取位置相关特征（用于批量预测）
        """
        # TODO: 实现位置特征提取
        return pd.DataFrame()

