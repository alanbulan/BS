// 日期时间工具函数

// 时间格式常量
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  CHINESE_DATE: 'YYYY年MM月DD日',
  CHINESE_DATETIME: 'YYYY年MM月DD日 HH:mm:ss'
};

// 时区常量
export const TIMEZONES = {
  UTC: 'UTC',
  BEIJING: 'Asia/Shanghai',
  TOKYO: 'Asia/Tokyo',
  NEW_YORK: 'America/New_York',
  LONDON: 'Europe/London'
};

// 获取当前时间戳
export const now = (): number => {
  return Date.now();
};

// 获取当前UTC时间
export const utcNow = (): Date => {
  return new Date();
};

// 获取当前北京时间
export const beijingNow = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000)); // UTC+8
};

// 格式化日期
export const formatDate = (date: Date | string | number, format: string = DATE_FORMATS.DATETIME): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const milliseconds = String(d.getMilliseconds()).padStart(3, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('SSS', milliseconds);
};

// 解析日期字符串
export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  return date;
};

// 判断是否为有效日期
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// 计算两个日期之间的差值
export const dateDiff = (date1: Date | string, date2: Date | string, unit: 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds' = 'days'): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  
  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    default:
      return diffMs;
  }
};

// 添加时间
export const addTime = (date: Date | string, amount: number, unit: 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'): Date => {
  const d = new Date(date);
  
  switch (unit) {
    case 'milliseconds':
      d.setMilliseconds(d.getMilliseconds() + amount);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
  }
  
  return d;
};

// 减去时间
export const subtractTime = (date: Date | string, amount: number, unit: 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'): Date => {
  return addTime(date, -amount, unit);
};

// 获取日期的开始时间（00:00:00）
export const startOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 获取日期的结束时间（23:59:59.999）
export const endOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// 获取月份的开始时间
export const startOfMonth = (date: Date | string): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 获取月份的结束时间
export const endOfMonth = (date: Date | string): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

// 获取年份的开始时间
export const startOfYear = (date: Date | string): Date => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 获取年份的结束时间
export const endOfYear = (date: Date | string): Date => {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
};

// 判断是否为同一天
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// 判断是否为今天
export const isToday = (date: Date | string): boolean => {
  return isSameDay(date, new Date());
};

// 判断是否为昨天
export const isYesterday = (date: Date | string): boolean => {
  const yesterday = subtractTime(new Date(), 1, 'days');
  return isSameDay(date, yesterday);
};

// 判断是否为明天
export const isTomorrow = (date: Date | string): boolean => {
  const tomorrow = addTime(new Date(), 1, 'days');
  return isSameDay(date, tomorrow);
};

// 获取相对时间描述
export const getRelativeTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  if (diffMs < 0) {
    // 未来时间
    const absDiff = Math.abs(diffMs);
    if (absDiff < 60000) {
      return '即将';
    } else if (absDiff < 3600000) {
      return `${Math.floor(absDiff / 60000)}分钟后`;
    } else if (absDiff < 86400000) {
      return `${Math.floor(absDiff / 3600000)}小时后`;
    } else {
      return `${Math.floor(absDiff / 86400000)}天后`;
    }
  } else {
    // 过去时间
    if (diffMs < 60000) {
      return '刚刚';
    } else if (diffMs < 3600000) {
      return `${Math.floor(diffMs / 60000)}分钟前`;
    } else if (diffMs < 86400000) {
      return `${Math.floor(diffMs / 3600000)}小时前`;
    } else if (diffMs < 2592000000) {
      return `${Math.floor(diffMs / 86400000)}天前`;
    } else {
      return formatDate(d, DATE_FORMATS.DATE_ONLY);
    }
  }
};

// 获取时间范围
export const getTimeRange = (type: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'): { start: Date; end: Date } => {
  const now = new Date();
  
  switch (type) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
    
    case 'yesterday':
      const yesterday = subtractTime(now, 1, 'days');
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      };
    
    case 'week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return {
        start: startOfDay(startOfWeek),
        end: endOfDay(now)
      };
    
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    
    case 'last7days':
      return {
        start: startOfDay(subtractTime(now, 7, 'days')),
        end: endOfDay(now)
      };
    
    case 'last30days':
      return {
        start: startOfDay(subtractTime(now, 30, 'days')),
        end: endOfDay(now)
      };
    
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
  }
};

// 转换时区
export const convertTimezone = (date: Date | string, fromTimezone: string, toTimezone: string): Date => {
  // 简化版本，实际项目中建议使用 moment-timezone 或 date-fns-tz
  const d = new Date(date);
  
  // 这里只处理UTC和北京时间的转换
  if (fromTimezone === TIMEZONES.UTC && toTimezone === TIMEZONES.BEIJING) {
    return new Date(d.getTime() + 8 * 3600000);
  } else if (fromTimezone === TIMEZONES.BEIJING && toTimezone === TIMEZONES.UTC) {
    return new Date(d.getTime() - 8 * 3600000);
  }
  
  return d;
};

// 获取时间戳
export const getTimestamp = (date?: Date | string): number => {
  return date ? new Date(date).getTime() : Date.now();
};

// 从时间戳创建日期
export const fromTimestamp = (timestamp: number): Date => {
  return new Date(timestamp);
};

// 获取Unix时间戳（秒）
export const getUnixTimestamp = (date?: Date | string): number => {
  return Math.floor(getTimestamp(date) / 1000);
};

// 从Unix时间戳创建日期
export const fromUnixTimestamp = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};