/**
 * 错误处理 Composable
 * 统一处理API错误、表单验证错误等
 */

import { ElMessage } from 'element-plus'

export interface ApiError {
  response?: {
    data?: {
      message?: string
      error?: string
    }
    status?: number
  }
  message?: string
}

/**
 * 错误处理 Hook
 */
export function useErrorHandler() {
  /**
   * 处理API错误
   * @param error 错误对象
   * @param defaultMsg 默认错误消息
   * @param silent 是否静默（不显示消息）
   * @returns 错误消息
   */
  const handleApiError = (error: any, defaultMsg: string = '操作失败', silent: boolean = false): string => {
    let message = defaultMsg

    if (error) {
      // 尝试从响应中提取错误消息
      const apiError = error as ApiError
      message = 
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        apiError.message ||
        defaultMsg

      // 处理特定HTTP状态码
      if (apiError.response?.status === 401) {
        message = '登录已过期，请重新登录'
      } else if (apiError.response?.status === 403) {
        message = '没有权限执行此操作'
      } else if (apiError.response?.status === 404) {
        message = '请求的资源不存在'
      } else if (apiError.response?.status === 500) {
        message = '服务器内部错误'
      }
    }

    // 控制台输出详细错误
    console.error('API Error:', error)

    // 显示错误消息
    if (!silent) {
      ElMessage.error(message)
    }

    return message
  }

  /**
   * 处理表单验证错误
   * @param error 验证错误对象
   * @param defaultMsg 默认错误消息
   */
  const handleValidationError = (error: any, defaultMsg: string = '表单验证失败'): void => {
    if (error === false) {
      // 表单验证失败（element-plus validate返回false）
      ElMessage.warning(defaultMsg)
    } else if (error && typeof error === 'object') {
      // 其他验证错误
      const message = error.message || defaultMsg
      ElMessage.warning(message)
    }
  }

  /**
   * 处理批量操作错误
   * @param results Promise.allSettled的结果数组
   * @param successMsg 成功消息模板
   * @param failMsg 失败消息模板
   */
  const handleBatchResults = (
    results: PromiseSettledResult<any>[],
    successMsg: string = '操作完成',
    failMsg: string = '部分操作失败'
  ): void => {
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.length - successCount

    if (failCount === 0) {
      ElMessage.success(`${successMsg}，共处理 ${successCount} 项`)
    } else if (successCount === 0) {
      ElMessage.error(`${failMsg}，全部 ${failCount} 项失败`)
    } else {
      ElMessage.warning(`${successMsg} ${successCount} 项，${failMsg} ${failCount} 项`)
    }
  }

  /**
   * 包装异步操作，自动处理错误
   * @param fn 异步函数
   * @param errorMsg 错误消息
   * @param successMsg 成功消息（可选）
   * @returns 包装后的函数
   */
  const wrapAsyncAction = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorMsg: string,
    successMsg?: string
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      try {
        const result = await fn(...args)
        if (successMsg) {
          ElMessage.success(successMsg)
        }
        return result
      } catch (error) {
        handleApiError(error, errorMsg)
        return null
      }
    }
  }

  return {
    handleApiError,
    handleValidationError,
    handleBatchResults,
    wrapAsyncAction
  }
}


