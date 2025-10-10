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

# from ...models.risk_assessment.risk_model import RiskAssessmentModel  # 需要torch，暂不使用
from ...models.risk_assessment.lightweight_model import LightweightRiskModel
from ...models.time_series.prediction_model import TimeSeriesPredictionModel
from ...models.route_optimization.route_optimizer import RouteOptimizer
from ...models.anomaly.anomaly_detector import AnomalyDetector
from ...data.loaders.database_loader import DatabaseLoader
from ...config.config import API_CONFIG

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
lightweight_risk_model = None  # 轻量级模型（无需训练）
time_series_model = None
route_optimizer = None
anomaly_detector = None
db_loader = None

# 辅助函数：将监测数据聚合为features
async def aggregate_monitoring_to_features(monitoring_data: List[Dict]) -> Dict[str, float]:
    """
    将监测站数据聚合为风险评估features
    
    按数据类型聚合，计算平均值/最大值，归一化到0-10分
    只返回有数据的features，缺失的不返回（不参与计算）
    """
    features = {}
    
    if not monitoring_data:
        logger.warning("[AGGREGATE] 没有监测数据")
        return features
    
    # 按数据类型分组
    data_by_type = {}
    for record in monitoring_data:
        data_type = record.get('data_type')
        value = float(record.get('value', 0))
        
        if data_type not in data_by_type:
            data_by_type[data_type] = []
        data_by_type[data_type].append(value)
    
    # rainfall: 降雨量（mm）→ 0-10
    if 'rainfall' in data_by_type:
        max_rainfall = max(data_by_type['rainfall'])
        features['rainfall'] = min(max_rainfall, 10)
    
    # groundwater_level: 地下水位（米）→ 水位下降=风险增加
    if 'groundwater_level' in data_by_type:
        avg_level = sum(data_by_type['groundwater_level']) / len(data_by_type['groundwater_level'])
        features['groundwater'] = max(0, 10 - avg_level / 2)
    
    # slope_displacement: 坡面位移（mm）→ 位移越大风险越高
    if 'slope_displacement' in data_by_type:
        max_disp = max(data_by_type['slope_displacement'])
        features['slope'] = min(max_disp * 2, 10)
    
    # soil_moisture: 土壤湿度（%）→ 高湿度=高风险
    if 'soil_moisture' in data_by_type:
        avg_moisture = sum(data_by_type['soil_moisture']) / len(data_by_type['soil_moisture'])
        features['soil_moisture'] = min(avg_moisture / 10, 10)
    
    # seismic_acceleration: 地震加速度
    if 'seismic_acceleration' in data_by_type:
        max_accel = max(data_by_type['seismic_acceleration'])
        features['seismic_activity'] = min(max_accel * 5, 10)
    
    # temperature: 温度
    if 'temperature' in data_by_type:
        features['temperature'] = sum(data_by_type['temperature']) / len(data_by_type['temperature'])
    
    # humidity: 湿度（%）→ 高湿度可能增加风险
    if 'humidity' in data_by_type:
        avg_humidity = sum(data_by_type['humidity']) / len(data_by_type['humidity'])
        features['humidity'] = avg_humidity
    
    # wind_speed: 风速（m/s）→ 辅助指标
    if 'wind_speed' in data_by_type:
        avg_wind = sum(data_by_type['wind_speed']) / len(data_by_type['wind_speed'])
        features['wind_speed'] = avg_wind
    
    # wind_direction: 风向（度）
    if 'wind_direction' in data_by_type:
        avg_dir = sum(data_by_type['wind_direction']) / len(data_by_type['wind_direction'])
        features['wind_direction'] = avg_dir
    
    # water_level: 水位
    if 'water_level' in data_by_type:
        avg_level = sum(data_by_type['water_level']) / len(data_by_type['water_level'])
        features['water_level'] = min(avg_level / 2, 10)  # 高水位=风险
    
    logger.info(f"[AGGREGATE] {len(data_by_type)}种数据类型 → {len(features)}个features: {list(features.keys())}")
    return features

# Pydantic模型定义
class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="纬度")
    longitude: float = Field(..., ge=-180, le=180, description="经度")

class RiskAssessmentRequest(BaseModel):
    zone_id: int
    features: Dict[str, Optional[float]]
    disaster_type_id: int
    include_predictions: bool = Field(True, description="是否包含时序预测")
    include_factors: bool = Field(True, description="是否包含影响因素分析")

class RiskAssessmentResponse(BaseModel):
    """完全匹配Backend MLPredictionResponse的响应格式"""
    risk_score: float = Field(..., description="风险分数 0-1")
    risk_level: int = Field(..., ge=1, le=5, description="风险等级 1-5")
    confidence: float = Field(..., ge=0, le=1, description="置信度")
    predicted_24h: int = Field(..., ge=1, le=5, description="24小时预测")
    predicted_72h: int = Field(..., ge=1, le=5, description="72小时预测")
    feature_importance: Optional[Dict[str, float]] = Field(None, description="特征重要性")
    model_version: Optional[str] = Field("1.0.0-ML", description="模型版本")

