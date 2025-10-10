# 机器学习模块 - ML-Models

**智能化地质灾害风险评估系统的机器学习核心**

---

## 🎯 这个模块是干什么的？

ML模块是整个灾害风险评估系统的**智能大脑**，负责：

1. **分析监测站数据** → 预测风险等级
2. **时序数据预测** → 预测未来24小时/72小时风险
3. **异常检测** → 发现传感器异常和灾害前兆

**简单说**：把监测站的数值（温度、降雨、坡面位移等）→ 转换为风险等级（1-5级）

---

## 🔄 与其他模块的关系

### 完整的系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层                                │
│  ┌──────────────┐              ┌─────────────┐             │
│  │ Web管理端    │              │ 移动端App    │             │
│  │ (Vue3)       │              │ (React Native)│             │
│  └──────┬───────┘              └──────┬───────┘             │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          └──────────┬───────────────────┘
                     │ HTTP/REST API
          ┌──────────▼──────────┐
          │   Backend服务       │ ← 你的Node.js后端
          │   (Node.js/Express) │
          │   端口: 3000        │
          └──┬──────────────┬───┘
             │              │
    ┌────────▼────┐    ┌───▼────────┐
    │ PostgreSQL  │    │ ML模块     │ ← 这个模块！
    │ (数据库)    │    │ (Python)   │
    │ 端口: 5432  │    │ 端口: 8000 │
    └─────────────┘    └────────────┘
         ↑                    ↑
         │ 查询               │ 调用ML API
         │                    │
    监测数据表          风险预测结果
```

### 工作流程

```
1. 监测站生成数据
   ↓ 保存到
2. PostgreSQL数据库 (monitoring_data表)
   ↓ 后端查询
3. Node.js Backend (RiskAssessmentService)
   ↓ HTTP请求
4. ML模块 (Python FastAPI) ← 这里！
   ↓ 返回预测
5. Backend保存结果 (risk_assessments表)
   ↓ 展示
6. Web管理端 / 移动端 (风险评估可视化)
```

---

## 🚫 **不需要额外的GUI！**

**ML模块只是一个后端服务**，通过HTTP API与其他模块通信：

- ❌ **不需要**：单独的GUI界面
- ❌ **不需要**：Jupyter Notebook界面（仅开发调试用）
- ✅ **只需要**：启动FastAPI服务，监听8000端口

**用户永远看不到ML模块**，它在后台默默工作！

用户看到的是：
- 🌐 **Web管理端**（Vue3）：风险评估页面显示预测结果
- 📱 **移动端**（React Native）：查看风险区域和预警

---

## 📡 ML模块提供的API（供Backend调用）

### 1. 风险评估 API
```http
POST http://localhost:8000/api/v1/predict/risk

请求（Backend发送）:
{
  "zone_id": 2,
  "features": {
    "rainfall": 6.5,
    "slope": 3.2,
    ...
  },
  "disaster_type_id": 1
}

响应（返回给Backend）:
{
  "risk_score": 0.65,
  "risk_level": 3,
  "confidence": 0.85,
  "predicted_24h": 4,
  "predicted_72h": 3
}
```

### 2. 异常检测 API
```http
POST http://localhost:8000/api/v1/anomaly/detect

用于检测监测站传感器异常
```

### 3. 健康检查
```http
GET http://localhost:8000/health

返回ML服务状态
```

---

## 🔧 数据流闭环（完整业务流程）

### 真实场景示例：门头沟妙峰山风险评估

```
第1步：监测站生成数据
━━━━━━━━━━━━━━━━━━━━
BJ002 妙峰山坡面监测站 (zone_id=2)
  每5分钟生成：
  ├─ slope_displacement: 2.5mm  (坡面位移)
  ├─ rainfall: 6mm              (降雨量)
  └─ soil_moisture: 45%         (土壤湿度)
  
  保存到 → monitoring_data表

第2步：用户触发风险评估
━━━━━━━━━━━━━━━━━━━━
Web管理端 → 点击"评估风险"按钮
  ↓
Frontend发送请求 → Backend (Node.js)

