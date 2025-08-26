import { SystemConfigModel } from '../models/SystemConfigModel';
import { EventEmitter } from 'events';

export interface ConfigCache {
  [key: string]: {
    value: any;
    timestamp: number;
    ttl: number; // 缓存生存时间（毫秒）
  };
}

export interface SystemConfigs {
  'monitoring.collection_interval': number; // 分钟
  'risk.high_risk_threshold': number; // 0-1之间的阈值
  'risk.assessment_interval_hours': number; // 小时
  'warning.auto_send': boolean;
  'notification.email_enabled': boolean;
  'system.name': string;
  'emergency_contacts': any[];
  'map_default_center': { lat: number; lng: number };
}

export class ConfigService extends EventEmitter {
  private static instance: ConfigService;
  private systemConfigModel: SystemConfigModel;
  private cache: ConfigCache = {};
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟缓存
  
  // 默认配置值
  private readonly DEFAULT_VALUES: Partial<SystemConfigs> = {
    'monitoring.collection_interval': 30, // 30分钟
    'risk.high_risk_threshold': 0.7, // 70%
    'risk.assessment_interval_hours': 6, // 6小时
    'warning.auto_send': true,
    'notification.email_enabled': false,
    'system.name': '地质灾害风险监测系统',
    'emergency_contacts': [],
    'map_default_center': { lat: 39.9042, lng: 116.4074 } // 北京
  };

  private constructor() {
    super();
    this.systemConfigModel = new SystemConfigModel();
  }

  /**
   * 获取ConfigService单例
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * 获取配置值（带类型安全）
   */
  async getConfig<K extends keyof SystemConfigs>(key: K): Promise<SystemConfigs[K]> {
    try {
      // 检查缓存
      const cached = this.getCachedValue(key);
      if (cached !== null) {
        return cached;
      }

      // 从数据库获取
      const dbValue = await this.systemConfigModel.getValue(key);
      let parsedValue: any;

      if (dbValue !== null) {
        // 尝试解析JSON值
        try {
          parsedValue = JSON.parse(dbValue);
        } catch {
          // 如果不是JSON，直接使用字符串值
          parsedValue = dbValue;
        }
      } else {
        // 使用默认值
        parsedValue = this.DEFAULT_VALUES[key];
        console.warn(`配置项 ${key} 不存在，使用默认值:`, parsedValue);
      }

      // 类型转换和验证
      const typedValue = this.convertAndValidateValue(key, parsedValue);
      
      // 缓存结果
      this.setCachedValue(key, typedValue);
      
      return typedValue;
    } catch (error) {
      console.error(`获取配置 ${key} 失败:`, error);
      // 返回默认值
      const defaultValue = this.DEFAULT_VALUES[key];
      if (defaultValue !== undefined) {
        return defaultValue as SystemConfigs[K];
      }
      throw error;
    }
  }

  /**
   * 设置配置值
   */
  async setConfig<K extends keyof SystemConfigs>(key: K, value: SystemConfigs[K]): Promise<void> {
    try {
      // 验证值
      const validatedValue = this.convertAndValidateValue(key, value);
      
      // 序列化为字符串存储
      const stringValue = typeof validatedValue === 'string' 
        ? validatedValue 
        : JSON.stringify(validatedValue);
      
      // 保存到数据库
      await this.systemConfigModel.setValue(key, stringValue);
      
      // 更新缓存
      this.setCachedValue(key, validatedValue);
      
      // 发出配置变更事件
      this.emit('configChanged', key, validatedValue);
      
      console.log(`配置 ${key} 已更新为:`, validatedValue);
    } catch (error) {
      console.error(`设置配置 ${key} 失败:`, error);
      throw error;
    }
  }