class RouteOptimizationRequest(BaseModel):
    start_location: LocationInput
    end_location: LocationInput
    optimize_for: str = Field("safety", pattern="^(safety|time|distance)$")
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
    应用启动时加载所有模型和初始化数据库
    """
    global risk_model, lightweight_risk_model, time_series_model, route_optimizer, anomaly_detector, db_loader
    
    logger.info("正在加载ML模型和初始化数据库...")
    
    try:
        # 初始化数据库连接
        db_loader = DatabaseLoader()
        await db_loader.connect()
        logger.info("✓ 数据库连接初始化完成")
        
        # 加载轻量级风险模型（基于模拟训练，无需真实数据）
        logger.info("开始加载轻量级风险模型...")
        lightweight_risk_model = LightweightRiskModel()
        logger.info(f"✓ 轻量级风险模型已加载（随机森林，模拟训练1000样本）")
        logger.info(f"  模型参数: n_estimators=50, max_depth=8")
        logger.info(f"  特征数量: {len(lightweight_risk_model.feature_names)}")
        
        # 加载完整风险评估模型（可选，需要真实训练数据）
        # risk_model = RiskAssessmentModel()
        # risk_model.load_model("models/risk_assessment_v1.pkl")
        
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

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    global db_loader
    if db_loader:
        await db_loader.close()
        logger.info("数据库连接已关闭")

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

# 风险评估API（优化版：基于zone_id获取监测数据）
@app.post("/api/v1/predict/risk", response_model=RiskAssessmentResponse)
async def predict_risk(request: RiskAssessmentRequest):
    """
    实时风险评估 - 基于风险区域内的监测站数据进行评估
    
    业务流程：
    1. 根据zone_id查询该区域内的监测站
    2. 获取这些监测站最近24小时的监测数据
    3. 按数据类型聚合（rainfall, groundwater_level等）
    4. 输入ML模型进行风险预测
    5. 返回风险评分和等级
    """
    try:
        logger.info(f"[RISK-PREDICT] 评估风险区域 zone_id={request.zone_id}")
        
        # 1. 从数据库获取该区域内的监测站数据（按zone_id关联）
        zone_monitoring_data = await db_loader.get_zone_monitoring_data(request.zone_id, hours=24)
        
        # 2. 如果没有监测数据，使用Backend提供的features（降级方案）
        if not zone_monitoring_data or len(zone_monitoring_data) == 0:
            logger.warning(f"[RISK-PREDICT] 风险区域{request.zone_id}无监测数据，使用提供的features")
            features = request.features
        else:
            # 3. 聚合监测数据计算features
            logger.info(f"[RISK-PREDICT] 找到{len(zone_monitoring_data)}条监测数据")
            features = await aggregate_monitoring_to_features(zone_monitoring_data)
            logger.info(f"[RISK-PREDICT] 聚合后的features: {features}")
        
        # 4. 使用features进行风险评估（合并Backend提供的静态数据）
        final_features = {**request.features, **features} # 监测数据优先
        
        # 5. 使用轻量级ML模型预测（随机森林）
        if lightweight_risk_model:
            logger.info(f"[PREDICT] 使用轻量级随机森林模型，输入features: {list(final_features.keys())}")
            prediction = lightweight_risk_model.predict(final_features)
            
            current_risk_level = prediction['risk_level']
            risk_score = (current_risk_level - 1) / 4  # 转换为0-1
            confidence_score = prediction['confidence']
            feature_importance = prediction.get('feature_importance', {})
            valid_features = prediction.get('valid_features', 0)
            feature_completeness = prediction.get('feature_completeness', 0)
            
            logger.info(f"[PREDICT] 有效特征: {valid_features}/7, 完整度: {feature_completeness:.1%}")
            logger.info(f"[PREDICT] ML模型预测: 等级{current_risk_level}, 置信度{confidence_score:.2f}")
        else:
            # 降级方案：使用简单加权算法
            logger.warning("[PREDICT] 轻量级模型未加载，使用基于规则的算法")
            risk_score = (
                (final_features.get('rainfall', 0) or 0) * 0.25 +
                (final_features.get('groundwater', 0) or 0) * 0.15 +
                (final_features.get('slope', 0) or 0) * 0.20 +
                (final_features.get('soil_moisture', 0) or 0) * 0.15 +
                (final_features.get('seismic_activity', 0) or 0) * 0.10 +
                (final_features.get('population_density', 0) or 0) / 1000 * 0.10 +
                (final_features.get('temperature', 30) or 30) / 50 * 0.05
            ) / 10
            
            # 转换为风险等级
            if risk_score < 0.2:
                current_risk_level = 1
            elif risk_score < 0.4:
                current_risk_level = 2
            elif risk_score < 0.6:
                current_risk_level = 3
            elif risk_score < 0.8:
                current_risk_level = 4
            else:
                current_risk_level = 5
            
            confidence_score = 0.75
            feature_importance = {}
        
        # 构建响应数据 - 完全匹配Backend期望的格式
        # feature_importance返回真实的聚合features（用于前端显示）
        display_features = {k: float(v or 0) for k, v in final_features.items() if v is not None}
        
        response_data = {
            "risk_score": risk_score,
            "risk_level": current_risk_level,
            "confidence": confidence_score,
            "predicted_24h": min(current_risk_level + 1, 5),
            "predicted_72h": min(current_risk_level + 2, 5),
            "feature_importance": display_features,  # 真实监测数据（用于前端显示）
            "model_version": "1.0.0-RandomForest" if lightweight_risk_model else "1.0.0-Rule"
        }
        
        logger.info(f"✅ ML模型预测完成: risk_level={current_risk_level}, confidence={confidence_score:.2f}")
        return RiskAssessmentResponse(**response_data)
        
    except Exception as e:
        logger.error(f"风险评估失败: {e}")
        raise HTTPException(status_code=500, detail=f"风险评估失败: {str(e)}")

# 路径优化API
@app.post("/api/v1/optimize/route", response_model=RouteOptimizationResponse)
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
@app.post("/api/v1/detect/anomaly", response_model=AnomalyDetectionResponse)
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
@app.post("/api/v1/predict/risk/batch")
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