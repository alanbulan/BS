-- 数据库配置脚本
-- 创建数据库和用户

-- 创建数据库
CREATE DATABASE disaster_risk_db WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'zh_CN.UTF-8'
    LC_CTYPE = 'zh_CN.UTF-8'
    TEMPLATE = template0;

-- 创建用户
CREATE USER disaster_user WITH PASSWORD '123456';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE disaster_risk_db TO disaster_user;

-- 连接到新数据库
\c disaster_risk_db;

-- 授权用户在数据库中的权限
GRANT ALL ON SCHEMA public TO disaster_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO disaster_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO disaster_user;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO disaster_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO disaster_user;