第3步：Backend聚合数据
━━━━━━━━━━━━━━━━━━━━
RiskAssessmentService.assessRisk(zone_id=2)
  ├─ 查询该区域的监测站 (zone_id=2)
  ├─ 获取24小时监测数据
  │   SELECT * FROM monitoring_data md
  │   INNER JOIN monitoring_stations ms
  │   WHERE ms.zone_id = 2
  ├─ 计算features:
  │   rainfall: 6.5
  │   slope: 3.2
  │   soil_moisture: 4.5
  └─ 调用ML API

第4步：ML模块预测
━━━━━━━━━━━━━━━━━━━━
Python FastAPI (端口8000)
  ├─ 接收zone_id=2
  ├─ 从数据库直接查询监测数据
  │   (绕过Backend，直接连PostgreSQL)
  ├─ 数据聚合：monitoring_data → features
  ├─ 输入ML模型：
  │   risk_score = f(rainfall, slope, soil_moisture, ...)
  │   = 0.65 (风险等级3)
  └─ 返回结果给Backend

第5步：Backend保存结果
━━━━━━━━━━━━━━━━━━━━
  risk_assessments表插入记录:
  {
    zone_id: 2,
    current_risk_level: 3,
    risk_score: 0.65,
    confidence: 0.85,
    assessment_method: "ML模型",
    model_version: "1.0.0-ML"
  }

第6步：前端展示
━━━━━━━━━━━━━━━━━━━━
  Web管理端显示：
  ┌──────────────────┐
  │ 门头沟妙峰山     │
  │ 风险等级: 3级    │ ← ML模块计算的！
  │ 置信度: 85%      │
  │ 24小时预测: 4级  │
  └──────────────────┘
```

---

## 🚀 如何使用

### 方式1：直接启动（推荐）

```bash
# 1. 进入ML目录
cd disaster-risk-system/ml-models

# 2. 启动服务（一条命令）
python main.py

# 服务会自动：
# - 连接PostgreSQL数据库
# - 加载ML模型
# - 启动FastAPI服务（端口8000）
```

### 方式2：使用系统启动脚本

```bash
# 根目录有统一启动脚本
cd disaster-risk-system
.\启动系统.bat

# 会自动启动：
# ✓ PostgreSQL
# ✓ Redis  
# ✓ Backend (Node.js)
# ✓ Frontend (Vue3)
# ✓ ML服务 (Python)  ← 包括这个！
```

### 检查ML服务是否启动

```bash
# 浏览器访问
http://localhost:8000/health

# 应该返回：
{
  "status": "healthy",
  "timestamp": "2025-10-09T20:30:00",
  "models_loaded": {
    "risk_assessment": true,
    "anomaly_detection": true
  }
}
```

---

## 📊 ML模块的核心功能

### 功能1：风险评估（主要功能）

**输入**：
- zone_id（风险区域ID）
- 该区域内监测站的24小时数据

**处理**：
1. 查询monitoring_data表
2. 按数据类型聚合（rainfall平均6mm，slope最大2.5mm...）
3. 归一化到0-10分
4. 加权求和 → 风险评分
5. 转换为1-5级

**输出**：
- 风险等级：3级
- 置信度：85%
- 24小时预测：4级
- 72小时预测：3级

### 功能2：异常检测

检测监测站传感器故障或异常数据：
- 坡面位移突然增大（>5mm）→ 异常！
- 地震加速度异常值 → 异常！

### 功能3：时序预测

基于历史趋势预测未来风险：
- 分析过去7天的风险趋势
- 预测未来24/72小时风险等级

---

## 🏗️ ML模块目录结构说明

```
ml-models/
├── main.py                      ← 启动入口（运行这个！）
├── requirements.txt             ← Python依赖包
│
├── src/
│   ├── inference/api/
│   │   └── ml_api.py           ← FastAPI服务（核心！）
│   │                              - POST /api/v1/predict/risk
│   │                              - Backend调用这个API
│   │
│   ├── data/loaders/
│   │   └── database_loader.py  ← 从PostgreSQL查询监测数据
│   │                              - get_zone_monitoring_data(zone_id)
│   │                              - 直接查询monitoring_data表
│   │
│   ├── models/                  ← ML模型类
│   │   ├── risk_assessment/    ← 风险评估模型
│   │   ├── anomaly/            ← 异常检测
│   │   └── time_series/        ← 时序预测
│   │
│   ├── data/preprocessing/     ← 数据清洗和特征工程
│   ├── training/               ← 模型训练管道
│   └── utils/                  ← 工具函数
│
└── logs/                        ← 日志文件
```

---

## ❓ 常见问题

### Q1: ML模块和Backend有什么区别？

**Backend（Node.js）**：
- 处理所有业务逻辑
- 用户认证、数据CRUD
- 调用ML模块获取预测结果
- 端口：3000

**ML模块（Python）**：
- 只负责机器学习预测
- 不管用户、权限、业务流程
- 被Backend调用
- 端口：8000

**关系**：Backend是老板，ML模块是专家顾问，只回答"这个区域风险多大？"

### Q2: 需要单独的GUI吗？

**不需要！** ML模块是纯后台服务。

用户界面已经有了：
- 🌐 **Web管理端**（Vue3，端口5173）
  - 风险评估页面
  - 监测数据可视化
  - 预警管理
  
- 📱 **移动端**（React Native）
  - 查看风险区域
  - 接收预警

**这些界面调用Backend API，Backend再调用ML模块。**

用户操作流程：
```
用户点击"批量评估" (Web管理端)
  ↓
