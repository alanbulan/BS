<template>
  <div class="profile-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>个人资料</h2>
        <p>管理您的个人信息和账户设置</p>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="avatar-section">
            <el-avatar 
              :size="120" 
              :src="userForm.avatar_url ? `http://localhost:3000${userForm.avatar_url}` : undefined"
            >
              <el-icon :size="60"><User /></el-icon>
            </el-avatar>
            <el-upload
              :show-file-list="false"
              :before-upload="handleAvatarUpload"
              :http-request="uploadAvatar"
              action="#"
              accept="image/*"
            >
              <el-button type="primary" size="small" class="upload-btn" :loading="uploading">
                <el-icon v-if="!uploading"><Upload /></el-icon>
                {{ uploading ? '上传中...' : '更换头像' }}
              </el-button>
            </el-upload>
          </div>
          
          <div class="user-summary">
            <h3>{{ userForm.full_name || userForm.username }}</h3>
            <p class="user-role">
              <el-tag :type="getRoleType(userForm.role || '')">
                {{ getRoleLabel(userForm.role || '') }}
              </el-tag>
            </p>
            <div class="user-meta">
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>注册时间：{{ userForm.created_at ? formatDate(userForm.created_at) : '-' }}</span>
              </div>
              <div class="meta-item" v-if="userForm.last_login">
                <el-icon><Clock /></el-icon>
                <span>最后登录：{{ formatDateTime(userForm.last_login) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 账户状态 -->
        <el-card class="status-card">
          <template #header>
            <span>账户状态</span>
          </template>
          <div class="status-list">
            <div class="status-item">
              <span>账户状态</span>
              <el-tag :type="userForm.is_active ? 'success' : 'danger'" size="small">
                {{ userForm.is_active ? '正常' : '已停用' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span>邮箱验证</span>
              <el-tag type="success" size="small">已验证</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :span="16">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <!-- 基本信息标签页 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-card>
              <el-form 
                :model="userForm" 
                :rules="userRules" 
                ref="userFormRef"
                label-width="100px"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="userForm.username" disabled />
                </el-form-item>
                
                <el-form-item label="姓名" prop="full_name">
                  <el-input v-model="userForm.full_name" placeholder="请输入姓名" />
                </el-form-item>
                
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="userForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="userForm.phone" placeholder="请输入手机号" />
                </el-form-item>
                
                <el-form-item label="部门" prop="department">
                  <el-input v-model="userForm.department" placeholder="请输入部门" />
                </el-form-item>
                
                <el-form-item label="职位" prop="position">
                  <el-input v-model="userForm.position" placeholder="请输入职位" />
                </el-form-item>
                
                <el-form-item label="位置" prop="location">
                  <el-input v-model="userForm.location" placeholder="请输入位置" />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="handleUpdateProfile" :loading="updating">
                    <el-icon><Check /></el-icon>
                    保存修改
                  </el-button>
                  <el-button @click="resetForm">
                    <el-icon><RefreshLeft /></el-icon>
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 安全设置标签页 -->
          <el-tab-pane label="安全设置" name="security">
            <el-card>
              <template #header>
                <div class="card-header-content">
                  <span>修改密码</span>
                  <el-tag type="info" size="small">建议定期更新密码</el-tag>
                </div>
              </template>
              
              <el-form 
                :model="passwordForm" 
                :rules="passwordRules" 
                ref="passwordFormRef"
                label-width="120px"
              >
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input 
                    v-model="passwordForm.oldPassword" 
                    type="password" 
                    placeholder="请输入当前密码"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="新密码" prop="newPassword">
                  <el-input 
                    v-model="passwordForm.newPassword" 
                    type="password" 
                    placeholder="请输入新密码（至少6位）"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input 
                    v-model="passwordForm.confirmPassword" 
                    type="password" 
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
                    <el-icon><Lock /></el-icon>
                    修改密码
                  </el-button>
                  <el-button @click="resetPasswordForm">
                    <el-icon><RefreshLeft /></el-icon>
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 安全提示 -->
            <el-alert
              title="安全提示"
              type="info"
              :closable="false"
              style="margin-top: 20px;"
            >
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>密码长度至少为6位字符</li>
                <li>建议使用字母、数字和特殊字符的组合</li>
                <li>不要使用过于简单或容易被猜到的密码</li>
                <li>定期更换密码以保证账户安全</li>
              </ul>
            </el-alert>
          </el-tab-pane>

          <!-- 系统信息标签页 -->
          <el-tab-pane label="系统信息" name="system">
            <el-card>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="用户ID">
                  {{ userForm.id }}
                </el-descriptions-item>
                <el-descriptions-item label="用户名">
                  {{ userForm.username }}
                </el-descriptions-item>
                <el-descriptions-item label="角色">
                  <el-tag :type="getRoleType(userForm.role || '')">
                    {{ getRoleLabel(userForm.role || '') }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="账户状态">
                  <el-tag :type="userForm.is_active ? 'success' : 'danger'">
                    {{ userForm.is_active ? '激活' : '停用' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="注册时间">
                  {{ userForm.created_at ? formatDateTime(userForm.created_at) : '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="最后登录">
                  {{ userForm.last_login ? formatDateTime(userForm.last_login) : '暂无记录' }}
                </el-descriptions-item>
                <el-descriptions-item label="最后更新">
                  {{ userForm.updated_at ? formatDateTime(userForm.updated_at) : '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  User, Calendar, Clock, Upload, Check, RefreshLeft, Lock 
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/modules/auth'
import { usersApi } from '@/api/modules/users'
import type { User as UserType } from '@/types'

const authStore = useAuthStore()
const activeTab = ref('basic')
const uploading = ref(false)

// 表单引用
const userFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 用户信息表单
const userForm = reactive<Partial<UserType>>({
  id: 0,
  username: '',
  email: '',
  full_name: '',
  phone: '',
  role: '',
  department: '',
  position: '',
  location: '',
  avatar_url: '',
  is_active: true,
  created_at: '',
  updated_at: '',
  last_login: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 加载状态
const updating = ref(false)
const changingPassword = ref(false)

// 表单验证规则
const userRules: FormRules = {
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取用户信息
const fetchUserProfile = async () => {
  try {
    const response = await authApi.getCurrentUser()
    if (response.success && response.data) {
      Object.assign(userForm, response.data)
      // 同时更新store中的用户信息
      authStore.user = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 更新个人资料
const handleUpdateProfile = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    updating.value = true
    
    console.log('开始更新个人资料, 用户ID:', userForm.id)
    
    const response = await usersApi.updateUser(userForm.id!, {
      full_name: userForm.full_name,
      email: userForm.email,
      phone: userForm.phone,
      department: userForm.department,
      position: userForm.position,
      location: userForm.location
    })
    
    console.log('更新响应:', response)
    
    if (response.success) {
      ElMessage.success('个人资料更新成功')
      await fetchUserProfile()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新个人资料失败:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(`更新失败: ${error.message}`)
    } else {
      ElMessage.error('更新失败，请稍后重试')
    }
  } finally {
    updating.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    const response = await authApi.changePassword({
      currentPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response.success) {
      ElMessage.success('密码修改成功，请重新登录')
      resetPasswordForm()
      // 等待1秒后退出登录
      setTimeout(() => {
        authStore.logout()
        window.location.href = '/login'
      }, 1000)
    } else {
      ElMessage.error(response.message || '密码修改失败')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('修改密码失败，请稍后重试')
    }
  } finally {
    changingPassword.value = false
  }
}

// 处理头像上传前的验证
const handleAvatarUpload = (file: File) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  // 检查文件大小（2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  
  return true // 验证通过，继续上传
}

// 自定义上传函数
const uploadAvatar = async (options: any) => {
  const { file } = options
  uploading.value = true
  
  try {
    console.log('[AVATAR-WEB] 开始上传头像...')
    
    // 1. 上传图片到服务器
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/uploads/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      },
      body: formData
    })
    
    const uploadResult = await uploadResponse.json()
    console.log('[AVATAR-WEB] 上传结果:', uploadResult)
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.message || '上传失败')
    }
    
    const avatarUrl = uploadResult.data.url
    console.log('[AVATAR-WEB] 图片URL:', avatarUrl)
    
    // 2. 更新用户头像
    const updateResponse = await fetch(`http://localhost:3000/api/v1/users/${authStore.user?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.accessToken}`
      },
      body: JSON.stringify({
        avatar_url: avatarUrl
      })
    })
    
    const updateResult = await updateResponse.json()
    
    if (updateResult.success) {
      // 更新本地数据
      userForm.avatar_url = avatarUrl
      if (authStore.user) {
        const updatedUser = { ...authStore.user, avatar_url: avatarUrl }
        authStore.user = updatedUser
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      ElMessage.success('头像更新成功')
      console.log('[AVATAR-WEB] 头像更新成功')
    } else {
      throw new Error(updateResult.message || '更新失败')
    }
  } catch (error: any) {
    console.error('[AVATAR-WEB] 上传失败:', error)
    ElMessage.error(error.message || '头像上传失败')
  } finally {
    uploading.value = false
  }
}

// 重置表单
const resetForm = () => {
  fetchUserProfile()
}

const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

// 获取角色标签
const getRoleLabel = (role: string) => {
  const roleMap: Record<string, string> = {
    'admin': '系统管理员',
    'manager': '管理员',
    'operator': '操作员',
    'viewer': '观察员',
    'user': '普通用户'
  }
  return roleMap[role] || role
}

// 获取角色类型
const getRoleType = (role: string): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    'admin': 'danger',
    'manager': 'warning',
    'operator': 'success',
    'viewer': 'info',
    'user': 'info'
  }
  return typeMap[role] || 'info'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 个人信息卡片 */
.profile-card {
  margin-bottom: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-section .el-avatar {
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.upload-btn {
  margin-top: 8px;
}

.user-summary {
  padding: 20px 0;
  text-align: center;
}

.user-summary h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.user-role {
  margin: 0 0 16px 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.meta-item .el-icon {
  font-size: 14px;
  color: #909399;
}

/* 状态卡片 */
.status-card {
  margin-bottom: 20px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.status-item span:first-child {
  color: #606266;
}

/* 标签页 */
.profile-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.profile-tabs :deep(.el-tabs__header) {
  padding: 0 20px;
  margin: 0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

.profile-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

.profile-tabs :deep(.el-card) {
  box-shadow: none;
  border: none;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 表单样式 */
.el-form {
  max-width: 600px;
}

.el-form-item {
  margin-bottom: 22px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .profile-container :deep(.el-col) {
    width: 100%;
    max-width: 100%;
  }
  
  .profile-container :deep(.el-row) {
    display: block;
  }
  
  .profile-card,
  .status-card {
    margin-bottom: 20px;
  }
}
</style>

