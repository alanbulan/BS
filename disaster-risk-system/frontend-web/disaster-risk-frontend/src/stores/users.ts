import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, ApiResponse, PaginatedResponse } from '../types'
import { usersApi } from '../api/modules/users'
import { ElMessage } from 'element-plus'

export const useUsersStore = defineStore('users', () => {
  // 状态
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const adminUsers = computed(() => 
    users.value.filter(user => user.role === 'admin')
  )

  const operatorUsers = computed(() => 
    users.value.filter(user => user.role === 'operator')
  )

  const activeUsers = computed(() => 
    users.value.filter(user => user.is_active === true)
  )

  const regularUsers = computed(() => 
    users.value.filter(user => user.role === 'user')
  )

  const inactiveUsers = computed(() => 
    users.value.filter(user => !user.is_active)
  )

  // 获取用户列表
  const getUsers = async (params?: any) => {
    try {
      isLoading.value = true
      const response: PaginatedResponse<User> = await usersApi.getUsers({
        page: currentPage.value,
        limit: pageSize.value,
        ...params
      })
      
      if (response.success) {
        users.value = response.data
        total.value = response.pagination?.total || 0
      } else {
        ElMessage.error(response.message || '获取用户列表失败')
      }
    } catch (error) {
      console.error('Get users error:', error)
      ElMessage.error('获取用户列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个用户详情
  const getUser = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<User> = await usersApi.getUser(id)
      
      if (response.success && response.data) {
        currentUser.value = response.data
        return response.data
      } else {
        ElMessage.error(response.message || '获取用户详情失败')
        return null
      }
    } catch (error) {
      console.error('Get user error:', error)
      ElMessage.error('获取用户详情失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建用户
  const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<User> = await usersApi.createUser(userData)
      
      if (response.success) {
        ElMessage.success('用户创建成功')
        await getUsers()
        return response.data
      } else {
        ElMessage.error(response.message || '用户创建失败')
        return null
      }
    } catch (error) {
      console.error('Create user error:', error)
      ElMessage.error('用户创建失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户
  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      isLoading.value = true
      const response: ApiResponse<User> = await usersApi.updateUser(id, userData)
      
      if (response.success) {
        ElMessage.success('用户更新成功')
        await getUsers()
        return response.data
      } else {
        ElMessage.error(response.message || '用户更新失败')
        return null
      }
    } catch (error) {
      console.error('Update user error:', error)
      ElMessage.error('用户更新失败')
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      isLoading.value = true
      const response: ApiResponse<null> = await usersApi.deleteUser(id)
      
      if (response.success) {
        ElMessage.success('用户删除成功')
        await getUsers()
        return true
      } else {
        ElMessage.error(response.message || '用户删除失败')
        return false
      }
    } catch (error) {
      console.error('Delete user error:', error)
      ElMessage.error('用户删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 批量删除用户
  const batchDeleteUsers = async (ids: number[]) => {
    try {
      isLoading.value = true
      // 批量删除需要逐个调用单个删除接口
      const deletePromises = ids.map(id => usersApi.deleteUser(id))
      const responses = await Promise.all(deletePromises)
      const allSuccess = responses.every(response => response.success)
      
      if (allSuccess) {
        ElMessage.success('用户批量删除成功')
        await getUsers()
        return true
      } else {
        ElMessage.error('部分用户删除失败')
        return false
      }
    } catch (error) {
      console.error('Batch delete users error:', error)
      ElMessage.error('用户批量删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 切换用户状态
  const toggleUserStatus = async (id: number, isActive: boolean) => {
    try {
      const response: ApiResponse<User> = await usersApi.toggleUserStatus(id, isActive)
      
      if (response.success) {
        ElMessage.success('用户状态更新成功')
        await getUsers()
        return response.data
      } else {
        ElMessage.error(response.message || '用户状态更新失败')
        return null
      }
    } catch (error) {
      console.error('Toggle user status error:', error)
      ElMessage.error('用户状态更新失败')
      return null
    }
  }

  // 重置用户密码 - 功能暂不可用
  const resetUserPassword = async () => {
    try {
      ElMessage.error('密码重置功能暂不可用')
      return null
    } catch (error) {
      console.error('Reset user password error:', error)
      ElMessage.error('密码重置失败')
      return null
    }
  }

  // 更新用户角色
  const updateUserRole = async (id: number, role: string) => {
    try {
      const response: ApiResponse<User> = await usersApi.updateUser(id, { role: role as 'user' | 'admin' | 'operator' })
      
      if (response.success) {
        ElMessage.success('用户角色更新成功')
        await getUsers()
        return response.data
      } else {
        ElMessage.error(response.message || '用户角色更新失败')
        return null
      }
    } catch (error) {
      console.error('Update user role error:', error)
      ElMessage.error('用户角色更新失败')
      return null
    }
  }

  // 获取用户统计
  const getUserStats = async () => {
    try {
      const response = await usersApi.getUserStats()
      
      if (response.success) {
        return response.data
      } else {
        ElMessage.error(response.message || '获取用户统计失败')
        return null
      }
    } catch (error) {
      console.error('Get user stats error:', error)
      ElMessage.error('获取用户统计失败')
      return null
    }
  }

  // 重置状态
  const resetState = () => {
    users.value = []
    currentUser.value = null
    isLoading.value = false
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    users,
    currentUser,
    isLoading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    adminUsers,
    operatorUsers,
    regularUsers,
    activeUsers,
    inactiveUsers,
    
    // 方法
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    batchDeleteUsers,
    toggleUserStatus,
    resetUserPassword,
    updateUserRole,
    getUserStats,
    resetState
  }
})