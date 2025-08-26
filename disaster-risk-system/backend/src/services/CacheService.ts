import redisConfig from '../config/redis';

class CacheService {
  private readonly CACHE_PREFIX = 'disaster_risk:';
  private readonly SYSTEM_CONFIG_PREFIX = 'system_config:';
  private readonly DEFAULT_EXPIRE_TIME = 3600; // 1小时

  /**
   * 生成缓存键
   */
  private generateKey(type: string, key: string): string {
    return `${this.CACHE_PREFIX}${type}${key}`;
  }

  /**
   * 设置系统配置缓存
   */
  async setSystemConfig(key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      const cacheKey = this.generateKey(this.SYSTEM_CONFIG_PREFIX, key);
      const cacheValue = JSON.stringify(value);
      await redisConfig.set(cacheKey, cacheValue, expireInSeconds || this.DEFAULT_EXPIRE_TIME);
    } catch (error) {
      console.error('Failed to set system config cache:', error);
      // 缓存失败不应该影响主要功能
    }
  }

  /**
   * 获取系统配置缓存
   */
  async getSystemConfig(key: string): Promise<any | null> {
    try {
      const cacheKey = this.generateKey(this.SYSTEM_CONFIG_PREFIX, key);
      const cacheValue = await redisConfig.get(cacheKey);
      return cacheValue ? JSON.parse(cacheValue) : null;
    } catch (error) {
      console.error('Failed to get system config cache:', error);
      return null;
    }
  }

  /**
   * 删除系统配置缓存
   */
  async deleteSystemConfig(key: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(this.SYSTEM_CONFIG_PREFIX, key);
      await redisConfig.del(cacheKey);
    } catch (error) {
      console.error('Failed to delete system config cache:', error);
    }
  }

  /**
   * 清除所有系统配置缓存
   */
  async clearSystemConfigCache(): Promise<void> {
    try {
      const pattern = this.generateKey(this.SYSTEM_CONFIG_PREFIX, '*');
      const keys = await redisConfig.keys(pattern);
      
      if (keys.length > 0) {
        for (const key of keys) {
          await redisConfig.del(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear system config cache:', error);
      throw error;
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    try {
      await redisConfig.flushAll();
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      throw error;
    }
  }

  /**
   * 设置通用缓存
   */
  async set(type: string, key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      const cacheKey = this.generateKey(type, key);
      const cacheValue = JSON.stringify(value);
      await redisConfig.set(cacheKey, cacheValue, expireInSeconds || this.DEFAULT_EXPIRE_TIME);
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  /**
   * 获取通用缓存
   */
  async get(type: string, key: string): Promise<any | null> {
    try {
      const cacheKey = this.generateKey(type, key);
      const cacheValue = await redisConfig.get(cacheKey);
      return cacheValue ? JSON.parse(cacheValue) : null;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * 删除通用缓存
   */
  async delete(type: string, key: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(type, key);
      await redisConfig.del(cacheKey);
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  }

  /**
   * 检查Redis连接状态
   */
  isConnected(): boolean {
    return redisConfig.isClientConnected();
  }
}

export const cacheService = new CacheService();
export default cacheService;