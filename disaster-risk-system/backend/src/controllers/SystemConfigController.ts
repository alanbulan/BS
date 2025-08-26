import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SystemConfigModel, CreateSystemConfigData, UpdateSystemConfigData, SystemConfigQuery } from '../models/SystemConfigModel';
import { asyncHandler } from '../middleware/asyncHandler';
import { configService } from '../services/ConfigService';
import { pool } from '../config/database';

export class SystemConfigController extends BaseController {
  private systemConfigModel: SystemConfigModel;

  constructor() {
    super();
    this.systemConfigModel = new SystemConfigModel();
  }

  /**
   * 创建系统配置
   */
  createConfig = asyncHandler(async (req: Request, res: Response) => {
    const {
      config_key,
      config_value,
      category,
      description,
      is_public
    } = req.body;

    // 验证必填字段
    if (!config_key || config_value === undefined || !category) {
      return this.error(res, '配置键、配置值和配置类型是必填的', 400);
    }

    // 检查配置键是否已存在
    const existing = await this.systemConfigModel.getByKey(config_key);
    if (existing) {
      return this.error(res, '配置键已存在', 409);
    }

    // 处理配置值 - 如果是字符串，尝试解析为JSON，否则直接使用
    let processedValue = config_value;
    if (typeof config_value === 'string') {
      try {
        // 尝试解析为JSON
        processedValue = JSON.parse(config_value);
      } catch (e) {
        // 如果解析失败，保持为字符串
        processedValue = config_value;
      }
    }

    const configData: CreateSystemConfigData = {
      config_key,
      config_value: processedValue,
      category,
      description,
      is_public
    };

    const config = await this.systemConfigModel.create(configData);
    this.created(res, config, '系统配置创建成功');
    return;
  });

  /**
   * 获取系统配置列表
   */
  getConfigs = asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      is_public,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const conditions: SystemConfigQuery = {
      category: category as string,
      is_public: is_public !== undefined ? is_public === 'true' : undefined,
      search: search as string,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    };

    const result = await this.systemConfigModel.findWithConditions(conditions);
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const totalPages = Math.ceil(result.total / limitNum);
    
