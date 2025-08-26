<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <div class="layout-header">
      <div class="header-left">
        <el-button 
          type="text" 
          @click="toggleSidebar"
          class="sidebar-toggle"
        >
          <el-icon size="20">
            <Menu v-if="!sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </el-button>
        <h1 class="system-title">地质灾害风险评估系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleUserCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="authStore.user?.avatar_url">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="username">{{ authStore.user?.username || '用户' }}</span>
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="layout-content">
      <!-- 侧边栏 -->
      <div class="layout-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <el-menu
          :default-active="activeMenu"
          :collapse="sidebarCollapsed"
          :unique-opened="true"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <template #title>仪表板</template>
          </el-menu-item>
          
          <el-menu-item index="/risk-zones">
            <el-icon><Location /></el-icon>
            <template #title>风险区域</template>
          </el-menu-item>
          
          <el-menu-item index="/monitoring">
            <el-icon><Monitor /></el-icon>
            <template #title>监测管理</template>
          </el-menu-item>
          
          <el-menu-item index="/warnings">
            <el-icon><Warning /></el-icon>
            <template #title>预警管理</template>
          </el-menu-item>
          
          <el-menu-item index="/shelters">
            <el-icon><House /></el-icon>
            <template #title>避难所</template>
          </el-menu-item>
          
          <el-menu-item index="/escape-routes">
            <el-icon><Guide /></el-icon>
            <template #title>逃生路径</template>
          </el-menu-item>
          
          <el-menu-item index="/user-reports">
            <el-icon><Document /></el-icon>
            <template #title>用户报告</template>
          </el-menu-item>
          
          <el-menu-item index="/disaster-types" v-if="isAdmin">
            <el-icon><Collection /></el-icon>
            <template #title>灾害类型</template>
          </el-menu-item>
          
          <el-menu-item index="/risk-assessments">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>风险评估</template>
          </el-menu-item>
          
          <el-menu-item index="/road-network">
            <el-icon><Connection /></el-icon>
            <template #title>道路网络</template>
          </el-menu-item>
          
          <el-sub-menu index="/admin" v-if="isAdmin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/users">
              <el-icon><User /></el-icon>
              <template #title>用户管理</template>
            </el-menu-item>
            <el-menu-item index="/system-config">
              <el-icon><Tools /></el-icon>
              <template #title>系统配置</template>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>

      <!-- 主内容区域 -->
      <div class="layout-main">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import {
  Menu,
  Expand,
  User,
  ArrowDown,
  Odometer,
  Location,
  Monitor,
  Warning,
  House,
  Guide,
  Document,
  Setting,
  Tools,
  Collection,
  DataAnalysis,
  Connection
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 侧边栏状态
const sidebarCollapsed = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 是否为管理员
const isAdmin = computed(() => {
  return authStore.user?.role === 'admin'
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // 保存状态到本地存储
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
}

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/profile')
      break
    case 'settings':
      // 跳转到系统设置页面
      router.push('/system-config')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch (error) {
    console.error('退出登录失败:', error)
    ElMessage.error('退出登录失败')
  }
}

// 初始化
onMounted(() => {
  // 恢复侧边栏状态
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true'
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  padding: 8px;
  border-radius: 4px;
}

.sidebar-toggle:hover {
  background-color: #f5f7fa;
}

.system-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
}

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 200px;
  background: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.layout-sidebar.collapsed {
  width: 64px;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

.layout-main {
  flex: 1;
  background: #f5f5f5;
  overflow-y: auto;
}

/* Element Plus Menu 样式覆盖 */
:deep(.el-menu) {
  background-color: #001529 !important;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65) !important;
}

:deep(.el-menu-item:hover) {
  background-color: #1890ff !important;
  color: #fff !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #fff !important;
}

:deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.65) !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #1890ff !important;
  color: #fff !important;
}

:deep(.el-sub-menu .el-menu-item) {
  background-color: #000c17 !important;
}

:deep(.el-sub-menu .el-menu-item:hover) {
  background-color: #1890ff !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    height: calc(100vh - 60px);
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .layout-sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .layout-main {
    margin-left: 0;
  }
  
  .system-title {
    font-size: 16px;
  }
  
  .header-left {
    gap: 8px;
  }
}
</style>