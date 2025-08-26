<template>
  <div class="system-config-view">
    <div class="page-header">
      <div class="header-left">
        <h2>系统配置</h2>
        <p>管理系统参数和配置项</p>
      </div>
    </div>

    <div class="content-area">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>配置项管理</span>
                <el-button type="primary" @click="showCreateDialog">新增配置</el-button>
              </div>
            </template>

            <!-- 筛选区域 -->
            <div class="filter-section">
              <el-form :model="filters" inline>
                <el-form-item label="配置键">
                  <el-input v-model="filters.config_key" placeholder="请输入配置键" clearable />
                </el-form-item>
                <el-form-item label="分类">
                  <!-- 过滤条件：分类下拉框文案统一 -->
                  <el-select v-model="filters.category" placeholder="请选择分类" clearable>
                    <el-option label="系统设置" value="system" />
                    <el-option label="评估设置" value="assessment" />
                    <el-option label="预警设置" value="warning" />
                    <el-option label="地图设置" value="map" />
                    <el-option label="应急设置" value="emergency" />
                    <el-option label="数据设置" value="data" />
                    <el-option label="通知设置" value="notification" />
                    <el-option label="API设置" value="api" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadConfigs">查询</el-button>
                  <el-button @click="resetFilters">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 数据表格 -->
            <el-table :data="configs" v-loading="loading" stripe>
              <el-table-column prop="config_key" label="配置键" width="200" />
              <el-table-column prop="config_value" label="配置值" min-width="200">
                <template #default="{ row }">
                  <span>{{ row.config_value }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="分类" width="120">
                <template #default="{ row }">
                  {{ getCategoryText(row.category) }}
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="updated_at" label="更新时间" width="160">
                <template #default="{ row }">
                  {{ formatDateTime(row.updated_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-button size="small" @click="editConfig(row)">编辑</el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="deleteConfig(row.id)"
                      :disabled="!row.is_active"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.limit"
                :total="pagination.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadConfigs"
                @current-change="loadConfigs"
              />
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card>
            <template #header>
              <span>快速操作</span>
            </template>
            <div class="quick-actions">
              <el-button type="primary" @click="exportConfigs">导出配置</el-button>
              <el-button type="warning" @click="handleImportClick">导入配置</el-button>
              <el-button type="success" @click="resetToDefaults">恢复默认</el-button>
              <el-button type="info" @click="clearCache">清除缓存</el-button>
            </div>
            <!-- 隐藏的文件输入 -->
            <input 
              ref="fileInputRef" 
              type="file" 
              accept=".json" 
              style="display: none" 
              @change="handleFileChange"
            />
          </el-card>

          <el-card style="margin-top: 20px;">
            <template #header>
              <span>系统状态概览</span>
            </template>
            <div class="system-overview">
              <div class="overview-item">
                <div class="overview-icon">
                  <el-icon size="24" :color="getSystemStatusColor(systemInfo.systemStatus)"><CircleCheck /></el-icon>
                </div>
                <div class="overview-content">
                  <div class="overview-title">系统运行状态</div>
                  <div class="overview-value">{{ systemInfo.systemStatusText || '获取中...' }}</div>
                </div>
              </div>
              <div class="overview-item">
                <div class="overview-icon">
                  <el-icon size="24" :color="getDbConnectionColor(systemInfo.dbConnectionStatus)"><DataBoard /></el-icon>
                </div>
                <div class="overview-content">
                  <div class="overview-title">数据库连接</div>
                  <div class="overview-value">{{ systemInfo.dbConnectionText || '获取中...' }}</div>
                </div>
              </div>
              <div class="overview-item">
                <div class="overview-icon">
                  <el-icon size="24" color="#e6a23c"><Timer /></el-icon>
                </div>
                <div class="overview-content">
                  <div class="overview-title">运行时长</div>
                  <div class="overview-value">{{ systemInfo.uptime || '获取中...' }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card style="margin-top: 20px;">
            <template #header>
              <span>详细信息</span>
            </template>
            <div class="system-info">
              <div class="info-item">
                <span class="label">系统版本:</span>
                <span class="value">{{ systemInfo.version || '获取中...' }}</span>
              </div>
              <div class="info-item">
                <span class="label">运行环境:</span>
                <span class="value">
                  <el-tag :type="getEnvironmentType(systemInfo.environment)" size="small">
                    {{ getEnvironmentText(systemInfo.environment) }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="label">Node.js版本:</span>
                <span class="value">{{ systemInfo.nodeVersion || '获取中...' }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据库版本:</span>
                <span class="value">{{ systemInfo.dbVersion || '获取中...' }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据库大小:</span>
                <span class="value">
                  <div class="db-size-info">
                    <span class="size-text">{{ systemInfo.dbSize || '获取中...' }}</span>
                    <div class="size-bar">
                      <div class="size-progress" :style="{ width: getDbSizePercentage() + '%' }"></div>
                    </div>
                  </div>
                </span>
              </div>
              <div class="info-item">
                <span class="label">运行时间:</span>
                <span class="value">{{ systemInfo.uptime || '获取中...' }}</span>
              </div>
              <div class="info-item">
                <span class="label">最后备份:</span>
                <span class="value">{{ systemInfo.lastBackup || '暂无备份' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建/编辑配置对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑配置' : '新增配置'"
      width="600px"
    >
      <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="100px">
        <el-form-item label="配置键" prop="config_key">
          <el-input v-model="configForm.config_key" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="配置值" prop="config_value">
          <el-input v-model="configForm.config_value" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="configForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="系统设置" value="system" />
            <el-option label="评估设置" value="assessment" />
            <el-option label="预警设置" value="warning" />
            <el-option label="地图设置" value="map" />
            <el-option label="应急设置" value="emergency" />
            <el-option label="数据设置" value="data" />
            <el-option label="通知设置" value="notification" />
            <el-option label="API设置" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="configForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="公开状态">
          <el-switch v-model="configForm.is_public" active-text="公开" inactive-text="私有" />
          <div class="form-tip">公开的配置项可被前端访问</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { CircleCheck, DataBoard, Timer } from '@element-plus/icons-vue'
import type { SystemConfig } from '@/types'
import { formatDateTime } from '@/utils'
import { systemConfigApi } from '@/api'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const configs = ref<SystemConfig[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const configFormRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()

const filters = reactive({
  config_key: '',
  category: undefined as 'system' | 'assessment' | 'warning' | 'map' | 'emergency' | 'data' | 'notification' | 'api' | undefined
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const configForm = reactive({
  id: undefined as number | undefined,
  config_key: '',
  config_value: '',
  category: 'system',
  description: '',
  is_public: false
})

const systemInfo = reactive({
  version: '',
  dbVersion: '',
  dbSize: '',
  lastBackup: '',
  uptime: '',
  environment: '',
  nodeVersion: '',
  systemStatus: '',
  systemStatusText: '',
  dbConnectionStatus: '',
  dbConnectionText: ''
})

const configRules: FormRules = {
  config_key: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    { pattern: /^[A-Z_][A-Z0-9_]*$/, message: '配置键只能包含大写字母、数字和下划线，且以字母或下划线开头', trigger: 'blur' }
  ],
  config_value: [
    { required: true, message: '请输入配置值', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' }
  ]
}

// 方法
const loadConfigs = async () => {
  loading.value = true
  try {
    const response = await systemConfigApi.getConfigs({
      page: pagination.page,
      limit: pagination.limit,
      config_key: filters.config_key,
      category: filters.category
    })
    
    if (response.success) {
      configs.value = response.data
      pagination.total = response.pagination?.total || 0
    } else {
      ElMessage.error(response.message || '加载配置列表失败')
    }
  } catch (error) {
    console.error('加载配置列表失败:', error)
    ElMessage.error('加载配置列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    config_key: '',
    category: undefined
  })
  loadConfigs()
}

const showCreateDialog = () => {
  isEdit.value = false
  resetConfigForm()
  dialogVisible.value = true
}

const editConfig = (config: SystemConfig) => {
  isEdit.value = true
  Object.assign(configForm, {
    id: config.id,
    config_key: config.config_key,
    config_value: config.config_value,
    category: config.category,
    description: config.description,
    is_public: config.is_public
  })
  dialogVisible.value = true
}

const resetConfigForm = () => {
  Object.assign(configForm, {
    id: undefined,
    config_key: '',
    config_value: '',
    category: 'system',
    description: '',
    is_public: false
  })
  configFormRef.value?.clearValidate()
}

const saveConfig = async () => {
  if (!configFormRef.value) return
  
  try {
    await configFormRef.value.validate()
    saving.value = true
    
    const response = isEdit.value 
      ? await systemConfigApi.updateConfig(configForm.config_key, configForm)
      : await systemConfigApi.createConfig(configForm)
    
    if (response.success) {
      ElMessage.success(isEdit.value ? '配置更新成功' : '配置创建成功')
      dialogVisible.value = false
      loadConfigs()
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const deleteConfig = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个配置项吗？此操作不可恢复。', '确认删除', {
      type: 'warning'
    })
    
    // 根据id查找config_key
    const config = configs.value.find(c => c.id === id)
    if (!config) {
      ElMessage.error('配置项不存在')
      return
    }
    const response = await systemConfigApi.deleteConfig(config.config_key)
    if (response.success) {
      ElMessage.success('删除成功')
      loadConfigs()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配置失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const exportConfigs = async () => {
  try {
    const response = await systemConfigApi.exportConfigs()
    
    if (response.success) {
      // 后端返回的data直接是配置数组，不是{configs: []}格式
      const configsData = Array.isArray(response.data) ? response.data : response.data.configs || []
      
      if (configsData.length === 0) {
        ElMessage.warning('没有可导出的配置数据')
        return
      }
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(configsData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `系统配置_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success(`系统配置导出成功，共导出 ${configsData.length} 项配置`)
    } else {
      ElMessage.error(response.message || '导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const handleImportClick = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    importConfigs(file)
    // 清空文件输入，允许重复选择同一文件
    target.value = ''
  }
}

const importConfigs = async (file: File) => {
  try {
    const text = await file.text()
    
    // 验证文件内容
    if (!text || text.trim() === '' || text === 'undefined') {
      ElMessage.error('文件内容为空或无效')
      return
    }
    
    const configs = JSON.parse(text) as SystemConfig[]
    
    // 验证解析后的数据
    if (!Array.isArray(configs)) {
      ElMessage.error('文件格式错误：配置数据必须是数组格式')
      return
    }
    
    const response = await systemConfigApi.importConfigs(configs)
    if (response.success) {
      ElMessage.success('配置导入成功')
      await loadConfigs()
    } else {
      ElMessage.error(response.message || '配置导入失败')
    }
  } catch (error) {
    console.error('导入配置失败:', error)
    if (error instanceof SyntaxError) {
      ElMessage.error('文件格式错误：请确保文件是有效的JSON格式')
    } else {
      ElMessage.error('导入配置失败')
    }
  }
}

const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm('确定要恢复所有配置到默认值吗？此操作不可恢复。', '确认恢复', {
      type: 'warning'
    })
    
    const response = await systemConfigApi.resetAllToDefault()
    if (response.success) {
      ElMessage.success('恢复默认配置成功')
      loadConfigs()
    } else {
      ElMessage.error(response.message || '恢复默认配置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复默认配置失败:', error)
      ElMessage.error('恢复默认配置失败')
    }
  }
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm('确定要清除系统缓存吗？', '确认清除', {
      type: 'warning'
    })
    
    const response = await systemConfigApi.clearCache()
    if (response.success) {
      ElMessage.success('缓存清除成功')
    } else {
      ElMessage.error(response.message || '缓存清除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('缓存清除失败:', error)
      ElMessage.error('缓存清除失败')
    }
  }
}

const getCategoryText = (category: string) => {
  const categoryMap = {
    system: '系统设置',
    assessment: '评估设置',
    warning: '预警设置',
    map: '地图设置',
    emergency: '应急设置',
    data: '数据设置',
    notification: '通知设置',
    api: 'API设置'
  }
  return categoryMap[category as keyof typeof categoryMap] || category
}

const getEnvironmentType = (env: string) => {
  const envMap = {
    'production': 'danger',
    'development': 'warning',
    'test': 'info',
    'staging': 'success'
  }
  return envMap[env as keyof typeof envMap] || 'info'
}

const getEnvironmentText = (env: string) => {
  const envMap = {
    'production': '生产环境',
    'development': '开发环境',
    'test': '测试环境',
    'staging': '预发布环境'
  }
  return envMap[env as keyof typeof envMap] || env
}

const getDbSizePercentage = () => {
  if (!systemInfo.dbSize || systemInfo.dbSize === '未知') return 0
  
  // 解析数据库大小（假设格式为 "17 MB"）
  const sizeMatch = systemInfo.dbSize.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB)/i)
  if (!sizeMatch) return 0
  
  const size = parseFloat(sizeMatch[1])
  const unit = sizeMatch[2].toUpperCase()
  
  // 转换为MB
  let sizeInMB = size
  if (unit === 'GB') sizeInMB = size * 1024
  if (unit === 'KB') sizeInMB = size / 1024
  
  // 假设最大容量为1GB (1024MB)，计算百分比
  const maxSizeMB = 1024
  return Math.min((sizeInMB / maxSizeMB) * 100, 100)
}

const getSystemStatusColor = (status: string) => {
  const statusColorMap = {
    'normal': '#67c23a',
    'warning': '#e6a23c',
    'error': '#f56c6c',
    'unknown': '#909399'
  }
  return statusColorMap[status as keyof typeof statusColorMap] || '#909399'
}

const getDbConnectionColor = (status: string) => {
  const statusColorMap = {
    'connected': '#409eff',
    'disconnected': '#f56c6c',
    'unknown': '#909399'
  }
  return statusColorMap[status as keyof typeof statusColorMap] || '#909399'
}

const loadSystemInfo = async () => {
  try {
    const response = await fetch('/api/v1/system/info')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const data = result.data
        systemInfo.version = data.version || 'v1.0.0'
        systemInfo.dbVersion = data.dbVersion || 'PostgreSQL Unknown'
        systemInfo.dbSize = data.dbSize || '未知'
        systemInfo.lastBackup = data.lastBackup || '暂无备份'
        systemInfo.uptime = data.uptime || '获取中...'
        systemInfo.environment = data.environment || 'unknown'
        systemInfo.nodeVersion = data.nodeVersion || 'Unknown'
        systemInfo.systemStatus = data.systemStatus || 'unknown'
        systemInfo.systemStatusText = data.systemStatusText || '状态未知'
        systemInfo.dbConnectionStatus = data.dbConnectionStatus || 'unknown'
        systemInfo.dbConnectionText = data.dbConnectionText || '连接状态未知'
      } else {
        throw new Error('API返回格式错误')
      }
    } else {
      throw new Error(`API请求失败: ${response.status}`)
    }
  } catch (error) {
    console.warn('获取系统信息失败，使用默认值:', error)
    // 使用默认值
    systemInfo.version = 'v1.0.0'
    systemInfo.dbVersion = 'PostgreSQL Unknown'
    systemInfo.dbSize = '未知'
    systemInfo.lastBackup = '暂无备份'
    systemInfo.uptime = '系统运行中'
    systemInfo.environment = 'unknown'
    systemInfo.nodeVersion = 'Unknown'
    systemInfo.systemStatus = 'unknown'
    systemInfo.systemStatusText = '状态未知'
    systemInfo.dbConnectionStatus = 'unknown'
    systemInfo.dbConnectionText = '连接状态未知'
  }
}

// 生命周期
onMounted(() => {
  loadConfigs()
  loadSystemInfo()
})
</script>

<style scoped>
.system-config-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}



.header-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}



.header-left p {
  margin: 6px 0 0 0;
  color: #666;
  font-size: 13px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button.el-button--primary,
.quick-actions .el-button.el-button--warning,
.quick-actions .el-button.el-button--success,
.quick-actions .el-button.el-button--info {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  padding: 8px 15px !important;
  margin: 0 !important;
  text-align: center !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  display: block !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  border-radius: 4px !important;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  font-weight: 500;
  color: #333;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.db-size-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.size-text {
  font-weight: 500;
  color: #333;
}

.size-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.size-progress {
  height: 100%;
  background: linear-gradient(90deg, #67c23a 0%, #e6a23c 70%, #f56c6c 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.system-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.overview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 50%;
}

.overview-content {
  flex: 1;
}

.overview-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.overview-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
</style>