    this.paginated(res, result.configs, {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      pages: totalPages
    });
  });

  /**
   * 根据配置键获取配置
   */
  getConfigByKey = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;

    const config = await this.systemConfigModel.getByKey(key);
    
    if (!config) {
      return this.notFound(res, '配置不存在');
    }

    this.success(res, config);
    return;
  });

  /**
   * 根据配置键获取配置值
   */
  getConfigValue = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { defaultValue } = req.query;

    const value = await this.systemConfigModel.getValue(
      key,
      defaultValue ? JSON.parse(defaultValue as string) : undefined
    );

    this.success(res, { value });
  });

  /**
   * 根据配置类型获取配置
   */
  getConfigsByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    const configs = await this.systemConfigModel.getByType(type);
    this.success(res, configs);
  });

  /**
   * 获取预警级别配置
   */
  getWarningLevels = asyncHandler(async (req: Request, res: Response) => {
    const warningLevels = await this.systemConfigModel.getValue('warning.levels', []);
    this.success(res, warningLevels);
  });

  /**
   * 更新系统配置
   */
  updateConfig = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const {
      config_value,
      category,
      description,
      is_public
    } = req.body;

    // 处理配置值 - 如果是字符串，尝试解析为JSON，否则直接使用
    let processedValue = config_value;
    if (config_value !== undefined && typeof config_value === 'string') {
      try {
        // 尝试解析为JSON
        processedValue = JSON.parse(config_value);
      } catch (e) {
        // 如果解析失败，保持为字符串
        processedValue = config_value;
      }
    }

    const updateData: UpdateSystemConfigData = {
      config_value: processedValue,
      category,
      description,
      is_public
    };

    const config = await this.systemConfigModel.updateByKey(key, updateData);
    
    if (!config) {
      return this.notFound(res, '配置不存在');
    }

    // 如果更新了配置值，触发ConfigService的热更新机制
    if (config_value !== undefined) {
      try {
        await configService.setConfig(key as any, processedValue);
        console.log(`配置 ${key} 热更新成功`);
      } catch (error) {
        console.warn(`配置 ${key} 热更新失败:`, error);
        // 不影响主要的配置更新流程
      }
    }

    this.success(res, config, '系统配置更新成功');
    return;
  });

  /**
   * 设置配置值
   */
  setConfigValue = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value, category = 'general' } = req.body;

    if (value === undefined) {
      return this.error(res, '配置值是必填的', 400);
    }

    // 处理配置值 - 如果是字符串，尝试解析为JSON，否则直接使用
    let processedValue = value;
    if (typeof value === 'string') {
      try {
        // 尝试解析为JSON
        processedValue = JSON.parse(value);
      } catch (e) {
        // 如果解析失败，保持为字符串
        processedValue = value;
      }
    }

    const config = await this.systemConfigModel.setValue(key, processedValue, category);
    
    // 触发ConfigService的热更新机制
    try {
      await configService.setConfig(key as any, processedValue);
      console.log(`配置 ${key} 热更新成功`);
    } catch (error) {
      console.warn(`配置 ${key} 热更新失败:`, error);
      // 不影响主要的配置设置流程
    }
    
    this.success(res, config, '配置值设置成功');
    return;
  });

  /**
   * 批量设置配置
   */
  setBatchConfigs = asyncHandler(async (req: Request, res: Response) => {
    const { configs } = req.body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return this.error(res, '配置数据不能为空', 400);
    }

    // 验证配置格式并处理配置值
    const processedConfigs = [];
    for (const config of configs) {
      if (!config.key || config.value === undefined) {
        return this.error(res, '每个配置必须包含key和value', 400);
      }
      
      // 处理配置值 - 如果是字符串，尝试解析为JSON，否则直接使用
      let processedValue = config.value;
      if (typeof config.value === 'string') {
        try {
          // 尝试解析为JSON
          processedValue = JSON.parse(config.value);
        } catch (e) {
          // 如果解析失败，保持为字符串
          processedValue = config.value;
        }
      }
      
      processedConfigs.push({
        ...config,
        value: processedValue
      });
    }

    const results = await this.systemConfigModel.setBatch(processedConfigs);
    
    // 触发ConfigService的热更新机制
    for (const config of processedConfigs) {
      try {
        await configService.setConfig(config.key as any, config.value);
        console.log(`批量配置 ${config.key} 热更新成功`);
      } catch (error) {
        console.warn(`批量配置 ${config.key} 热更新失败:`, error);
        // 不影响主要的配置设置流程
      }
    }
    
    this.success(res, results, `成功设置 ${results.length} 个配置`);
    return;
  });

  /**
   * 删除系统配置（软删除）
   */
  deleteConfig = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;

    const success = await this.systemConfigModel.deleteByKey(key);
    
    if (!success) {
      return this.notFound(res, '配置不存在');
    }

    this.success(res, null, '系统配置删除成功');
    return;
  });

  /**
   * 物理删除系统配置
   */
  hardDeleteConfig = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;

    const success = await this.systemConfigModel.hardDeleteByKey(key);
    
    if (!success) {
      return this.notFound(res, '配置不存在');
    }

    this.success(res, null, '系统配置永久删除成功');
    return;
  });

  /**
   * 获取所有配置类型
   */
  getConfigTypes = asyncHandler(async (req: Request, res: Response) => {
    const types = await this.systemConfigModel.getConfigTypes();
    this.success(res, types);
  });

  /**
   * 获取配置统计信息
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.systemConfigModel.getStatistics();
    this.success(res, statistics);
  });

  /**
   * 导出配置
   */
  exportConfigs = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query;

    const configs = await this.systemConfigModel.exportConfigs(type as string);
    
    // 设置下载头
    const filename = type ? `config_${type}_${Date.now()}.json` : `config_all_${Date.now()}.json`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    
    this.success(res, configs);
  });

  /**
   * 导入配置
   */
  importConfigs = asyncHandler(async (req: Request, res: Response) => {
    const { configs, overwrite = false } = req.body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return this.error(res, '配置数据不能为空', 400);
    }

    // 验证配置格式
    for (const config of configs) {
      if (!config.config_key || config.config_value === undefined || !config.category) {
        return this.error(res, '每个配置必须包含config_key、config_value和category', 400);
      }
    }

    const result = await this.systemConfigModel.importConfigs(configs, overwrite);
    
    this.success(res, result, 
      `导入完成：创建 ${result.created} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个`
    );
    return;
  });

  /**
   * 重置配置到默认值
   */
  resetToDefaults = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.body;

    // 默认配置
    const defaultConfigs = [
      {
        config_key: 'system.name',
        config_value: '地质灾害风险评估系统',
        category: 'system',
        description: '系统名称'
      },
      {
        config_key: 'system.version',
        config_value: '1.0.0',
        category: 'system',
        description: '系统版本'
      },
      {
        config_key: 'warning.default_radius',
        config_value: 5000,
        category: 'warning',
        description: '默认预警半径（米）'
      },
      {
        config_key: 'warning.auto_send',
        config_value: true,
        category: 'warning',
        description: '是否自动发送预警'
      },
      {
        config_key: 'monitoring.data_retention_days',
        config_value: 365,
        category: 'monitoring',
        description: '监测数据保留天数'
      },
      {
        config_key: 'monitoring.collection_interval',
        config_value: 300,
        category: 'monitoring',
        description: '数据采集间隔（秒）'
      },
      {
        config_key: 'risk.assessment_interval_hours',
        config_value: 6,
        category: 'risk',
        description: '风险评估间隔（小时）'
      },
      {
        config_key: 'risk.high_risk_threshold',
        config_value: 0.8,
        category: 'risk',
        description: '高风险阈值'
      },
      {
        config_key: 'notification.email_enabled',
        config_value: true,
        category: 'notification',
        description: '是否启用邮件通知'
      },
      {
        config_key: 'notification.sms_enabled',
        config_value: false,
        category: 'notification',
        description: '是否启用短信通知'
      }
    ];

    // 如果指定了类型，只重置该类型的配置
    const configsToReset = type 
      ? defaultConfigs.filter(config => config.category === type)
      : defaultConfigs;

    const result = await this.systemConfigModel.importConfigs(configsToReset, true);
    
    this.success(res, result, 
      `重置完成：创建 ${result.created} 个，更新 ${result.updated} 个配置`
    );
  });

  /**
   * 清除缓存
   */
  clearCache = asyncHandler(async (req: Request, res: Response) => {
    try {
      const cacheService = (await import('../services/CacheService')).default;
      
      // 清除系统配置相关缓存
      await cacheService.clearSystemConfigCache();
      
      console.log('System config cache cleared successfully');
      
      this.success(res, null, '缓存清除成功');
    } catch (error) {
      console.error('Clear cache error:', error);
      this.error(res, '清除缓存失败', 500);
    }
  });

  /**
   * 验证配置值
   */
  validateConfig = asyncHandler(async (req: Request, res: Response) => {
    const { key, value, type } = req.body;

    if (!key || value === undefined || !type) {
      return this.error(res, '配置键、值和类型是必填的', 400);
    }

    const validation = {
      valid: true,
      errors: [] as string[]
    };

    // 基本验证规则
    switch (type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          validation.valid = false;
          validation.errors.push('值必须是数字');
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && !['true', 'false'].includes(String(value).toLowerCase())) {
          validation.valid = false;
          validation.errors.push('值必须是布尔值');
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          validation.valid = false;
          validation.errors.push('值必须是有效的邮箱地址');
        }
        break;
      case 'url':
        try {
          new URL(String(value));
        } catch {
          validation.valid = false;
          validation.errors.push('值必须是有效的URL');
        }
        break;
      case 'json':
        try {
          JSON.parse(String(value));
        } catch {
          validation.valid = false;
          validation.errors.push('值必须是有效的JSON');
        }
        break;
    }

    // 特定配置键的验证
    if (key.includes('threshold') && typeof value === 'number') {
      if (value < 0 || value > 1) {
        validation.valid = false;
        validation.errors.push('阈值必须在0-1之间');
      }
    }

    if (key.includes('interval') && typeof value === 'number') {
      if (value <= 0) {
        validation.valid = false;
        validation.errors.push('间隔值必须大于0');
      }
    }

    this.success(res, validation);
    return;
  });

  /**
   * 获取系统信息
   */
  getSystemInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      // 获取数据库版本
      const dbVersionResult = await pool.query('SELECT version()');
      const dbVersionFull = dbVersionResult.rows[0].version;
      
      // 提取PostgreSQL版本号
      const versionMatch = dbVersionFull.match(/PostgreSQL ([\d\.]+)/);
      const dbVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : 'PostgreSQL Unknown';
      
      // 获取系统启动时间（简化版本）
      const uptimeResult = await pool.query('SELECT pg_postmaster_start_time()');
      const startTime = new Date(uptimeResult.rows[0].pg_postmaster_start_time);
      const uptime = this.formatUptime(Date.now() - startTime.getTime());
      
      // 获取数据库大小
      const dbSizeResult = await pool.query("SELECT pg_size_pretty(pg_database_size('disaster_risk_db')) as size");
      const dbSize = dbSizeResult.rows[0].size;
      
      // 检查系统状态
      const systemStatus = await this.checkSystemStatus();
      
      // 检查数据库连接状态
      const dbConnectionStatus = await this.checkDatabaseConnection();
      
      const systemInfo = {
        version: 'v1.0.0',
        dbVersion,
        dbSize,
        uptime,
        lastBackup: '暂无备份', // 可以后续从配置或日志中获取
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        systemStatus: systemStatus.status,
        systemStatusText: systemStatus.text,
        dbConnectionStatus: dbConnectionStatus.status,
        dbConnectionText: dbConnectionStatus.text
      };
      
      this.success(res, systemInfo);
    } catch (error) {
      console.error('获取系统信息失败:', error);
      this.error(res, '获取系统信息失败', 500);
    }
  });
  
  /**
   * 检查系统状态
   */
  private async checkSystemStatus(): Promise<{ status: string; text: string }> {
    try {
      // 检查系统基本状态
      const memoryUsage = process.memoryUsage();
      
      // 计算内存使用率
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      // 健康检查逻辑：内存使用率低于95%为正常
      const isHealthy = memoryUsagePercent < 95;
      
      return {
        status: isHealthy ? 'normal' : 'warning',
        text: isHealthy ? '正常运行' : `运行异常 (内存使用率: ${memoryUsagePercent.toFixed(1)}%)`
      };
    } catch (error) {
      return {
        status: 'error',
        text: '状态检查失败'
      };
    }
  }

  /**
   * 检查数据库连接状态
   */
  private async checkDatabaseConnection(): Promise<{ status: string; text: string }> {
    try {
      // 执行简单的数据库查询来检查连接
      await pool.query('SELECT 1');
      return {
        status: 'connected',
        text: '已连接'
      };
    } catch (error) {
      return {
        status: 'disconnected',
        text: '连接失败'
      };
    }
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟`;
    } else {
      return `${seconds}秒`;
    }
  }
}