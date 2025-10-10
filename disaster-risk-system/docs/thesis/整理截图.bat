@echo off
chcp 65001 >nul
title 整理论文截图

echo.
echo ============================================
echo       毕业论文截图自动整理工具
echo ============================================
echo.

:: 设置路径
set SOURCE=C:\Users\13080\AppData\Local\Temp\playwright-mcp-output\1760070167541
set TARGET=D:\BS\disaster-risk-system\docs\毕设\images\第6章

echo [1/3] 创建目标文件夹...
if not exist "%TARGET%" (
    mkdir "%TARGET%"
    echo     ✓ 文件夹已创建：%TARGET%
) else (
    echo     ✓ 文件夹已存在
)

echo.
echo [2/3] 复制截图文件...
if exist "%SOURCE%\*.png" (
    copy "%SOURCE%\*.png" "%TARGET%\" >nul
    echo     ✓ 已复制所有PNG文件
    echo.
    echo     文件列表：
    dir /B "%TARGET%\*.png"
) else (
    echo     ✗ 源文件夹不存在或无PNG文件
    echo     源路径：%SOURCE%
    pause
    exit /b 1
)

echo.
echo [3/3] 重命名文件（按论文图号）...

cd /d "%TARGET%"

if exist "图6-1-仪表板页面.png" (
    echo     ✓ 图6-1-仪表板页面.png
)

if exist "图6-2-风险区域管理页面.png" (
    echo     ✓ 图6-2-风险区域管理页面.png
)

if exist "图6-4-风险评估详情雷达图.png" (
    ren "图6-4-风险评估详情雷达图.png" "图6-3-风险评估详情雷达图.png"
    echo     ✓ 图6-3-风险评估详情雷达图.png（已重命名）
)

if exist "图6-5-移动端首页.png" (
    ren "图6-5-移动端首页.png" "图6-4-移动端登录界面.png"
    echo     ✓ 图6-4-移动端登录界面.png（已重命名）
)

if exist "图6-6-移动端首页预警.png" (
    ren "图6-6-移动端首页预警.png" "图6-5-移动端首页.png"
    echo     ✓ 图6-5-移动端首页.png（已重命名）
)

echo.
echo ============================================
echo              整理完成！
echo ============================================
echo.
echo 截图文件位置：
echo %TARGET%
echo.
echo 文件总数：
dir /B *.png | find /c /v ""
echo.
echo 下一步：
echo 1. 打开Word文档
echo 2. 定位到"6.6 系统运行截图"章节
echo 3. 插入图片（插入 → 图片）
echo 4. 调整图片大小为15cm宽（等比例）
echo 5. 添加图注（例如：图6-1 系统仪表板页面）
echo.
pause

