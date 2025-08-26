"""
机器学习API服务
提供风险评估、路径优化、异常检测等ML服务的RESTful API接口
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
import logging
from datetime import datetime
import numpy as np
import pandas as pd

from ..models.risk_assessment.risk_model import RiskAssessmentModel
from ..models.time_series.prediction_model import TimeSeriesPredictionModel
from ..models.route_optimization.route_optimizer import RouteOptimizer
from ..models.anomaly_detection.anomaly_detector import AnomalyDetector
from ..data.loaders.database_loader import DatabaseLoader
from ..config.config import API_CONFIG

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="地质灾害风险评估ML服务",
    description="提供实时风险评估、预测和路径优化服务",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模型实例（全局加载）
risk_model = None
time_series_model = None
route_optimizer = None
anomaly_detector = None
db_loader = None

# Pydantic模型定义
class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="纬度")
    longitude: float = Field(..., ge=-180, le=180, description="经度")

class RiskAssessmentRequest(BaseModel):
    location: LocationInput
    include_predictions: bool = Field(True, description="是否包含时序预测")
    include_factors: bool = Field(True, description="是否包含影响因素分析")

class RiskAssessmentResponse(BaseModel):
    current_risk_level: int = Field(..., ge=1, le=5)
    confidence_score: float = Field(..., ge=0, le=1)
    predicted_risk_24h: Optional[int] = None
    predicted_risk_72h: Optional[int] = None
    contributing_factors: Optional[Dict[str, float]] = None
    recommendations: Optional[str] = None
    assessment_time: datetime
    model_version: str

class RouteOptimizationRequest(BaseModel):
    start_location: LocationInput
    end_location: LocationInput
    optimize_for: str = Field("safety", regex="^(safety|time|distance)$")
    avoid_high_risk: bool = True
    max_risk_level: int = Field(4, ge=1, le=5)

class RouteOptimizationResponse(BaseModel):
    route_id: str
    total_distance: float
    estimated_time: float
    safety_score: float
    waypoints: List[Dict[str, Any]]
    risk_analysis: Dict[str, Any]
    alternative_routes: Optional[List[Dict[str, Any]]] = None

class AnomalyDetectionRequest(BaseModel):
    station_id: str
    data_points: List[Dict[str, Any]]
    detection_window: int = Field(24, description="检测窗口(小时)")

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    detected_anomalies: List[Dict[str, Any]]
    confidence: float
    timestamp: datetime

class BatchPredictionRequest(BaseModel):
    locations: List[LocationInput]
    prediction_types: List[str] = Field(["risk", "time_series"])

# 启动事件：加载模型
@app.on_event("startup")
async def startup_event():
    """
    应用启动时加载所有模型
    """
    global risk_model, time_series_model, route_optimizer, anomaly_detector, db_loader
    
    logger.info("正在加载ML模型...")
    
    try:
        # 初始化数据库连接
        db_loader = DatabaseLoader()
        
        # 加载风险评估模型
        risk_model = RiskAssessmentModel()
        # 这里应该加载预训练的模型
        # risk_model.load_model("path/to/trained/model")
        
        # 加载时序预测模型
        time_series_model = TimeSeriesPredictionModel()
        
        # 初始化路径优化器
        route_optimizer = RouteOptimizer()
        
        # 初始化异常检测器
        anomaly_detector = AnomalyDetector()
        
        logger.info("所有ML模型加载完成")
        
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        raise

# 健康检查
@app.get("/health")
async def health_check():
    """
    服务健康检查
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "models_loaded": {
            "risk_assessment": risk_model is not None,
            "time_series": time_series_model is not None,
            "route_optimization": route_optimizer is not None,
            "anomaly_detection": anomaly_detector is not None
        }
    }

