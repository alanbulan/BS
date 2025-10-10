# 灾害风险管理系统

一个综合性的灾害风险管理平台，集成了风险评估、实时监测、预警发布、应急响应等功能。

## 项目架构

- **backend/** - Node.js + TypeScript + Express 后端服务
- **frontend-web/** - Vue 3 + TypeScript Web 管理端
- **mobile-app/** - React Native 移动应用
- **ml-models/** - Python机器学习模型服务
- **database/** - 数据库脚本和迁移文件

## 主要功能

### 核心功能
- 🗺️ 风险区域管理与可视化
- 📊 实时监测数据采集与分析
- ⚠️ 多级预警发布系统
- 🚨 应急响应与疏散路线规划
- 🏠 避难场所管理
- 📱 用户报告与反馈

### 技术特性
- 📈 基于ML的风险评估模型
- 🗺️ PostGIS地理空间数据处理
- 🔄 实时数据同步
- 📍 A*路径规划算法
- 🌐 RESTful API架构

## 技术栈

### 后端
- Node.js + TypeScript
- Express.js
- PostgreSQL + PostGIS
- Redis
- Winston (日志)

### 前端
- Vue 3 + TypeScript
- Element Plus
- Pinia (状态管理)
- Axios

### 移动端
- React Native
- TypeScript
- React Navigation

### ML服务
- Python
- FastAPI
- Scikit-learn
- Pandas

## 快速开始

### 环境要求
- Node.js >= 16.x
- Python >= 3.8
- PostgreSQL >= 13 (with PostGIS extension)
- Redis >= 6.x

### 安装依赖

```bash
# 后端
cd disaster-risk-system/backend
npm install

# 前端
cd disaster-risk-system/frontend-web/disaster-risk-frontend
npm install

# 移动端
cd disaster-risk-system/mobile-app
npm install

# ML服务
cd disaster-risk-system/ml-models
pip install -r requirements.txt
```

### 配置

1. 复制 `backend/.env.example` 到 `backend/.env` 并配置数据库连接
2. 初始化数据库：
```bash
psql -U your_user -d your_database -f database/schema.sql
```

### 运行

```bash
# 使用一键启动脚本
./一键启动全部.bat

# 或分别启动各服务
cd disaster-risk-system/backend && npm run dev  # 后端: http://localhost:3000
cd disaster-risk-system/frontend-web/disaster-risk-frontend && npm run dev  # 前端: http://localhost:5173
cd disaster-risk-system/ml-models && python main.py  # ML服务: http://localhost:8000
```

## 项目结构

```
disaster-risk-system/
├── backend/               # 后端服务
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   └── utils/        # 工具函数
│   └── dist/             # 编译输出 (不提交)
├── frontend-web/          # Web前端
│   └── disaster-risk-frontend/
│       └── src/
│           ├── components/  # 组件
│           ├── views/       # 页面
│           ├── api/         # API封装
│           └── styles/      # 样式
├── mobile-app/            # 移动应用
│   └── src/
│       ├── screens/      # 页面
│       ├── components/   # 组件
│       └── api/          # API
├── ml-models/            # 机器学习服务
│   └── src/
│       ├── models/      # ML模型
│       ├── inference/   # 推理服务
│       └── training/    # 训练脚本
└── database/             # 数据库脚本
    ├── schema.sql       # 数据库结构
    └── migrations/      # 迁移文件
```

## API文档

后端API运行后访问 `http://localhost:3000/api-docs` 查看Swagger文档

## 许可证

MIT License

