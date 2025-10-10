/**
 * JSON处理工具函数
 * 提供安全的JSON解析、验证和格式化功能
 */

/**
 * 安全解析JSON字符串
 * @param str JSON字符串
 * @param defaultValue 解析失败时的默认值
 * @returns 解析后的对象或默认值
 */
export function parseJsonSafe<T = any>(str: string | null | undefined, defaultValue: T): T {
  if (!str || typeof str !== 'string') {
    return defaultValue
  }

  const trimmed = str.trim()
  if (trimmed === '') {
    return defaultValue
  }

  try {
    return JSON.parse(trimmed) as T
  } catch (e) {
    console.warn('JSON解析失败:', e)
    return defaultValue
  }
}

/**
 * 验证字符串是否为有效的JSON格式
 * @param str 待验证的字符串
 * @returns 是否为有效JSON
 */
export function validateJson(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') {
    return false
  }

  const trimmed = str.trim()
  if (trimmed === '') {
    return true // 空字符串视为有效（允许不填）
  }

  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

/**
 * 格式化JSON用于显示
 * @param obj 要格式化的对象
 * @param indent 缩进空格数，默认2
 * @returns 格式化后的JSON字符串
 */
export function formatJsonForDisplay(obj: any, indent: number = 2): string {
  if (obj === null || obj === undefined) {
    return ''
  }

  try {
    // 如果是字符串，先解析再格式化
    if (typeof obj === 'string') {
      const parsed = JSON.parse(obj)
      return JSON.stringify(parsed, null, indent)
    }
    return JSON.stringify(obj, null, indent)
  } catch (e) {
    return String(obj)
  }
}

/**
 * 解析JSON字段并提供错误提示
 * 用于表单提交前的验证
 * @param jsonStr JSON字符串
 * @param fieldName 字段名称（用于错误提示）
 * @returns 解析后的对象，失败抛出错误
 */
export function parseJsonField(jsonStr: string, fieldName: string): any {
  const trimmed = jsonStr.trim()
  
  if (!trimmed) {
    return null
  }

  try {
    return JSON.parse(trimmed)
  } catch (error) {
    throw new Error(`${fieldName}格式错误，请输入有效的JSON`)
  }
}

/**
 * 将对象转换为JSON字符串（用于编辑表单回填）
 * @param obj 对象
 * @returns JSON字符串，对象为空时返回空字符串
 */
export function objectToJsonString(obj: any): string {
  if (!obj || (typeof obj === 'object' && Object.keys(obj).length === 0)) {
    return ''
  }

  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return ''
  }
}

/**
 * 批量解析多个JSON字段
 * @param fields 字段映射对象 { fieldName: jsonString }
 * @returns 解析结果对象，包含成功和失败的字段
 */
export function parseMultipleJsonFields(fields: Record<string, string>): {
  success: Record<string, any>
  errors: Record<string, string>
} {
  const success: Record<string, any> = {}
  const errors: Record<string, string> = {}

  for (const [fieldName, jsonStr] of Object.entries(fields)) {
    try {
      success[fieldName] = parseJsonField(jsonStr, fieldName)
    } catch (error) {
      errors[fieldName] = (error as Error).message
    }
  }

  return { success, errors }
}

/**
 * 判断值是否为JSON对象或数组
 * @param value 待判断的值
 * @returns 是否为JSON
 */
export function isJsonValue(value: any): boolean {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'object') {
    return true
  }

  if (typeof value === 'string') {
    return validateJson(value)
  }

  return false
}


