<template>
  <div class="login-container">
    <!-- 左侧装饰区域 -->
    <div class="login-decoration">
      <div class="decoration-content">
        <div class="logo-section">
          <div class="logo-icon">
            <el-icon :size="80"><Warning /></el-icon>
          </div>
          <h1 class="system-name">地质灾害风险评估系统</h1>
          <p class="system-desc">智能监测 · 风险预警 · 应急响应</p>
        </div>
        
        <div class="feature-list">
          <div class="feature-item">
            <el-icon :size="24"><Monitor /></el-icon>
            <div class="feature-text">
              <h4>实时监测</h4>
              <p>多点位全天候监控</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><TrendCharts /></el-icon>
            <div class="feature-text">
              <h4>智能分析</h4>
              <p>AI驱动风险评估</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Bell /></el-icon>
            <div class="feature-text">
              <h4>预警通知</h4>
              <p>多渠道及时预警</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-wrapper">
      <div class="login-form-container">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p class="form-subtitle">请登录您的账户以继续</p>
        </div>
        
        <el-form 
          :model="loginForm" 
          :rules="rules" 
          ref="formRef"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <el-link type="primary" :underline="false">忘记密码?</el-link>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="handleLogin"
              :loading="loading"
              size="large"
              class="login-btn"
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <el-divider>
            <span class="divider-text">快速登录</span>
          </el-divider>
          <div class="quick-login">
            <el-tooltip content="测试账号：admin / 123456" placement="top">
              <el-button circle @click="quickLogin('admin')">
                <el-icon><UserFilled /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="测试账号：manager / 123456" placement="top">
              <el-button circle @click="quickLogin('manager')">
                <el-icon><User /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="copyright">
        <p>&copy; 2025 地质灾害风险评估系统. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import type { FormInstance } from 'element-plus'
import { 
  User, Lock, Warning, Monitor, TrendCharts, Bell, UserFilled 
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const formRef = ref<FormInstance>()
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 调用登录API
    const { authApi } = await import('../../api/modules/auth')
    const response = await authApi.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (response.success) {
      const { user, accessToken, refreshToken } = response.data
      authStore.login(user, { accessToken, refreshToken })
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(response.message || '登录失败')
    }
    
  } catch (error: any) {
    console.error('登录错误:', error)
    ElMessage.error(error.response?.data?.message || '登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 快速登录（用于测试）
const quickLogin = async (username: string) => {
  loginForm.username = username
  loginForm.password = '123456'
  await handleLogin()
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 左侧装饰区域 */
.login-decoration {
  flex: 1;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.login-decoration::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.decoration-content {
  position: relative;
  z-index: 1;
  color: white;
  max-width: 500px;
}

.logo-section {
  text-align: center;
  margin-bottom: 60px;
}

.logo-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.system-name {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.system-desc {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  letter-spacing: 2px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(10px);
}

.feature-item .el-icon {
  flex-shrink: 0;
}

.feature-text {
  flex: 1;
}

.feature-text h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
}

.feature-text p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

/* 右侧登录表单区域 */
.login-form-wrapper {
  width: 480px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 50px 30px;
}

.login-form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 40px;
}

.form-header h2 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.form-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-top: 20px;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.form-footer {
  margin-top: 32px;
}

.divider-text {
  color: #909399;
  font-size: 13px;
}

.quick-login {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.quick-login .el-button {
  width: 48px;
  height: 48px;
  font-size: 18px;
  transition: all 0.3s ease;
}

.quick-login .el-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.copyright {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.copyright p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .login-decoration {
    display: none;
  }
  
  .login-form-wrapper {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 576px) {
  .login-form-wrapper {
    padding: 40px 30px 20px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .system-name {
    font-size: 26px;
  }
}

/* Element Plus 组件样式覆盖 */
.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
</style>