  /**
   * 批量获取配置
   */
  async getConfigs<K extends keyof SystemConfigs>(keys: K[]): Promise<Pick<SystemConfigs, K>> {
    const result = {} as Pick<SystemConfigs, K>;
    
    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.getConfig(key);
      })
    );
    
    return result;
  }

  /**
   * 清除指定配置的缓存
   */
  clearCache(key?: keyof SystemConfigs): void {
    if (key) {
      delete this.cache[key];
      console.log(`已清除配置 ${key} 的缓存`);
    } else {
      this.cache = {};
      console.log('已清除所有配置缓存');
    }
  }

  /**
   * 预热缓存 - 预加载常用配置
   */
  async warmupCache(): Promise<void> {
    const commonConfigs: (keyof SystemConfigs)[] = [
      'monitoring.collection_interval',
      'risk.high_risk_threshold',
      'warning.auto_send',
      'notification.email_enabled'
    ];
    
    console.log('开始预热配置缓存...');
    await this.getConfigs(commonConfigs);
    console.log('配置缓存预热完成');
  }

  /**
   * 获取缓存值
   */
  private getCachedValue(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      delete this.cache[key];
      return null;
    }
    
    return cached.value;
  }

  /**
   * 设置缓存值
   */
  private setCachedValue(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl
    };
  }

  /**
   * 类型转换和验证
   */
  private convertAndValidateValue<K extends keyof SystemConfigs>(key: K, value: any): SystemConfigs[K] {
    try {
      switch (key) {
        case 'monitoring.collection_interval':
          const intervalValue = Number(value);
          if (isNaN(intervalValue) || intervalValue <= 0) {
            throw new Error(`监控数据收集间隔必须是正数（分钟）`);
          }
          if (intervalValue > 1440) { // 最大24小时
            throw new Error(`监控数据收集间隔不能超过1440分钟（24小时）`);
          }
          return intervalValue as SystemConfigs[K];
          
        case 'risk.assessment_interval_hours':
          const assessmentValue = Number(value);
          if (isNaN(assessmentValue) || assessmentValue <= 0) {
            throw new Error(`风险评估间隔必须是正数（小时）`);
          }
          if (assessmentValue > 168) { // 最大7天
            throw new Error(`风险评估间隔不能超过168小时（7天）`);
          }
          return assessmentValue as SystemConfigs[K];
          
        case 'risk.high_risk_threshold':
          const thresholdValue = Number(value);
          if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 1) {
            throw new Error(`高风险阈值必须是0-1之间的数值`);
          }
          return thresholdValue as SystemConfigs[K];
          
        case 'warning.auto_send':
        case 'notification.email_enabled':
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue !== 'true' && lowerValue !== 'false') {
              throw new Error(`${key} 必须是布尔值或'true'/'false'字符串`);
            }
            return (lowerValue === 'true') as SystemConfigs[K];
          }
          if (typeof value !== 'boolean') {
            throw new Error(`${key} 必须是布尔值`);
          }
          return Boolean(value) as SystemConfigs[K];
          
        case 'system.name':
          if (typeof value !== 'string') {
            throw new Error(`系统名称必须是字符串`);
          }
          const trimmedName = value.trim();
          if (trimmedName.length === 0) {
            throw new Error(`系统名称不能为空`);
          }
          if (trimmedName.length > 100) {
            throw new Error(`系统名称长度不能超过100个字符`);
          }
          return trimmedName as SystemConfigs[K];
          
        case 'emergency_contacts':
          if (!Array.isArray(value)) {
            throw new Error(`紧急联系人必须是数组`);
          }
          // 验证联系人格式
          for (let i = 0; i < value.length; i++) {
            const contact = value[i];
            if (typeof contact !== 'object' || !contact.name || !contact.phone) {
              throw new Error(`紧急联系人[${i}]必须包含name和phone属性`);
            }
            if (typeof contact.name !== 'string' || contact.name.trim().length === 0) {
              throw new Error(`紧急联系人[${i}]的姓名必须是非空字符串`);
            }
            if (typeof contact.phone !== 'string' || !/^[\d\-\+\(\)\s]+$/.test(contact.phone)) {
              throw new Error(`紧急联系人[${i}]的电话号码格式不正确`);
            }
          }
          return value as SystemConfigs[K];
          
        case 'map_default_center':
          if (typeof value !== 'object' || value === null) {
            throw new Error(`地图默认中心必须是对象`);
          }
          if (!('lat' in value) || !('lng' in value)) {
            throw new Error(`地图默认中心必须包含lat和lng属性`);
          }
          const lat = Number(value.lat);
          const lng = Number(value.lng);
          if (isNaN(lat) || isNaN(lng)) {
            throw new Error(`地图默认中心的lat和lng必须是数值`);
          }
          if (lat < -90 || lat > 90) {
            throw new Error(`纬度必须在-90到90之间`);
          }
          if (lng < -180 || lng > 180) {
            throw new Error(`经度必须在-180到180之间`);
          }
          return { lat, lng } as SystemConfigs[K];
          
        default:
          console.warn(`未知的配置项: ${key}，跳过验证`);
          return value as SystemConfigs[K];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`配置验证失败 [${key}]:`, errorMessage);
      throw new Error(`配置项 ${key} 验证失败: ${errorMessage}`);
    }
  }

  /**
   * 获取所有配置的统计信息
   */
  getCacheStats(): { totalCached: number; cacheHitRate: number } {
    const totalCached = Object.keys(this.cache).length;
    // 这里可以添加更详细的统计逻辑
    return {
      totalCached,
      cacheHitRate: 0 // 需要实现命中率统计
    };
  }
}

// 导出单例实例
export const configService = ConfigService.getInstance();