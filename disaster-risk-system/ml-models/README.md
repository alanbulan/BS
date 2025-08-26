# 地质灾害风险评估ML模块

基于多源地理数据融合的智能化地质灾害风险评估与预测系统的机器学习核心模块。

## 功能特性

### 🎯 核心功能
- **多维风险评估**: 融合地形、地质、气象、人口密度等多源数据的风险评估模型
- **时空预测**: 基于LSTM/Transformer的24小时/72小时风险预测
- **智能路径规划**: 考虑实时风险的最优逃生路径算法
- **异常检测**: 监测数据异常自动识别和预警
- **实时推理**: 毫秒级响应的实时风险评估服务

### 🔧 技术特点
- **集成学习**: 结合随机森林、梯度提升、神经网络的集成模型
- **深度学习**: PyTorch实现的自定义神经网络架构
- **空间分析**: 基于PostGIS的地理空间数据处理
- **高性能**: 异步API服务，支持批量和流式处理
- **可扩展**: 模块化设计，易于添加新的模型和算法

## 项目结构

```
ml-models/
├── src/
│   ├── config/                 # 配置管理
│   │   └── config.py          # 主配置文件
│   ├── models/                # 模型定义
│   │   ├── risk_assessment/   # 风险评估模型
│   │   ├── time_series/       # 时序预测模型
│   │   ├── route_optimization/# 路径优化算法
│   │   └── anomaly_detection/ # 异常检测模型
│   ├── data/                  # 数据处理
│   │   ├── preprocessing/     # 数据预处理
│   │   ├── feature_engineering/# 特征工程
│   │   └── loaders/          # 数据加载器
│   ├── training/              # 训练管道
│   │   ├── pipelines/        # 训练流水线
│   │   ├── experiments/      # 实验管理
│   │   └── schedulers/       # 定时训练
│   ├── inference/             # 推理服务
│   │   ├── api/              # FastAPI接口
│   │   ├── batch/            # 批量推理
│   │   └── streaming/        # 流式推理
│   └── utils/                 # 工具函数
│       ├── spatial/          # 空间数据处理
│       ├── metrics/          # 评估指标
│       └── visualization/    # 数据可视化
├── data/                      # 数据文件
│   ├── raw/                  # 原始数据
│   ├── processed/            # 处理后数据
│   └── external/             # 外部数据源
├── models/                    # 训练好的模型
├── experiments/               # 实验结果
├── notebooks/                 # Jupyter notebooks
├── tests/                     # 测试文件
├── docker/                    # Docker配置
├── requirements.txt           # Python依赖
├── Dockerfile                 # Docker构建文件
└── main.py                   # 主启动脚本
```

## 快速开始

### 环境安装

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 系统检查

```bash
# 检查系统环境和依赖
python main.py check
```

### 数据库初始化

```bash
# 初始化数据库连接和表结构
python main.py init-db
```

### 启动API服务

```bash
# 启动ML API服务
python main.py serve

# 自定义端口启动
python main.py serve --host 0.0.0.0 --port 8080
```

### 模型训练

```bash
# 训练所有模型
python main.py train --model all

# 训练特定模型
python main.py train --model risk        # 风险评估模型
python main.py train --model timeseries  # 时序预测模型
python main.py train --model anomaly     # 异常检测模型
```

### 批量推理

```bash
# 批量处理
python main.py batch --input data/input.csv --output data/output.csv
```

## API接口

### 健康检查
```
GET /health
```

### 风险评估
```
POST /api/v1/risk/assess
Content-Type: application/json

{
  "location": {
    "latitude": 30.2741,
    "longitude": 120.1551
  },
  "include_predictions": true,
  "include_factors": true
}
```

### 路径优化
```
POST /api/v1/route/optimize
Content-Type: application/json

{
  "start_location": {
    "latitude": 30.2741,
    "longitude": 120.1551
  },
  "end_location": {
    "latitude": 30.2841,
    "longitude": 120.1651
  },
  "optimize_for": "safety",
  "avoid_high_risk": true,
  "max_risk_level": 4
}
```

