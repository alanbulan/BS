<template>
  <div class="user-detail-view">
    <div class="page-header">
      <div class="header-content">
        <el-button @click="goBack" type="text" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回用户列表
        </el-button>
        <h1>用户详情</h1>
      </div>
    </div>

    <div class="content-area" v-loading="loading">
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>基本信息</span>
            </template>
            <div class="info-item">
              <label>用户名：</label>
              <span>{{ userDetail.username }}</span>
            </div>
            <div class="info-item">
              <label>姓名：</label>
              <span>{{ userDetail.full_name || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>邮箱：</label>
              <span>{{ userDetail.email }}</span>
            </div>
            <div class="info-item">
              <label>电话：</label>
              <span>{{ userDetail.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>部门：</label>
              <span>{{ userDetail.department || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>职位：</label>
              <span>{{ userDetail.position || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>角色：</label>
              <el-tag :type="getRoleTagType(userDetail.role)">
                {{ getRoleText(userDetail.role) }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>状态：</label>
              <el-tag :type="userDetail.is_active ? 'success' : 'danger'">
                {{ userDetail.is_active ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="info-item">
              <label>最后登录：</label>
              <span>{{ userDetail.last_login ? formatDateTime(userDetail.last_login) : '从未登录' }}</span>
            </div>
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ formatDateTime(userDetail.created_at) }}</span>
            </div>
          </el-card>
        </el-col>

        <!-- 位置信息 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>位置信息</span>
            </template>
            <div class="location-info" :class="{ 'has-location': locationCoords.longitude && locationCoords.latitude, 'no-location-data': !locationCoords.longitude || !locationCoords.latitude }">
              <div class="info-item">
                <label>坐标：</label>
                <span class="location-text" :class="{ 'location-available': locationCoords.longitude && locationCoords.latitude, 'location-unavailable': !locationCoords.longitude || !locationCoords.latitude }">{{ formatLocation(userDetail.location) }}</span>
              </div>
              <template v-if="locationCoords.longitude && locationCoords.latitude">
                <div class="location-details">
                  <div class="coord-item">
                    <label>经度：</label>
                    <span class="coord-value">{{ locationCoords.longitude }}</span>
                  </div>
                  <div class="coord-item">
                    <label>纬度：</label>
                    <span class="coord-value">{{ locationCoords.latitude }}</span>
                  </div>
                </div>
                <div class="user-location-map">
                  <MapComponent 
                    :height="'200px'"
                    :center="[parseFloat(locationCoords.latitude), parseFloat(locationCoords.longitude)]"
                    :zoom="15"
                    :showUserLocation="true"
                    :userLocation="[parseFloat(locationCoords.latitude), parseFloat(locationCoords.longitude)]"
                    :userName="userDetail.username || '用户'"
                  />
                </div>
              </template>
              <div class="no-location" v-else>
                <p>暂无位置信息</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { usersApi } from '../../api/modules/users'
import type { User } from '../../types'
import MapComponent from '../../components/MapComponent.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const userDetail = ref<User>({
  id: 0,
  username: '',
  email: '',
  role: '',
  is_active: true,
  created_at: '',
  updated_at: ''
})

const locationCoords = computed(() => {
  const location = formatLocation(userDetail.value.location ?? null)
  if (location && location !== '未设置' && location.includes(',')) {
    const [longitude, latitude] = location.split(', ')
    return { longitude, latitude }
  }
  return { longitude: '', latitude: '' }
})

const loadUserDetail = async () => {
  const userId = route.params.id as string
  if (!userId) {
    ElMessage.error('用户ID无效')
    goBack()
    return
  }

  loading.value = true
  try {
    const response = await usersApi.getUser(parseInt(userId))
    userDetail.value = response.data
  } catch (error) {
    ElMessage.error('加载用户详情失败')
    goBack()
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/users')
}

const getRoleText = (role: string) => {
  const roleMap = {
    admin: '管理员',
    operator: '操作员',
    user: '普通用户'
  }
  return roleMap[role as keyof typeof roleMap] || role
}

const getRoleTagType = (role: string) => {
  const typeMap = {
    admin: 'danger',
    operator: 'warning',
    user: 'info'
  }
  return typeMap[role as keyof typeof typeMap] || 'info'
}

const formatLocation = (location: string | null | undefined) => {
  if (!location) return '未设置'
  
  try {
    // 处理十六进制PostGIS格式 (如: 0101000020E6100000...)
    if (location.startsWith('0101000020')) {
      try {
        // PostGIS WKB格式: 01(字节序) 01000020(几何类型+SRID标志) E6100000(SRID=4326) + 坐标数据
        // 跳过: 01(1字节) + 01000020(4字节) + E6100000(4字节) = 18个字符
        const coordStart = 18
        const coordData = location.substring(coordStart)
        
        if (coordData.length >= 32) { // 需要32个字符(16字节)表示两个double
          // 将十六进制转换为字节数组
          const bytes = []
          for (let i = 0; i < coordData.length; i += 2) {
            bytes.push(parseInt(coordData.substr(i, 2), 16))
          }
          
          // 创建DataView读取坐标 (PostGIS使用little-endian)
          const buffer = new Uint8Array(bytes).buffer
          const view = new DataView(buffer)
          
          // 读取X坐标(经度)和Y坐标(纬度)
          const longitude = view.getFloat64(0, true) // little-endian
          const latitude = view.getFloat64(8, true)  // little-endian
          
          // 验证坐标范围是否合理
          if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
            return `${longitude.toFixed(4)}, ${latitude.toFixed(4)}`
          } else {
            return '坐标超出范围'
          }
        } else {
          return '十六进制数据长度不足: ' + coordData.length
        }
      } catch (hexError) {
        return '十六进制解析失败'
      }
    }
    
    // 处理标准POINT格式 (如: POINT(longitude latitude))
    if (location.includes('POINT(')) {
      const match = location.match(/POINT\(([^)]+)\)/)
      if (match) {
        const coords = match[1].trim().split(/\s+/)
        if (coords.length === 2) {
          const longitude = parseFloat(coords[0])
          const latitude = parseFloat(coords[1])
          if (!isNaN(longitude) && !isNaN(latitude)) {
            return `${longitude.toFixed(4)}, ${latitude.toFixed(4)}`
          }
        }
      }
    }
    
    return '格式错误'
  } catch (error) {
    return '解析失败'
  }
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('zh-CN')
}

onMounted(() => {
  loadUserDetail()
})
</script>

<style scoped>
.user-detail-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #409eff;
  font-size: 14px;
}

.back-btn:hover {
  color: #66b1ff;
}

.content-area {
  min-height: 400px;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.info-item label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  margin-right: 10px;
}

.location-info {
  padding: 10px 0;
}

.location-text {
  font-family: 'Courier New', monospace;
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.location-details {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.coord-item {
  display: flex;
  margin-bottom: 8px;
}

.coord-item label {
  font-weight: 500;
  color: #606266;
  min-width: 60px;
  margin-right: 10px;
}

.map-placeholder {
  margin-top: 15px;
  padding: 20px;
  background-color: #f0f2f5;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  text-align: center;
  color: #666;
}

.coord-display {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #409eff;
  margin-top: 5px;
}

.no-location {
  text-align: center;
  color: #999;
  padding: 20px;
}

/* 动态位置信息样式 */
.location-info.has-location {
  border-left: 4px solid #67c23a;
  padding-left: 15px;
  background-color: #f0f9ff;
}

.location-info.no-location-data {
  border-left: 4px solid #f56c6c;
  padding-left: 15px;
  background-color: #fef0f0;
}

.location-text.location-available {
  background-color: #e1f3d8;
  color: #67c23a;
  border: 1px solid #b3d8a4;
}

.location-text.location-unavailable {
  background-color: #fde2e2;
  color: #f56c6c;
  border: 1px solid #f5b2b2;
}

.coord-value {
  font-family: 'Courier New', monospace;
  background-color: #e1f3d8;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #529b2e;
  font-weight: 500;
}

.location-details {
  animation: fadeIn 0.3s ease-in;
}

.user-location-map {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.4s ease-out;
}

.map-placeholder {
  animation: slideIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h1 {
  margin: 0;
  color: #303133;
}
</style>