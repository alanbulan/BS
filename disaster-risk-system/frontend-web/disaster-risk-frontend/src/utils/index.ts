import { ElMessage } from 'element-plus'

// 格式化日期时间
export const formatDateTime = (date: string | Date | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// 格式化日期
export const formatDate = (date: string | Date): string => {
  return formatDateTime(date, 'YYYY-MM-DD')
}

// 格式化时间
export const formatTime = (date: string | Date): string => {
  return formatDateTime(date, 'HH:mm:ss')
}

// 相对时间格式化
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

// 数字格式化
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 风险等级颜色映射
export const getRiskLevelColor = (level: number): string => {
  const colors = {
    1: '#52c41a', // 绿色 - 低风险
    2: '#faad14', // 黄色 - 较低风险
    3: '#fa8c16', // 橙色 - 中等风险
    4: '#f5222d', // 红色 - 高风险
    5: '#722ed1'  // 紫色 - 极高风险
  }
  return colors[level as keyof typeof colors] || '#d9d9d9'
}

// 风险等级文本映射
export const getRiskLevelText = (level: number): string => {
  const texts = {
    1: '低风险',
    2: '较低风险',
    3: '中等风险',
    4: '高风险',
    5: '极高风险'
  }
  return texts[level as keyof typeof texts] || '未知'
}

// 预警等级颜色映射
export const getWarningLevelColor = (level: number): string => {
  const colors = {
    1: '#1890ff', // 蓝色 - 一般
    2: '#faad14', // 黄色 - 较重
    3: '#fa8c16', // 橙色 - 严重
    4: '#f5222d'  // 红色 - 特别严重
  }
  return colors[level as keyof typeof colors] || '#d9d9d9'
}

// 预警等级文本映射
export const getWarningLevelText = (level: number): string => {
  const texts = {
    1: '一般',
    2: '较重',
    3: '严重',
    4: '特别严重'
  }
  return texts[level as keyof typeof texts] || '未知'
}

// 用户角色文本映射
export const getUserRoleText = (role: string): string => {
  const texts = {
    'user': '普通用户',
    'expert': '专家用户',
    'admin': '管理员'
  }
  return texts[role as keyof typeof texts] || '未知角色'
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === 'object') {
    const clonedObj = {} as any
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// 生成唯一ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// 验证邮箱
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// 验证手机号
export const validatePhone = (phone: string): boolean => {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

// 验证密码强度
export const validatePassword = (password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  message: string
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      strength: 'weak',
      message: '密码长度至少6位'
    }
  }
  
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^\w\s]/.test(password)) score++
  
  if (score < 3) {
    return {
      isValid: true,
      strength: 'weak',
      message: '密码强度较弱'
    }
  } else if (score < 4) {
    return {
      isValid: true,
      strength: 'medium',
      message: '密码强度中等'
    }
  } else {
    return {
      isValid: true,
      strength: 'strong',
      message: '密码强度较强'
    }
  }
}

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
    return true
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
    return false
  }
}

// 下载文件
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 获取文件扩展名
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 检查是否为图片文件
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = getFileExtension(filename).toLowerCase()
  return imageExtensions.includes(extension)
}

// 地理坐标转换
export const formatCoordinate = (lng: number, lat: number): string => {
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
}

// 计算两点间距离（简化版）
export const calculateDistance = (lng1: number, lat1: number, lng2: number, lat2: number): number => {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}