Frontend → Backend (POST /api/v1/risk-assessments/batch)
  ↓
Backend → ML模块 (POST http://localhost:8000/api/v1/predict/risk)
  ↓
ML模块 → 返回风险等级
  ↓
Backend → 保存结果到数据库
  ↓
Frontend → 显示评估结果
```

### Q3: 为什么ML模块要直接连数据库？

**两种设计方案**：

**方案A（当前）**：ML直连数据库
```
Backend → ML模块 → 直接查PostgreSQL
优点：减少Backend工作量，ML可自主优化查询
```

**方案B**：Backend传递所有数据
```
Backend查询数据 → 传给ML模块 → 预测
优点：ML模块更独立，不依赖数据库
缺点：大量数据传输，性能差
```

**我们选择方案A**，因为：
- ✅ ML需要灵活查询历史数据
- ✅ 减少网络传输
- ✅ 性能更好

### Q4: ML模块的数据来源？

**100%来自PostgreSQL数据库**：

```sql
-- ML模块查询的表：
monitoring_data         ← 监测站实时数据（每5分钟新增）
monitoring_stations     ← 监测站信息（zone_id关联）
risk_zones              ← 风险区域静态数据
```

**不需要外部API，不需要手动导入数据。**

---

## 📁 项目完整结构（三大模块）

```
disaster-risk-system/
│
├── backend/                    ← Node.js后端（核心业务）
│   ├── src/
│   │   ├── controllers/        ← API控制器
│   │   ├── services/
│   │   │   └── RiskAssessmentService.ts  ← 调用ML模块
│   │   ├── models/             ← 数据库模型
│   │   └── routes/
│   └── package.json
│   端口: 3000
│
├── frontend-web/               ← Vue3 Web管理端
│   └── disaster-risk-frontend/
│       ├── src/
│       │   ├── views/
│       │   │   └── risk-assessments/  ← 风险评估页面
│       │   └── components/
│       └── package.json
│   端口: 5173
│   作用: 管理员使用，查看所有数据
│
├── mobile-app/                 ← React Native移动端
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── WarningsScreen.tsx
│   │   │   └── RiskZonesScreen.tsx
│   │   └── api/
│   └── package.json
│   作用: 普通用户使用，查看预警和风险
│
├── ml-models/                  ← Python ML模块（这个！）
│   ├── src/
│   │   ├── inference/api/
│   │   │   └── ml_api.py       ← FastAPI服务
│   │   ├── data/loaders/
│   │   │   └── database_loader.py  ← 查询PostgreSQL
│   │   └── models/             ← ML模型
│   ├── main.py                 ← 启动脚本
│   └── requirements.txt
│   端口: 8000
│   作用: 提供ML预测API给Backend
│
└── database/                   ← 数据库脚本
    ├── schema.sql
    └── mock_data.sql
    端口: 5432 (PostgreSQL)
```

---

## 🚀 快速启动指南

### 第1步：安装依赖

```bash
cd disaster-risk-system/ml-models
pip install -r requirements.txt

# 主要依赖：
# - fastapi: Web框架
# - uvicorn: ASGI服务器
# - asyncpg: PostgreSQL异步驱动
# - pandas, numpy: 数据处理
# - scikit-learn: ML模型
```

### 第2步：启动服务

```bash
python main.py

# 看到以下输出表示成功：
# ✓ 数据库连接初始化完成
# ✓ 所有ML模型加载完成
# INFO: Uvicorn running on http://0.0.0.0:8000
```

### 第3步：验证服务

```bash
# 浏览器访问
http://localhost:8000/health

# 或使用curl
curl http://localhost:8000/health
```

### 第4步：测试API

```bash
# 在Backend运行时，访问Web管理端：
# http://localhost:5173
# → 风险评估 → 批量评估
# 
# Backend会自动调用ML模块，你什么都不用做！
```

---

## 🔄 完整的数据流（真实场景）

### 场景：评估海淀香山滑坡风险

```
1️⃣ 监测数据生成（自动，每5分钟）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BJ001 十渡雨量站 (zone_id=1)
     → rainfall: 6mm
   BJ002 妙峰山坡面站 (zone_id=2) 
     → slope_displacement: 2.5mm
     → rainfall: 5mm
     → soil_moisture: 45%
   
   保存到 monitoring_data表（15,000+条）

2️⃣ 用户操作（Web管理端）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   管理员打开浏览器
   http://localhost:5173
   → 风险评估页面
   → 选择"海淀香山"风险区
   → 点击"评估风险"按钮

3️⃣ Backend处理（Node.js）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RiskAssessmentService.assessRisk(3)  // zone_id=3
     ├─ 查询海淀香山的监测站
     │   (目前可能没有，用空间查询)
     ├─ 查询24小时监测数据
     ├─ 计算features
     ├─ 调用ML API:
     │   POST http://localhost:8000/api/v1/predict/risk
     │   {zone_id: 3, features: {...}}
     └─ 等待ML返回

4️⃣ ML模块预测（Python FastAPI）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ml_api.py → predict_risk()
     ├─ 接收zone_id=3
     ├─ database_loader.get_zone_monitoring_data(3)
     │   SELECT * FROM monitoring_data md
     │   INNER JOIN monitoring_stations ms
     │   WHERE ms.zone_id = 3
     │   AND md.timestamp >= NOW() - INTERVAL '24 hours'
     │
     ├─ aggregate_monitoring_to_features()
     │   rainfall数据 → rainfall: 6.5
     │   slope数据 → slope: 5.0
     │   ...
     │
     ├─ ML模型计算：
     │   risk_score = 0.25*rainfall + 0.20*slope + ...
     │   = 0.72
     │   → risk_level = 4 (高风险)
     │
     └─ 返回JSON:
         {
           "risk_score": 0.72,
           "risk_level": 4,
           "confidence": 0.85,
           "predicted_24h": 4,
           "predicted_72h": 3
         }

5️⃣ Backend保存并返回
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RiskAssessmentService:
     ├─ 保存到 risk_assessments表
     └─ 返回给Frontend

6️⃣ Frontend展示
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Web管理端：
   ┌────────────────────┐
   │ 海淀香山           │
   │ 🔴 风险等级: 4级   │
   │ 高风险             │
   │ 置信度: 85%        │
   │                    │
   │ 📊 影响因素：      │
   │   降雨量: 6.5      │
   │   坡面位移: 5.0    │
   │   土壤湿度: 4.5    │
   └────────────────────┘
```

---

## 💡 总结

### ML模块的定位

| 问题 | 答案 |
|------|------|
| 是什么？ | 一个FastAPI服务，提供ML预测能力 |
| 给谁用？ | Backend（Node.js）调用 |
| 用户能看到吗？ | 不能，用户只看到Web/移动端 |
| 需要GUI吗？ | 不需要，只是API服务 |
| 数据来源？ | PostgreSQL数据库（自动查询） |
| 如何启动？ | python main.py |
| 端口？ | 8000 |

### 系统分工

```
Frontend (Vue3/React Native)
  ↓ 用户界面
Backend (Node.js)
  ↓ 业务逻辑 + 调用ML
ML模块 (Python)
  ↓ 机器学习预测
PostgreSQL
  ↓ 数据存储
```

**ML模块只是系统的一个服务组件，不需要单独的界面！**

---

**现在启动ML服务**：
```bash
cd disaster-risk-system/ml-models
python main.py
```

完成！🎉
