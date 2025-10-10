"""
时序预测模型
基于历史监测数据预测未来风险趋势
"""

import numpy as np
from typing import List, Dict, Optional

class TimeSeriesPredictionModel:
    """
    时序预测模型（轻量级版本）
    
    使用简单的移动平均和趋势分析，不需要LSTM/Prophet
    """
    
    def __init__(self):
        self.window_size = 24  # 使用24小时窗口
        print("[MODEL] 时序预测模型已初始化（移动平均法）")
    
    def predict(self, historical_data: List[float], horizon: int = 24) -> Dict:
        """
        预测未来趋势
        
        Args:
            historical_data: 历史数据序列
            horizon: 预测时长（小时）
        
        Returns:
            预测结果 {predictions, trend, confidence}
        """
        if len(historical_data) < 2:
            return {
                'predictions': [],
                'trend': 'stable',
                'confidence': 0.5
            }
        
        # 计算趋势（简单线性回归）
        x = np.arange(len(historical_data))
        y = np.array(historical_data)
        
        # 线性拟合
        slope = np.polyfit(x, y, 1)[0] if len(x) > 1 else 0
        
        # 预测未来值
        last_value = historical_data[-1]
        predictions = [last_value + slope * i for i in range(1, horizon + 1)]
        
        # 判断趋势
        if slope > 0.1:
            trend = 'increasing'
        elif slope < -0.1:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        # 置信度（基于数据量和标准差）
        std = np.std(historical_data)
        confidence = min(0.9, 0.5 + len(historical_data) / 100)
        if std > np.mean(historical_data) * 0.5:
            confidence *= 0.8  # 数据波动大，置信度降低
        
        return {
            'predictions': predictions[:horizon],
            'trend': trend,
            'confidence': confidence,
            'slope': float(slope)
        }
    
    def predict_risk_level(self, current_level: int, 
                          historical_levels: List[int]) -> Dict[str, int]:
        """
        预测未来风险等级
        
        Returns:
            {predicted_24h, predicted_72h}
        """
        if not historical_levels or len(historical_levels) < 2:
            return {
                'predicted_24h': current_level,
                'predicted_72h': current_level
            }
        
        # 计算趋势
        recent_trend = np.mean([historical_levels[i] - historical_levels[i-1] 
                               for i in range(1, min(5, len(historical_levels)))])
        
        # 预测24小时
        pred_24h = current_level + int(round(recent_trend))
        pred_24h = max(1, min(5, pred_24h))
        
        # 预测72小时
        pred_72h = current_level + int(round(recent_trend * 2))
        pred_72h = max(1, min(5, pred_72h))
        
        return {
            'predicted_24h': pred_24h,
            'predicted_72h': pred_72h
        }



