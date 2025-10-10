"""
空间数据处理工具
处理地理坐标、距离计算等空间相关功能
"""

import numpy as np
from typing import Tuple, List, Dict
from shapely.geometry import Point, Polygon
from shapely import wkt

class SpatialUtils:
    """空间工具类"""
    
    @staticmethod
    def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        计算两点间的距离（Haversine公式）
        
        Returns:
            距离（米）
        """
        R = 6371000  # 地球半径（米）
        
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        dlat = np.radians(lat2 - lat1)
        dlng = np.radians(lng2 - lng1)
        
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlng/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c
    
    @staticmethod
    def point_in_polygon(point: Tuple[float, float], polygon_coords: List[List[float]]) -> bool:
        """
        判断点是否在多边形内
        
        Args:
            point: (lng, lat)
            polygon_coords: [[lng, lat], ...]
        """
        try:
            pt = Point(point)
            poly = Polygon(polygon_coords)
            return pt.within(poly)
        except:
            return False
    
    @staticmethod
    def get_bounding_box(coords: List[List[float]]) -> Dict[str, float]:
        """
        获取坐标列表的边界框
        
        Returns:
            {min_lng, max_lng, min_lat, max_lat}
        """
        lngs = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        
        return {
            'min_lng': min(lngs),
            'max_lng': max(lngs),
            'min_lat': min(lats),
            'max_lat': max(lats)
        }

