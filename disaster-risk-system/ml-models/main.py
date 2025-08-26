#!/usr/bin/env python3
"""
机器学习模块启动脚本
支持训练、推理服务、批量处理等多种模式
"""

import sys
import argparse
import asyncio
import logging
import uvicorn
from pathlib import Path

# 添加项目路径
sys.path.append(str(Path(__file__).parent / "src"))

from src.config.config import load_config, create_directories
from src.inference.api.ml_api import app
from src.training.pipelines.training_pipeline import TrainingPipeline
from src.data.loaders.database_loader import DatabaseLoader

def setup_logging():
    """
    设置日志配置
    """
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('logs/ml_service.log')
        ]
    )

def start_api_server():
    """
    启动API服务器
    """
    config = load_config()
    api_config = config["api"]
    
    logging.info("启动ML API服务...")
    
    uvicorn.run(
        app,
        host=api_config["host"],
        port=api_config["port"],
        workers=1,  # 由于模型加载内存占用，使用单进程
        log_level="info"
    )

async def run_training(model_type: str = "all"):
    """
    运行模型训练
    """
    logging.info(f"开始训练模型: {model_type}")
    
    pipeline = TrainingPipeline()
    
    if model_type == "all":
        await pipeline.train_all_models()
    elif model_type == "risk":
        await pipeline.train_risk_model()
    elif model_type == "timeseries":
        await pipeline.train_timeseries_model()
    elif model_type == "anomaly":
        await pipeline.train_anomaly_model()
    else:
        logging.error(f"不支持的模型类型: {model_type}")
        return
    
    logging.info("模型训练完成")

async def run_batch_inference(input_file: str, output_file: str):
    """
    运行批量推理
    """
    logging.info(f"开始批量推理: {input_file} -> {output_file}")
    
    from src.inference.batch.batch_processor import BatchProcessor
    
    processor = BatchProcessor()
    await processor.process_batch(input_file, output_file)
    
    logging.info("批量推理完成")

def check_system():
    """
    系统检查
    """
    logging.info("开始系统检查...")
    
    # 检查必要目录
    create_directories()
    
    # 检查数据库连接
    try:
        db_loader = DatabaseLoader()
        asyncio.run(db_loader.test_connection())
        logging.info("✓ 数据库连接正常")
    except Exception as e:
        logging.error(f"✗ 数据库连接失败: {e}")
        return False
    
    # 检查依赖包
    try:
        import torch
        import sklearn
        import pandas
        import numpy
        logging.info("✓ 核心依赖包检查通过")
    except ImportError as e:
        logging.error(f"✗ 依赖包缺失: {e}")
        return False
    
    logging.info("系统检查完成")
    return True

def main():
    """
    主函数
    """
    parser = argparse.ArgumentParser(description="地质灾害风险评估ML服务")
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # API服务命令
    api_parser = subparsers.add_parser("serve", help="启动API服务")
    api_parser.add_argument("--host", default="0.0.0.0", help="服务主机地址")
    api_parser.add_argument("--port", type=int, default=8000, help="服务端口")
    
    # 训练命令
    train_parser = subparsers.add_parser("train", help="训练模型")
    train_parser.add_argument(
        "--model", 
        choices=["all", "risk", "timeseries", "anomaly"],
        default="all",
        help="要训练的模型类型"
    )
    
    # 批量推理命令
    batch_parser = subparsers.add_parser("batch", help="批量推理")
    batch_parser.add_argument("--input", required=True, help="输入文件路径")
    batch_parser.add_argument("--output", required=True, help="输出文件路径")
    
    # 系统检查命令
    subparsers.add_parser("check", help="系统检查")
    
    # 数据库初始化命令
    subparsers.add_parser("init-db", help="初始化数据库")
    
    args = parser.parse_args()
    
    # 设置日志
    setup_logging()
    
    if args.command == "serve":
        start_api_server()
    
    elif args.command == "train":
        asyncio.run(run_training(args.model))
    
    elif args.command == "batch":
        asyncio.run(run_batch_inference(args.input, args.output))
    
    elif args.command == "check":
        if check_system():
            print("✓ 系统检查通过")
            sys.exit(0)
        else:
            print("✗ 系统检查失败")
            sys.exit(1)
    
    elif args.command == "init-db":
        from src.data.loaders.database_loader import DatabaseLoader
        db_loader = DatabaseLoader()
        asyncio.run(db_loader.initialize_database())
        print("数据库初始化完成")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()