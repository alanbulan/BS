"""
特征工程模块
从监测数据中提取和构造用于ML模型的特征
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List

class FeatureEngineer:
    """特征工程器"""
    
    def extract_features(self, monitoring_data: pd.DataFrame) -> Dict[str, float]:
        """
        从监测数据中提取特征
        
        Args:
            monitoring_data: 监测数据DataFrame
            
        Returns:
            特征字典 {rainfall, groundwater, slope, ...}
        """
        features = {}
        
        if monitoring_data.empty:
            return features
        
        # 按数据类型聚合
        for data_type in monitoring_data['data_type'].unique():
            type_data = monitoring_data[monitoring_data['data_type'] == data_type]['value']
            
            # 统计特征
            features[f'{data_type}_mean'] = type_data.mean()
            features[f'{data_type}_max'] = type_data.max()
            features[f'{data_type}_min'] = type_data.min()
            features[f'{data_type}_std'] = type_data.std()
        
        return features
    
    def create_time_features(self, timestamp: datetime) -> Dict[str, int]:
        """
        创建时间特征
        
        Returns:
            {hour, day_of_week, month, is_weekend}
        """
        return {
            'hour': timestamp.hour,
            'day_of_week': timestamp.weekday(),
            'month': timestamp.month,
            'is_weekend': 1 if timestamp.weekday() >= 5 else 0
        }
    
    def normalize_features(self, features: Dict[str, float], 
                         feature_ranges: Dict[str, tuple]) -> Dict[str, float]:
        """
        归一化特征到0-1范围
        
        Args:
            features: 原始特征
            feature_ranges: 特征范围 {feature_name: (min, max)}
        """
        normalized = {}
        
        for name, value in features.items():
            if name in feature_ranges:
                min_val, max_val = feature_ranges[name]
                if max_val > min_val:
                    normalized[name] = (value - min_val) / (max_val - min_val)
                else:
                    normalized[name] = 0.5
            else:
                normalized[name] = value
        
        return normalized

