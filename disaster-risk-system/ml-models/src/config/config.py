"""
机器学习模块主配置文件
包含所有模型和服务的核心配置
"""

import os
from pathlib import Path
from typing import Dict, Any, List
import yaml

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
DATA_ROOT = PROJECT_ROOT / "data"
MODELS_ROOT = PROJECT_ROOT / "models"
LOGS_ROOT = PROJECT_ROOT / "logs"

# 数据库配置
DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "disaster_risk_db"),
    "username": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "pool_size": 10,
    "max_overflow": 20
}

# Redis配置（用于缓存和任务队列）
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": int(os.getenv("REDIS_PORT", 6379)),
    "db": int(os.getenv("REDIS_DB", 0)),
    "password": os.getenv("REDIS_PASSWORD", None)
}

# 风险评估模型配置
RISK_ASSESSMENT_CONFIG = {
    "model_type": "ensemble",  # ensemble, deep_neural_network, random_forest
    "feature_columns": [
        "elevation_avg", "slope_avg", "population_density",
        "rainfall_24h", "temperature", "humidity",
        "geological_structure_type", "land_use_type",
        "distance_to_fault", "historical_disaster_count"
    ],
    "target_column": "risk_level",
    "model_params": {
        "ensemble": {
            "base_models": ["random_forest", "gradient_boosting", "neural_network"],
            "meta_model": "logistic_regression",
            "cv_folds": 5
        },
        "neural_network": {
            "hidden_layers": [128, 64, 32],
            "dropout_rate": 0.3,
            "learning_rate": 0.001,
            "batch_size": 32,
            "epochs": 100,
            "early_stopping_patience": 10
        },
        "random_forest": {
            "n_estimators": 100,
            "max_depth": 10,
            "min_samples_split": 5,
            "min_samples_leaf": 2
        }
    },
    "training_config": {
        "test_size": 0.2,
        "validation_size": 0.1,
        "random_state": 42,
        "stratify": True
    }
}

# 时序预测模型配置
TIME_SERIES_CONFIG = {
    "model_type": "lstm",  # lstm, transformer, prophet
    "sequence_length": 24,  # 使用过去24小时数据
    "prediction_horizon": [24, 72],  # 预测24小时和72小时
    "features": [
        "rainfall", "temperature", "humidity", "wind_speed",
        "groundwater_level", "slope_displacement"
    ],
    "model_params": {
        "lstm": {
            "hidden_size": 64,
            "num_layers": 2,
            "dropout": 0.2,
            "bidirectional": True
        },
        "transformer": {
            "d_model": 128,
            "nhead": 8,
            "num_encoder_layers": 6,
            "dim_feedforward": 512
        }
    }
}

# 路径优化配置
ROUTE_OPTIMIZATION_CONFIG = {
    "algorithm": "a_star_modified",  # a_star_modified, dijkstra, genetic_algorithm
    "cost_factors": {
        "distance": 0.3,
        "risk": 0.4,
        "time": 0.2,
        "accessibility": 0.1
    },
    "constraints": {
        "max_risk_level": 4,
        "max_slope": 30,  # 度
        "min_road_width": 2.0,  # 米
        "avoid_flood_zones": True
    },
    "optimization_params": {
        "max_iterations": 1000,
        "convergence_threshold": 0.001,
        "population_size": 100  # 用于遗传算法
    }
}

# 异常检测配置
ANOMALY_DETECTION_CONFIG = {
    "model_type": "isolation_forest",  # isolation_forest, one_class_svm, autoencoder
    "detection_threshold": 0.1,  # 异常分数阈值
    "features": [
        "rainfall_rate", "temperature_change", "groundwater_change",
        "slope_displacement_rate", "seismic_activity"
    ],
    "model_params": {
        "isolation_forest": {
            "n_estimators": 100,
            "contamination": 0.1,
            "random_state": 42
        },
        "autoencoder": {
            "encoding_dim": 16,
            "hidden_layers": [64, 32],
            "epochs": 50,
            "batch_size": 32
        }
    }
}

