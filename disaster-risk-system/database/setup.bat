@echo off
echo 正在初始化数据库...

REM 检查PostgreSQL是否安装
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到PostgreSQL，请先安装PostgreSQL
    pause
    exit /b 1
)

echo 1. 创建数据库和用户...
psql -U postgres -f config.sql

echo 2. 初始化数据库结构...
psql -U postgres -d disaster_risk_db -f init.sql

echo 3. 插入测试数据...
psql -U postgres -d disaster_risk_db -f seed_data.sql

echo 数据库初始化完成！
echo 数据库名: disaster_risk_db
echo 用户名: disaster_user
echo 密码: 123456
pause