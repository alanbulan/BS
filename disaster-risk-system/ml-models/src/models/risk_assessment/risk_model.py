"""
地质灾害风险评估模型
基于多因子融合的机器学习模型，支持实时风险评估和预测
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
import joblib
import logging
from pathlib import Path
from datetime import datetime, timedelta

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import torch
import torch.nn as nn
import torch.optim as optim

from ...config.config import RISK_ASSESSMENT_CONFIG, MODELS_ROOT
from ...data.preprocessing.feature_engineering import FeatureEngineer
from ...utils.spatial.spatial_utils import SpatialProcessor
from ...utils.metrics.model_metrics import ModelEvaluator

logger = logging.getLogger(__name__)

class RiskNeuralNetwork(nn.Module):
    """
    深度神经网络风险评估模型
    """
    def __init__(self, input_dim: int, hidden_layers: List[int], num_classes: int = 5, dropout_rate: float = 0.3):
        super(RiskNeuralNetwork, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        for hidden_dim in hidden_layers:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.BatchNorm1d(hidden_dim)
            ])
            prev_dim = hidden_dim
        
        layers.append(nn.Linear(prev_dim, num_classes))
        layers.append(nn.Softmax(dim=1))
        
        self.model = nn.Sequential(*layers)
    
    def forward(self, x):
        return self.model(x)

class RiskAssessmentModel:
    """
    风险评估模型主类
    支持多种算法：集成学习、深度学习、传统机器学习
    """
    
    def __init__(self, model_type: str = "ensemble", config: Dict = None):
        self.model_type = model_type
        self.config = config or RISK_ASSESSMENT_CONFIG
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_engineer = FeatureEngineer()
        self.spatial_processor = SpatialProcessor()
        self.evaluator = ModelEvaluator()
        
        # 特征列名
        self.feature_columns = self.config["feature_columns"]
        self.target_column = self.config["target_column"]
        
        # 模型保存路径
        self.model_path = MODELS_ROOT / "risk_assessment"
        self.model_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"初始化风险评估模型: {model_type}")
    
    def _create_model(self, input_dim: int) -> Any:
        """
        根据配置创建模型
        """
        if self.model_type == "ensemble":
            return self._create_ensemble_model()
        elif self.model_type == "deep_neural_network":
            return self._create_neural_network(input_dim)
        elif self.model_type == "random_forest":
            return self._create_random_forest()
        else:
            raise ValueError(f"不支持的模型类型: {self.model_type}")
    
    def _create_ensemble_model(self) -> Dict:
        """
        创建集成学习模型
        """
        base_models = {
            "random_forest": RandomForestClassifier(
                **self.config["model_params"]["random_forest"],
                random_state=42
            ),
            "gradient_boosting": GradientBoostingClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            ),
            "neural_network": MLPClassifier(
                hidden_layer_sizes=(100, 50),
                max_iter=500,
                random_state=42
            )
        }
        
        meta_model = LogisticRegression(random_state=42)
        
        return {
            "base_models": base_models,
            "meta_model": meta_model,
            "type": "ensemble"
        }
    
    def _create_neural_network(self, input_dim: int) -> RiskNeuralNetwork:
        """
        创建深度神经网络模型
        """
        params = self.config["model_params"]["neural_network"]
        return RiskNeuralNetwork(
            input_dim=input_dim,
            hidden_layers=params["hidden_layers"],
            dropout_rate=params["dropout_rate"]
        )
    
    def _create_random_forest(self) -> RandomForestClassifier:
        """
        创建随机森林模型
        """
        return RandomForestClassifier(
            **self.config["model_params"]["random_forest"],
            random_state=42
        )
    
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        数据预处理和特征工程
        """
        logger.info("开始数据预处理...")
        
        # 特征工程
        data = self.feature_engineer.create_features(data)
        
        # 空间特征处理
        if 'latitude' in data.columns and 'longitude' in data.columns:
            spatial_features = self.spatial_processor.extract_spatial_features(
                data[['latitude', 'longitude']].values
            )
            data = pd.concat([data, spatial_features], axis=1)
        
        # 选择特征列
        available_features = [col for col in self.feature_columns if col in data.columns]
        if len(available_features) != len(self.feature_columns):
            missing_features = set(self.feature_columns) - set(available_features)
            logger.warning(f"缺少特征列: {missing_features}")
        
        X = data[available_features].fillna(0)
        y = data[self.target_column] if self.target_column in data.columns else None
        
        # 标准化
        X_scaled = self.scaler.fit_transform(X)
        
        # 标签编码
        if y is not None:
            y_encoded = self.label_encoder.fit_transform(y)
            return X_scaled, y_encoded
        
        return X_scaled, None
    
    def train(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        训练模型
        """
        logger.info("开始训练风险评估模型...")
        start_time = datetime.now()
        
        # 数据预处理
        X, y = self.preprocess_data(data)
        
        # 训练验证分割
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=self.config["training_config"]["test_size"],
            random_state=self.config["training_config"]["random_state"],
            stratify=y if self.config["training_config"]["stratify"] else None
        )
        
        # 创建模型
        self.model = self._create_model(X.shape[1])
        
        # 训练模型
        if self.model_type == "ensemble":
            metrics = self._train_ensemble(X_train, X_test, y_train, y_test)
        elif self.model_type == "deep_neural_network":
            metrics = self._train_neural_network(X_train, X_test, y_train, y_test)
        else:
            self.model.fit(X_train, y_train)
            metrics = self._evaluate_model(X_test, y_test)
        
        # 计算训练时间
        training_time = (datetime.now() - start_time).total_seconds()
        metrics["training_time"] = training_time
        
        logger.info(f"模型训练完成，用时: {training_time:.2f}秒")
        logger.info(f"模型性能: {metrics}")
        
        return metrics
    
    def _train_ensemble(self, X_train, X_test, y_train, y_test) -> Dict[str, Any]:
        """
        训练集成学习模型
        """
        base_models = self.model["base_models"]
        meta_model = self.model["meta_model"]
        
        # 训练基础模型
        logger.info("训练基础模型...")
        base_predictions_train = np.zeros((X_train.shape[0], len(base_models)))
        base_predictions_test = np.zeros((X_test.shape[0], len(base_models)))
        
        for i, (name, model) in enumerate(base_models.items()):
            logger.info(f"训练 {name}...")
            model.fit(X_train, y_train)
            base_predictions_train[:, i] = model.predict_proba(X_train)[:, 1] if hasattr(model, 'predict_proba') else model.predict(X_train)
            base_predictions_test[:, i] = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else model.predict(X_test)
        
        # 训练元模型
        logger.info("训练元学习器...")
        meta_model.fit(base_predictions_train, y_train)
        
        # 评估
        final_predictions = meta_model.predict(base_predictions_test)
        metrics = self.evaluator.calculate_classification_metrics(y_test, final_predictions)
        
        return metrics
    
    def _train_neural_network(self, X_train, X_test, y_train, y_test) -> Dict[str, Any]:
        """
        训练深度神经网络
        """
        params = self.config["model_params"]["neural_network"]
        
        # 转换为torch张量
        X_train_tensor = torch.FloatTensor(X_train)
        X_test_tensor = torch.FloatTensor(X_test)
        y_train_tensor = torch.LongTensor(y_train)
        y_test_tensor = torch.LongTensor(y_test)
        
        # 定义损失函数和优化器
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=params["learning_rate"])
        
        # 训练循环
        self.model.train()
        best_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(params["epochs"]):
            # 前向传播
            outputs = self.model(X_train_tensor)
            loss = criterion(outputs, y_train_tensor)
            
            # 反向传播
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            # 验证
            if epoch % 10 == 0:
                self.model.eval()
                with torch.no_grad():
                    val_outputs = self.model(X_test_tensor)
                    val_loss = criterion(val_outputs, y_test_tensor)
                    
                    if val_loss < best_loss:
                        best_loss = val_loss
                        patience_counter = 0
                    else:
                        patience_counter += 1
                    
                    if patience_counter >= params["early_stopping_patience"]:
                        logger.info(f"早停止于epoch {epoch}")
                        break
                
                self.model.train()
                logger.info(f"Epoch {epoch}, Loss: {loss.item():.4f}, Val Loss: {val_loss.item():.4f}")
        
        # 最终评估
        self.model.eval()
        with torch.no_grad():
            test_outputs = self.model(X_test_tensor)
            predictions = torch.argmax(test_outputs, dim=1).numpy()
        
        metrics = self.evaluator.calculate_classification_metrics(y_test, predictions)
        return metrics
    
    def _evaluate_model(self, X_test, y_test) -> Dict[str, Any]:
        """
        评估模型性能
        """
        predictions = self.model.predict(X_test)
        return self.evaluator.calculate_classification_metrics(y_test, predictions)
    
    def predict(self, data: pd.DataFrame) -> np.ndarray:
        """
        预测风险等级
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先调用train方法")
        
        # 预处理数据
        X, _ = self.preprocess_data(data)
        
        # 预测
        if self.model_type == "ensemble":
            return self._predict_ensemble(X)
        elif self.model_type == "deep_neural_network":
            return self._predict_neural_network(X)
        else:
            return self.model.predict(X)
    
    def predict_proba(self, data: pd.DataFrame) -> np.ndarray:
        """
        预测各等级概率
        """
        if self.model is None:
            raise ValueError("模型尚未训练")
        
        X, _ = self.preprocess_data(data)
        
        if self.model_type == "ensemble":
            return self._predict_proba_ensemble(X)
        elif self.model_type == "deep_neural_network":
            return self._predict_proba_neural_network(X)
        else:
            return self.model.predict_proba(X)
    
    def _predict_ensemble(self, X) -> np.ndarray:
        """
        集成模型预测
        """
        base_models = self.model["base_models"]
        meta_model = self.model["meta_model"]
        
        base_predictions = np.zeros((X.shape[0], len(base_models)))
        for i, model in enumerate(base_models.values()):
            base_predictions[:, i] = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else model.predict(X)
        
        return meta_model.predict(base_predictions)
    
    def _predict_proba_ensemble(self, X) -> np.ndarray:
        """
        集成模型概率预测
        """
        base_models = self.model["base_models"]
        meta_model = self.model["meta_model"]
        
        base_predictions = np.zeros((X.shape[0], len(base_models)))
        for i, model in enumerate(base_models.values()):
            base_predictions[:, i] = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else model.predict(X)
        
        return meta_model.predict_proba(base_predictions)
    
    def _predict_neural_network(self, X) -> np.ndarray:
        """
        神经网络预测
        """
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X)
            outputs = self.model(X_tensor)
            predictions = torch.argmax(outputs, dim=1).numpy()
        return predictions
    
    def _predict_proba_neural_network(self, X) -> np.ndarray:
        """
        神经网络概率预测
        """
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X)
            outputs = self.model(X_tensor)
        return outputs.numpy()
    
    def save_model(self, version: str = None) -> str:
        """
        保存模型
        """
        if version is None:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        model_file = self.model_path / f"risk_model_{version}.pkl"
        
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "label_encoder": self.label_encoder,
            "feature_columns": self.feature_columns,
            "model_type": self.model_type,
            "config": self.config,
            "version": version,
            "created_at": datetime.now().isoformat()
        }
        
        joblib.dump(model_data, model_file)
        logger.info(f"模型已保存到: {model_file}")
        
        return str(model_file)
    
    def load_model(self, model_file: str) -> None:
        """
        加载模型
        """
        model_data = joblib.load(model_file)
        
        self.model = model_data["model"]
        self.scaler = model_data["scaler"]
        self.label_encoder = model_data["label_encoder"]
        self.feature_columns = model_data["feature_columns"]
        self.model_type = model_data["model_type"]
        self.config = model_data["config"]
        
        logger.info(f"模型已从 {model_file} 加载")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        获取特征重要性
        """
        if self.model is None:
            raise ValueError("模型尚未训练")
        
        if self.model_type == "ensemble":
            # 对于集成模型，计算平均重要性
            importance_dict = {}
            base_models = self.model["base_models"]
            
            for name, model in base_models.items():
                if hasattr(model, 'feature_importances_'):
                    for i, importance in enumerate(model.feature_importances_):
                        feature_name = self.feature_columns[i]
                        if feature_name not in importance_dict:
                            importance_dict[feature_name] = []
                        importance_dict[feature_name].append(importance)
            
            # 计算平均重要性
            avg_importance = {
                feature: np.mean(importances) 
                for feature, importances in importance_dict.items()
            }
            return avg_importance
        
        elif hasattr(self.model, 'feature_importances_'):
            return dict(zip(self.feature_columns, self.model.feature_importances_))
        
        else:
            logger.warning(f"模型类型 {self.model_type} 不支持特征重要性计算")
            return {}