# 数据处理配置
DATA_PROCESSING_CONFIG = {
    "spatial_resolution": 100,  # 米
    "temporal_resolution": 3600,  # 秒（1小时）
    "interpolation_method": "kriging",  # kriging, idw, spline
    "outlier_detection": {
        "method": "iqr",  # iqr, zscore, isolation_forest
        "threshold": 3.0
    },
    "feature_engineering": {
        "create_time_features": True,
        "create_spatial_features": True,
        "create_lag_features": True,
        "lag_periods": [1, 3, 6, 12, 24]  # 小时
    }
}

# API服务配置
API_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "workers": 4,
    "max_requests": 1000,
    "max_requests_jitter": 100,
    "timeout": 300,
    "keepalive": 2
}

# 训练调度配置
TRAINING_SCHEDULE = {
    "risk_assessment": {
        "frequency": "daily",  # daily, weekly, monthly
        "time": "02:00",
        "enabled": True,
        "retrain_threshold": 0.1  # 性能下降阈值
    },
    "time_series": {
        "frequency": "weekly",
        "time": "03:00",
        "enabled": True
    },
    "anomaly_detection": {
        "frequency": "daily",
        "time": "01:00",
        "enabled": True
    }
}

# 模型性能监控配置
MONITORING_CONFIG = {
    "metrics": {
        "risk_assessment": ["accuracy", "precision", "recall", "f1_score", "auc"],
        "time_series": ["mse", "mae", "mape", "rmse"],
        "anomaly_detection": ["precision", "recall", "f1_score"]
    },
    "alert_thresholds": {
        "accuracy_drop": 0.1,
        "prediction_error_increase": 0.2,
        "data_drift_score": 0.3
    },
    "storage": {
        "metrics_retention_days": 90,
        "model_retention_versions": 10
    }
}

# 日志配置
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        },
        "detailed": {
            "format": "%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s"
        }
    },
    "handlers": {
        "default": {
            "level": "INFO",
            "formatter": "standard",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "level": "DEBUG",
            "formatter": "detailed",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(LOGS_ROOT / "ml_service.log"),
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    },
    "loggers": {
        "": {
            "handlers": ["default", "file"],
            "level": "DEBUG",
            "propagate": False
        }
    }
}

def load_config(config_file: str = None) -> Dict[str, Any]:
    """
    加载配置文件，支持环境变量覆盖
    """
    config = {
        "database": DATABASE_CONFIG,
        "redis": REDIS_CONFIG,
        "risk_assessment": RISK_ASSESSMENT_CONFIG,
        "time_series": TIME_SERIES_CONFIG,
        "route_optimization": ROUTE_OPTIMIZATION_CONFIG,
        "anomaly_detection": ANOMALY_DETECTION_CONFIG,
        "data_processing": DATA_PROCESSING_CONFIG,
        "api": API_CONFIG,
        "training_schedule": TRAINING_SCHEDULE,
        "monitoring": MONITORING_CONFIG,
        "logging": LOGGING_CONFIG
    }
    
    # 如果提供了配置文件，从文件加载覆盖默认配置
    if config_file and os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            file_config = yaml.safe_load(f)
            config.update(file_config)
    
    return config

def get_model_config(model_name: str) -> Dict[str, Any]:
    """
    获取特定模型的配置
    """
    config = load_config()
    return config.get(model_name, {})

def create_directories():
    """
    创建必要的目录结构
    """
    directories = [
        DATA_ROOT / "raw",
        DATA_ROOT / "processed",
        DATA_ROOT / "external",
        MODELS_ROOT / "risk_assessment",
        MODELS_ROOT / "time_series", 
        MODELS_ROOT / "route_optimization",
        MODELS_ROOT / "anomaly_detection",
        LOGS_ROOT
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    create_directories()
    print("ML模块配置初始化完成")