### 异常检测
```
POST /api/v1/anomaly/detect
Content-Type: application/json

{
  "station_id": "ST001",
  "data_points": [
    {
      "timestamp": "2024-01-01T12:00:00",
      "rainfall": 10.5,
      "temperature": 25.3,
      "humidity": 78.2
    }
  ],
  "detection_window": 24
}
```

### 批量预测
```
POST /api/v1/prediction/batch
Content-Type: application/json

{
  "locations": [
    {"latitude": 30.2741, "longitude": 120.1551},
    {"latitude": 30.2841, "longitude": 120.1651}
  ],
  "prediction_types": ["risk", "time_series"]
}
```

## Docker部署

### 构建镜像
```bash
docker build -t disaster-risk-ml:latest .
```

### 运行容器
```bash
docker run -d \
  --name disaster-risk-ml \
  -p 8000:8000 \
  -e DB_HOST=your_db_host \
  -e DB_PASSWORD=your_db_password \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  disaster-risk-ml:latest
```

### 使用Docker Compose
```yaml
version: '3.8'

services:
  ml-service:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=password
      - REDIS_HOST=redis
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgis/postgis:15-3.3
    environment:
      - POSTGRES_DB=disaster_risk_db
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 模型架构

### 风险评估模型
- **输入特征**: 地形、地质、气象、人文、历史、实时监测数据
- **模型架构**: 集成学习（随机森林 + 梯度提升 + 神经网络）
- **输出**: 5级风险等级 + 置信度 + 影响因素权重

### 时序预测模型
- **输入**: 过去24小时的监测时序数据
- **架构**: 双向LSTM + 注意力机制
- **输出**: 24小时和72小时风险趋势预测

### 路径优化算法
- **算法**: 改进的A*算法
- **成本函数**: 距离(30%) + 风险(40%) + 时间(20%) + 可达性(10%)
- **约束**: 最大风险等级、坡度限制、道路宽度等

### 异常检测模型
- **算法**: 孤立森林 + 自编码器
- **特征**: 降雨率、温度变化、地下水位变化、坡体位移等
- **输出**: 异常分数 + 异常类型 + 置信度

## 性能指标

### 风险评估模型
- **准确率**: > 85%
- **召回率**: > 90% (高风险等级)
- **响应时间**: < 100ms
- **置信度**: 平均 > 75%

### 时序预测模型  
- **MAPE**: < 15%
- **RMSE**: < 0.5 (归一化)
- **预测准确率**: > 80% (24h), > 70% (72h)

### 路径优化
- **计算时间**: < 2s (10km路径)
- **安全性评分**: > 85%
- **路径合理性**: > 90%

## 配置说明

主要配置在 `src/config/config.py` 中：

```python
# 风险评估模型配置
RISK_ASSESSMENT_CONFIG = {
    "model_type": "ensemble",
    "feature_columns": [...],
    "model_params": {...}
}

# 时序预测配置
TIME_SERIES_CONFIG = {
    "model_type": "lstm",
    "sequence_length": 24,
    "prediction_horizon": [24, 72]
}

# 数据库配置
DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "disaster_risk_db"
}
```

## 监控与运维

### 性能监控
- 模型准确率监控
- API响应时间监控  
- 资源使用率监控
- 数据漂移检测

### 日志管理
- 结构化日志记录
- 错误自动报警
- 性能指标收集

### 模型更新
- 定时重训练
- A/B测试部署
- 模型版本管理

## 开发指南

### 添加新模型

1. 在 `src/models/` 下创建新模块
2. 实现训练和推理接口
3. 在配置文件中添加参数
4. 更新API接口
5. 添加测试用例

### 数据处理流程

1. 原始数据验证和清洗
2. 特征工程和标准化
3. 空间数据处理和投影
4. 时序数据对齐和插值
5. 训练/验证/测试集分割

### 测试

```bash
# 运行所有测试
pytest tests/

# 运行特定测试
pytest tests/test_risk_model.py

# 生成覆盖率报告
pytest --cov=src tests/
```

## 许可证

本项目基于MIT许可证开源。

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

- 项目负责人: [Your Name]
- 邮箱: [your.email@example.com]
- 文档: [project-docs-url]