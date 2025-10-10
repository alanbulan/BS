"""
异常检测模型
基于Isolation Forest检测监测数据中的异常值
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyDetector:
    """异常检测器"""
    
    def __init__(self, contamination: float = 0.1):
        """
        初始化异常检测器
        
        Args:
            contamination: 异常值比例估计
        """
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.is_fitted = False
    
    def fit(self, data: np.ndarray):
        """
        训练异常检测模型
        
        Args:
            data: 训练数据 shape=(n_samples, n_features)
        """
        self.model.fit(data)
        self.is_fitted = True
    
    def detect(self, data: np.ndarray) -> np.ndarray:
        """
        检测异常值
        
        Args:
            data: 待检测数据
            
        Returns:
            异常标签 (-1=异常, 1=正常)
        """
        if not self.is_fitted:
            # 如果未训练，先用数据训练
            self.fit(data)
        
        return self.model.predict(data)
    
    def get_anomaly_scores(self, data: np.ndarray) -> np.ndarray:
        """
        获取异常分数
        
        Returns:
            异常分数（越负越异常）
        """
        if not self.is_fitted:
            self.fit(data)
        
        return self.model.score_samples(data)
    
    def detect_time_series_anomaly(self, values: List[float], threshold: float = 3.0) -> List[int]:
        """
        检测时序数据异常
        
        使用简单的Z-score方法
        
        Returns:
            异常索引列表
        """
        values_array = np.array(values)
        mean = np.mean(values_array)
        std = np.std(values_array)
        
        if std == 0:
            return []
        
        z_scores = np.abs((values_array - mean) / std)
        anomaly_indices = np.where(z_scores > threshold)[0]
        
        return anomaly_indices.tolist()

