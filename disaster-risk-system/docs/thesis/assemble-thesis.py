# -*- coding: utf-8 -*-
"""
组装毕业论文脚本
自动合并所有章节为一个完整的Markdown文件
"""

import os
from pathlib import Path

# 获取脚本所在目录
base_dir = Path(__file__).parent
output_file = base_dir / "毕业论文-完整版.md"

print("=" * 60)
print("    毕业论文自动组装工具")
print("=" * 60)
print()

# 文件列表（按顺序）
files = [
    "01-绪论.md",
    "02-需求分析.md",
    "03-系统总体设计.md",
    "04-数据库设计.md",
    "05-核心功能实现.md",
    "06-系统测试.md",
    "07-总结与展望.md",
    "参考文献-完整版.md"
]

print("[1/4] 检查文件...")

all_exists = True
for file in files:
    full_path = base_dir / file
    if full_path.exists():
        print(f"  [OK] {file}")
    else:
        print(f"  [FAIL] {file} 不存在")
        all_exists = False

if not all_exists:
    print()
    print("错误：部分文件缺失，无法组装")
    exit(1)

print()
print("[2/4] 读取并合并文件...")

content = []

# 添加封面和摘要
content.append("# 基于WebGIS的地质灾害风险评估与应急避险系统设计与实现")
content.append("")
content.append("**Design and Implementation of Geological Disaster Risk Assessment and Emergency Evacuation System Based on WebGIS**")
content.append("")
content.append("---")
content.append("")
content.append("## 摘要")
content.append("")
content.append("地质灾害严重威胁山区人民生命财产安全，传统的人工评估方法效率低、主观性强、缺乏实时性。本文设计并实现了基于WebGIS的地质灾害风险智能评估与应急避险系统。系统采用PostgreSQL+PostGIS空间数据库管理地理数据，布设20个监测站采集10种类型的监测数据，集成随机森林机器学习算法实现风险智能评估，基于A*算法在35,513条真实道路上规划逃生路径。系统包含Web管理端（Vue 3，71个文件）和移动端（React Native，43个文件），分别服务于专业管理人员和普通公众。测试结果表明，风险评估响应时间1.2秒，预测准确率90%，路径规划耗时8秒，各项性能指标满足需求。系统实现了监测、评估、预警、导航的全流程信息化，为地质灾害防治提供了技术支撑。")
content.append("")
content.append("**关键词**：地质灾害；WebGIS；PostGIS；随机森林；A*算法；风险评估")
content.append("")
content.append("---")
content.append("")
content.append("## Abstract")
content.append("")
content.append("Geological disasters seriously threaten the lives and property of people in mountainous areas. Traditional manual assessment methods are inefficient, subjective, and lack real-time capability. This paper designs and implements a geological disaster risk assessment and emergency evacuation system based on WebGIS. The system uses PostgreSQL+PostGIS spatial database to manage geographic data, deploys 20 monitoring stations to collect 10 types of monitoring data, integrates Random Forest machine learning algorithm for intelligent risk assessment, and plans escape routes on 35,513 real roads based on A* algorithm. The system includes a Web management terminal (Vue 3, 71 files) and a mobile terminal (React Native, 43 files), serving professional managers and general public respectively. Test results show that risk assessment response time is 1.2 seconds, prediction accuracy is 90%, and path planning takes 8 seconds, meeting all performance requirements. The system realizes the whole process informatization of monitoring, assessment, warning and navigation, providing technical support for geological disaster prevention.")
content.append("")
content.append("**Keywords**: Geological Disaster; WebGIS; PostGIS; Random Forest; A* Algorithm; Risk Assessment")
content.append("")
content.append("---")
content.append("")
content.append("\\pagebreak")
content.append("")

# 合并各章节
for idx, file in enumerate(files):
    full_path = base_dir / file
    
    print(f"  读取 {file}...")
    
    with open(full_path, 'r', encoding='utf-8') as f:
        file_content = f.read().strip()
    
    content.append(file_content)
    content.append("")
    content.append("")
    
    if idx < len(files) - 1:
        content.append("\\pagebreak")
        content.append("")

print()
print("[3/4] 写入文件...")

# 写入文件（UTF-8）
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(content))

print(f"  [OK] 已保存到: {output_file}")

print()
print("[4/4] 统计信息...")

file_size = output_file.stat().st_size
word_count = len('\n'.join(content)) // 2  # 粗略估算中文字数

print(f"  文件大小: {file_size / 1024:.2f} KB")
print(f"  预估字数: {word_count:,} 字")
print(f"  章节数量: {len(files)} 章")

print()
print("=" * 60)
print("    组装完成！")
print("=" * 60)
print()
print("输出文件: 毕业论文-完整版.md")
print()
print("下一步操作：")
print("  1. 使用Pandoc转换为Word：")
print("     pandoc 毕业论文-完整版.md -o 毕业论文.docx")
print()
print("  2. 或直接打开MD文件复制到Word")
print()

