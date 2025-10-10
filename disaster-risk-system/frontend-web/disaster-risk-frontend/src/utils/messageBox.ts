import { ElMessageBox } from 'element-plus'
import type { ElMessageBoxOptions } from 'element-plus'

/**
 * 统一的确认对话框
 * 自动处理取消操作，避免 "Uncaught (in promise) cancel" 警告
 */
export async function confirm(
  message: string,
  title: string = '确认操作',
  options?: ElMessageBoxOptions
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      ...options
    })
    return true
  } catch (error) {
    // 用户取消操作，返回 false
    if (error === 'cancel' || error === 'close') {
      return false
    }
    // 其他错误，抛出
    throw error
  }
}

/**
 * 危险操作确认对话框
 */
export async function confirmDelete(
  message: string,
  title: string = '确认删除'
): Promise<boolean> {
  return confirm(message, title, {
    type: 'error',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  })
}

/**
 * 警告确认对话框
 */
export async function confirmWarning(
  message: string,
  title: string = '警告'
): Promise<boolean> {
  return confirm(message, title, {
    type: 'warning'
  })
}

/**
 * 信息确认对话框
 */
export async function confirmInfo(
  message: string,
  title: string = '提示'
): Promise<boolean> {
  return confirm(message, title, {
    type: 'info'
  })
}

/**
 * 输入对话框（prompt）
 * 自动处理取消操作
 */
export async function prompt(
  message: string,
  title: string = '请输入',
  options?: ElMessageBoxOptions
): Promise<string | null> {
  try {
    const { value } = await ElMessageBox.prompt(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入内容',
      ...options
    })
    return value || ''
  } catch (error) {
    // 用户取消操作，返回 null
    if (error === 'cancel' || error === 'close') {
      return null
    }
    // 其他错误，抛出
    throw error
  }
}