# 风险评估API
@app.post("/api/v1/risk/assess", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    """
    实时风险评估
    """
    try:
        logger.info(f"收到风险评估请求: {request.location}")
        
        # 准备输入数据
        location_data = pd.DataFrame([{
            'latitude': request.location.latitude,
            'longitude': request.location.longitude,
            'timestamp': datetime.now()
        }])
        
        # 从数据库获取相关特征数据
        feature_data = await db_loader.get_location_features(
            request.location.latitude, 
            request.location.longitude
        )
        
        # 合并数据
        input_data = pd.concat([location_data, feature_data], axis=1)
        
        # 风险评估
        risk_probabilities = risk_model.predict_proba(input_data)
        current_risk_level = np.argmax(risk_probabilities[0]) + 1
        confidence_score = np.max(risk_probabilities[0])
        
        response_data = {
            "current_risk_level": current_risk_level,
            "confidence_score": confidence_score,
            "assessment_time": datetime.now(),
            "model_version": "1.0.0"
        }
        
        # 时序预测（如果请求）
        if request.include_predictions and time_series_model:
            predictions = await predict_time_series(request.location)
            response_data.update({
                "predicted_risk_24h": predictions.get("24h"),
                "predicted_risk_72h": predictions.get("72h")
            })
        
        # 影响因素分析（如果请求）
        if request.include_factors:
            factors = risk_model.get_feature_importance()
            response_data["contributing_factors"] = factors
        
        # 生成建议
        response_data["recommendations"] = generate_risk_recommendations(
            current_risk_level, confidence_score
        )
        
        return RiskAssessmentResponse(**response_data)
        
    except Exception as e:
        logger.error(f"风险评估失败: {e}")
        raise HTTPException(status_code=500, detail=f"风险评估失败: {str(e)}")

# 路径优化API
@app.post("/api/v1/route/optimize", response_model=RouteOptimizationResponse)
async def optimize_route(request: RouteOptimizationRequest):
    """
    智能路径优化
    """
    try:
        logger.info(f"收到路径优化请求: {request.start_location} -> {request.end_location}")
        
        # 路径优化
        optimized_route = await route_optimizer.optimize(
            start_lat=request.start_location.latitude,
            start_lng=request.start_location.longitude,
            end_lat=request.end_location.latitude,
            end_lng=request.end_location.longitude,
            optimize_for=request.optimize_for,
            constraints={
                "avoid_high_risk": request.avoid_high_risk,
                "max_risk_level": request.max_risk_level
            }
        )
        
        # 风险分析
        risk_analysis = await analyze_route_risk(optimized_route)
        
        response_data = {
            "route_id": optimized_route["route_id"],
            "total_distance": optimized_route["total_distance"],
            "estimated_time": optimized_route["estimated_time"],
            "safety_score": optimized_route["safety_score"],
            "waypoints": optimized_route["waypoints"],
            "risk_analysis": risk_analysis
        }
        
        return RouteOptimizationResponse(**response_data)
        
    except Exception as e:
        logger.error(f"路径优化失败: {e}")
        raise HTTPException(status_code=500, detail=f"路径优化失败: {str(e)}")

# 异常检测API
@app.post("/api/v1/anomaly/detect", response_model=AnomalyDetectionResponse)
async def detect_anomaly(request: AnomalyDetectionRequest):
    """
    监测数据异常检测
    """
    try:
        logger.info(f"收到异常检测请求: 站点 {request.station_id}")
        
        # 准备数据
        data_df = pd.DataFrame(request.data_points)
        
        # 异常检测
        anomaly_results = anomaly_detector.detect(
            data=data_df,
            station_id=request.station_id,
            window_hours=request.detection_window
        )
        
        response_data = {
            "is_anomaly": anomaly_results["has_anomaly"],
            "anomaly_score": anomaly_results["max_score"],
            "detected_anomalies": anomaly_results["anomalies"],
            "confidence": anomaly_results["confidence"],
            "timestamp": datetime.now()
        }
        
        return AnomalyDetectionResponse(**response_data)
        
    except Exception as e:
        logger.error(f"异常检测失败: {e}")
        raise HTTPException(status_code=500, detail=f"异常检测失败: {str(e)}")

# 批量预测API
@app.post("/api/v1/prediction/batch")
async def batch_prediction(request: BatchPredictionRequest):
    """
    批量位置预测
    """
    try:
        logger.info(f"收到批量预测请求: {len(request.locations)} 个位置")
        
        results = []
        for location in request.locations:
            location_results = {}
            
            # 风险评估
            if "risk" in request.prediction_types:
                risk_data = pd.DataFrame([{
                    'latitude': location.latitude,
                    'longitude': location.longitude,
                    'timestamp': datetime.now()
                }])
                
                feature_data = await db_loader.get_location_features(
                    location.latitude, location.longitude
                )
                
                input_data = pd.concat([risk_data, feature_data], axis=1)
                risk_proba = risk_model.predict_proba(input_data)
                
                location_results["risk"] = {
                    "level": np.argmax(risk_proba[0]) + 1,
                    "confidence": np.max(risk_proba[0]),
                    "probabilities": risk_proba[0].tolist()
                }
            
            # 时序预测
            if "time_series" in request.prediction_types:
                ts_predictions = await predict_time_series(location)
                location_results["time_series"] = ts_predictions
            
            results.append({
                "location": location.dict(),
                "predictions": location_results
            })
        
        return {
            "results": results,
            "total_locations": len(request.locations),
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"批量预测失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量预测失败: {str(e)}")

# 模型信息API
@app.get("/api/v1/models/info")
async def get_models_info():
    """
    获取模型信息
    """
    return {
        "models": {
            "risk_assessment": {
                "type": risk_model.model_type if risk_model else None,
                "version": "1.0.0",
                "features": risk_model.feature_columns if risk_model else [],
                "loaded": risk_model is not None
            },
            "time_series": {
                "type": "lstm",
                "version": "1.0.0", 
                "loaded": time_series_model is not None
            },
            "route_optimization": {
                "algorithm": "a_star_modified",
                "version": "1.0.0",
                "loaded": route_optimizer is not None
            },
            "anomaly_detection": {
                "type": "isolation_forest",
                "version": "1.0.0",
                "loaded": anomaly_detector is not None
            }
        },
        "api_version": "1.0.0",
        "timestamp": datetime.now()
    }

# 辅助函数
async def predict_time_series(location: LocationInput) -> Dict[str, int]:
    """
    时序预测辅助函数
    """
    if not time_series_model:
        return {}
    
    try:
        # 获取历史数据
        historical_data = await db_loader.get_historical_data(
            location.latitude, location.longitude, hours=24
        )
        
        # 时序预测
        predictions = time_series_model.predict(historical_data)
        
        return {
            "24h": int(predictions.get("24h", 0)),
            "72h": int(predictions.get("72h", 0))
        }
    except Exception as e:
        logger.error(f"时序预测失败: {e}")
        return {}

async def analyze_route_risk(route_data: Dict) -> Dict[str, Any]:
    """
    路径风险分析
    """
    risk_points = []
    total_risk_score = 0
    
    for waypoint in route_data.get("waypoints", []):
        # 对每个路径点进行风险评估
        point_data = pd.DataFrame([{
            'latitude': waypoint['lat'],
            'longitude': waypoint['lng'],
            'timestamp': datetime.now()
        }])
        
        try:
            risk_proba = risk_model.predict_proba(point_data)
            risk_level = np.argmax(risk_proba[0]) + 1
            risk_score = np.max(risk_proba[0])
            
            risk_points.append({
                "location": [waypoint['lat'], waypoint['lng']],
                "risk_level": risk_level,
                "risk_score": risk_score
            })
            
            total_risk_score += risk_score
            
        except Exception as e:
            logger.warning(f"路径点风险评估失败: {e}")
    
    avg_risk_score = total_risk_score / len(risk_points) if risk_points else 0
    max_risk_level = max([p["risk_level"] for p in risk_points]) if risk_points else 1
    
    return {
        "average_risk_score": avg_risk_score,
        "maximum_risk_level": max_risk_level,
        "risk_points": risk_points,
        "high_risk_segments": [p for p in risk_points if p["risk_level"] >= 4]
    }

def generate_risk_recommendations(risk_level: int, confidence: float) -> str:
    """
    生成风险建议
    """
    recommendations = {
        1: "当前风险很低，可正常活动，但请保持警惕。",
        2: "当前风险较低，建议关注天气变化和官方预警。",
        3: "当前风险中等，建议避免前往高风险区域，准备应急物品。",
        4: "当前风险较高，建议暂停户外活动，准备撤离。",
        5: "当前风险很高，建议立即撤离到安全区域。"
    }
    
    base_recommendation = recommendations.get(risk_level, "请保持警惕。")
    
    if confidence < 0.7:
        base_recommendation += " 注意：当前评估置信度较低，建议谨慎对待。"
    
    return base_recommendation

# 运行服务
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=API_CONFIG["host"],
        port=API_CONFIG["port"],
        workers=1  # 由于模型加载，使用单进程
    )