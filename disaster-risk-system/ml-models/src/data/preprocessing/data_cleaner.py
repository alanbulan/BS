"""
数据清洗模块
处理监测数据的异常值、缺失值和噪声
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional

class DataCleaner:
    """数据清洗器"""
    
    def clean_monitoring_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        清洗监测数据
        
        Args:
            df: 原始监测数据DataFrame
            
        Returns:
            清洗后的数据
        """
        if df.empty:
            return df
        
        # 1. 移除重复数据
        df = df.drop_duplicates(subset=['station_id', 'data_type', 'timestamp'])
        
        # 2. 处理缺失值
        df = df.dropna(subset=['value'])
        
        # 3. 移除异常值（基于统计方法）
        df = self.remove_outliers(df)
        
        # 4. 数据类型转换
        if 'value' in df.columns:
            df['value'] = pd.to_numeric(df['value'], errors='coerce')
        
        return df
    
    def remove_outliers(self, df: pd.DataFrame, threshold: float = 3.0) -> pd.DataFrame:
        """
        移除异常值（使用Z-score方法）
        
        Args:
            df: 数据框
            threshold: Z-score阈值
        """
        if df.empty or 'value' not in df.columns:
            return df
        
        # 按数据类型分组移除异常值
        cleaned_dfs = []
        for data_type in df['data_type'].unique():
            type_df = df[df['data_type'] == data_type].copy()
            
            if len(type_df) > 2:  # 至少需要3个数据点
                mean = type_df['value'].mean()
                std = type_df['value'].std()
                
                if std > 0:
                    z_scores = np.abs((type_df['value'] - mean) / std)
                    type_df = type_df[z_scores < threshold]
            
            cleaned_dfs.append(type_df)
        
        return pd.concat(cleaned_dfs, ignore_index=True) if cleaned_dfs else df

