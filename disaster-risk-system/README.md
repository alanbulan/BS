# 智能化地质灾害风险评估与逃生路径规划系统

## 项目简介
基于多源地理数据融合的智能化地质灾害风险评估系统，为用户提供实时风险监测、智能路径规划和AR导航功能。

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- Python >= 3.8
- PostgreSQL >= 13.0 (with PostGIS extension)
- Redis >= 6.0

### 安装步骤
1. 克隆项目
```bash
git clone <repository-url>
cd disaster-risk-system
```

2. 安装后端依赖
```bash
cd backend
npm install
```

3. 安装前端依赖
```bash
cd ../frontend-web
npm install
```

4. 配置数据库
```bash
cd ../database
# 执行数据库初始化脚本
```

5. 启动服务
```bash
# 启动后端服务
cd ../backend
npm run dev

# 启动前端服务
cd ../frontend-web
npm run dev
```

## 项目结构
详见 [项目规划.md](./项目规划.md)

## 技术栈
- **后端**: Node.js + Express.js + TypeScript + PostgreSQL + PostGIS
- **前端**: Vue3 + TypeScript + Element Plus + Leaflet
- **移动端**: React Native + TypeScript
- **机器学习**: Python + TensorFlow + Scikit-learn

## 开发进度
- [√] 项目规划和架构设计
- [√] 数据库设计和创建
- [√] 后端API开发
- [√] 前端界面开发
- [ ] 移动端开发
- [ ] 机器学习模型训练
- [ ] 系统集成测试


## 许可证
MIT License