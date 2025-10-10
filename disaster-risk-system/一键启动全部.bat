@echo off
chcp 65001 >nul
title 智能化地质灾害风险评估系统 - 一键启动

color 0A
echo.
echo ===============================================================
echo            智能化地质灾害风险评估系统
echo                   一键启动脚本
echo ===============================================================
echo.
echo [*] 正在检查环境...
echo.

:: 检查PostgreSQL
echo [1/5] 检查PostgreSQL数据库...
netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo     ✓ PostgreSQL已运行 [端口5432]
) else (
    echo     ✗ PostgreSQL未运行
    echo     请先启动PostgreSQL服务
    pause
    exit /b 1
)

:: 检查Redis
echo [2/5] 检查Redis缓存...
netstat -ano | findstr :6379 >nul
if %errorlevel% equ 0 (
    echo     ✓ Redis已运行 [端口6379]
) else (
    echo     ⚠ Redis未运行（可选，不影响核心功能）
)

echo.
echo [*] 准备启动所有服务...
echo.
timeout /t 2 /nobreak >nul

:: 启动Backend服务
echo [3/5] 启动Backend服务 [Node.js - 端口3000]...
start "Backend Service" cmd /k "cd /d %~dp0backend && title Backend - Node.js && color 0B && npm run dev"
timeout /t 3 /nobreak >nul

:: 启动ML服务
echo [4/5] 启动ML服务 [Python - 端口8000]...
start "ML Service" cmd /k "cd /d %~dp0ml-models && title ML Service - Python && color 0E && python main.py"
timeout /t 5 /nobreak >nul

:: 启动Frontend Web
echo [5/5] 启动Web管理端 [Vue3 - 端口5173]...
start "Frontend Web" cmd /k "cd /d %~dp0frontend-web\disaster-risk-frontend && title Frontend Web - Vue3 && color 0D && npm run dev"
timeout /t 3 /nobreak >nul

:: 启动Mobile App
echo [6/6] 启动移动端 [React Native - Web]...
start "Mobile App" cmd /k "cd /d %~dp0mobile-app && title Mobile App - React Native && color 0C && npm run web"
timeout /t 3 /nobreak >nul

echo.
echo ===============================================================
echo                   所有服务正在启动中...
echo ===============================================================
echo.
echo 服务列表：
echo   ✓ Backend服务      - http://localhost:3000
echo   ✓ ML机器学习服务   - http://localhost:8000
echo   ✓ Web管理端        - http://localhost:5173
echo   ✓ 移动端应用       - http://localhost:8081
echo.
echo 等待所有服务启动完成（约30秒）...
echo.

:: 等待服务启动
timeout /t 10 /nobreak >nul

echo [*] 正在验证服务状态...
echo.

:: 检查Backend
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo   ✓ Backend服务已启动
) else (
    echo   ✗ Backend服务启动失败
)

:: 检查ML服务
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo   ✓ ML服务已启动
) else (
    echo   ✗ ML服务启动失败
)

:: 检查Frontend
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo   ✓ Web管理端已启动
) else (
    echo   ⏳ Web管理端启动中...
)

:: 检查Mobile
netstat -ano | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo   ✓ 移动端已启动
) else (
    echo   ⏳ 移动端启动中...
)

echo.
echo ===============================================================
echo.
echo 🎉 系统启动完成！
echo.
echo 📱 访问地址：
echo    Web管理端:  http://localhost:5173
echo    移动端应用:  http://localhost:8081
echo    API文档:    http://localhost:3000/api-docs
echo    ML API:     http://localhost:8000/docs
echo.
echo 🔐 默认账号：
echo    管理员: admin / 123456
echo    用户:   user1 / 123456
echo.
echo ⚠️  注意事项：
echo    - 保持此窗口打开以查看系统状态
echo    - 关闭服务窗口即可停止对应服务
echo    - 建议按顺序关闭：移动端 → Web → ML → Backend
echo.
echo ===============================================================
echo.
echo 按任意键打开Web管理端...
pause >nul

:: 打开浏览器
start http://localhost:5173

echo.
echo 系统监控中...
echo 按Ctrl+C退出监控（不影响服务运行）
echo.

:: 保持窗口
cmd /k

