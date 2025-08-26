<template>
  <div class="disaster-types-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>灾害类型管理</h2>
        <p>管理系统中的各种灾害类型及其配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增灾害类型
        </el-button>
        <el-button @click="loadDisasterTypes">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon online">
          <el-icon><DataBoard /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalTypes }}</div>
          <div class="stat-label">总灾害类型</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ activeTypes }}</div>
          <div class="stat-label">启用类型</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ highRiskTypes }}</div>
          <div class="stat-label">高风险类型</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon offline">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ inactiveTypes }}</div>
          <div class="stat-label">禁用类型</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :model="queryParams" inline>
        <el-form-item label="类型名称">
          <el-input
            v-model="queryParams.search"
            placeholder="请输入灾害类型名称"
            clearable
            @keyup.enter="loadDisasterTypes"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="queryParams.base_risk_level"
            placeholder="请选择风险等级"
            clearable
            style="width: 150px"
          >
            <el-option label="1级 - 很低" :value="1" />
            <el-option label="2级 - 低" :value="2" />
            <el-option label="3级 - 中等" :value="3" />
            <el-option label="4级 - 高" :value="4" />
            <el-option label="5级 - 很高" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.is_active"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDisasterTypes">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetQuery">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="disasterTypes"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="类型名称" min-width="120">
          <template #default="{ row }">
            <div class="type-name">
              <div
                class="color-indicator"
                :style="{ backgroundColor: row.color_code || '#409EFF' }"
              ></div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name_en" label="英文名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="base_risk_level" label="基础风险等级" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getRiskLevelType(row.base_risk_level)"
              size="small"
            >
              {{ getRiskLevelText(row.base_risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="viewDetails(row)"
              >
                详情
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="editDisasterType(row)"
              >
                编辑
              </el-button>
              <el-popconfirm
                title="确定要删除这个灾害类型吗？"
                @confirm="deleteDisasterType(row.id)"
              >
                <template #reference>
                  <el-button type="danger" size="small">
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadDisasterTypes"
          @current-change="loadDisasterTypes"
        />
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedRows.length > 0" class="batch-actions">
      <el-alert
        :title="`已选择 ${selectedRows.length} 项`"
        type="info"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="batch-buttons">
            <el-button size="small" @click="batchToggleStatus(true)">
              <el-icon><Check /></el-icon>
              批量启用
            </el-button>
            <el-button size="small" @click="batchToggleStatus(false)">
              <el-icon><Close /></el-icon>
              批量禁用
            </el-button>
            <el-popconfirm
              title="确定要删除选中的灾害类型吗？"
              @confirm="batchDelete"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon>
                  批量删除
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingType ? '编辑灾害类型' : '新增灾害类型'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入灾害类型名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="name_en">
              <el-input v-model="formData.name_en" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基础风险等级" prop="base_risk_level">
              <el-select v-model="formData.base_risk_level" placeholder="请选择风险等级" style="width: 100%">
                <el-option label="1级 - 很低" :value="1" />
                <el-option label="2级 - 低" :value="2" />
                <el-option label="3级 - 中等" :value="3" />
                <el-option label="4级 - 高" :value="4" />
                <el-option label="5级 - 很高" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色代码" prop="color_code">
              <el-color-picker v-model="formData.color_code" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="图标URL">
          <el-input v-model="formData.icon_url" placeholder="请输入图标URL" />
        </el-form-item>
        
        <el-form-item label="描述信息">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        
        <el-form-item label="预警阈值配置">
          <el-input
            v-model="warningThresholdJson"
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式的预警阈值配置"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingType ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="灾害类型详情"
      width="900px"
    >
      <div v-if="currentType" class="type-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="类型ID">{{ currentType.id }}</el-descriptions-item>
          <el-descriptions-item label="类型名称">{{ currentType.name }}</el-descriptions-item>
          <el-descriptions-item label="英文名称">{{ currentType.name_en || '-' }}</el-descriptions-item>
          <el-descriptions-item label="基础风险等级">
            <el-tag :type="getRiskLevelType(currentType.base_risk_level)">
              {{ getRiskLevelText(currentType.base_risk_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="颜色代码">
            <div class="color-display">
              <div
                class="color-box"
                :style="{ backgroundColor: currentType.color_code || '#409EFF' }"
              ></div>
              <span>{{ currentType.color_code || '-' }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentType.is_active ? 'success' : 'danger'">
              {{ currentType.is_active ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="图标URL" :span="2">{{ currentType.icon_url || '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述信息" :span="2">{{ currentType.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentType.created_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentType.warning_threshold" class="threshold-section">
          <h4>预警阈值配置</h4>
          <el-card>
            <pre>{{ JSON.stringify(currentType.warning_threshold, null, 2) }}</pre>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { DisasterType } from '../../types'
import { formatDateTime } from '../../utils'
import { disasterTypesApi } from '../../api/modules'
import {
  Plus,
  Refresh,
  Search,
  DataBoard,
  Check,
  Warning,
  Close,
  Delete
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingType = ref<DisasterType | null>(null)
const currentType = ref<DisasterType | null>(null)
const selectedRows = ref<DisasterType[]>([])
const formRef = ref<FormInstance>()
const warningThresholdJson = ref('')

// 数据列表
const disasterTypes = ref<DisasterType[]>([])
const total = ref(0)

// 统计数据
const totalTypes = computed(() => disasterTypes.value?.length || 0)
const activeTypes = computed(() => disasterTypes.value?.filter(t => t.is_active).length || 0)
const inactiveTypes = computed(() => disasterTypes.value?.filter(t => !t.is_active).length || 0)
const highRiskTypes = computed(() => disasterTypes.value?.filter(t => t.base_risk_level >= 4).length || 0)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  search: '',
  base_risk_level: undefined as number | undefined,
  is_active: undefined as boolean | undefined
})

// 表单数据
const formData = reactive({
  name: '',
  name_en: '',
  description: '',
  base_risk_level: undefined as number | undefined,
  color_code: '#409EFF',
  icon_url: '',
  is_active: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入灾害类型名称', trigger: 'blur' }
  ],
  base_risk_level: [
    { required: true, message: '请选择基础风险等级', trigger: 'change' }
  ]
}

// 获取风险等级类型
const getRiskLevelType = (level: number): string => {
  const typeMap: Record<number, string> = {
    1: 'info',
    2: 'success',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  }
  return typeMap[level] || 'info'
}

// 获取风险等级文本
const getRiskLevelText = (level: number): string => {
  const textMap: Record<number, string> = {
    1: '1级 - 很低',
    2: '2级 - 低',
    3: '3级 - 中等',
    4: '4级 - 高',
    5: '5级 - 很高'
  }
  return textMap[level] || `${level}级`
}

// 加载灾害类型列表
const loadDisasterTypes = async () => {
  try {
    loading.value = true
    const response = await disasterTypesApi.getDisasterTypes(queryParams)
    if (response.success) {
      disasterTypes.value = response.data
      total.value = response.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载灾害类型失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 重置查询
const resetQuery = () => {
  Object.assign(queryParams, {
    page: 1,
    limit: 20,
    search: '',
    base_risk_level: undefined,
    is_active: undefined
  })
  loadDisasterTypes()
}

// 选择变化
const handleSelectionChange = (selection: DisasterType[]) => {
  selectedRows.value = selection
}

// 切换状态
const toggleStatus = async (row: DisasterType) => {
  try {
    const response = await disasterTypesApi.toggleDisasterTypeStatus(row.id, row.is_active)
    if (response.success) {
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    row.is_active = !row.is_active // 回滚状态
  }
}

// 查看详情
const viewDetails = (row: DisasterType) => {
  currentType.value = row
  showDetailDialog.value = true
}

// 编辑灾害类型
const editDisasterType = (row: DisasterType) => {
  editingType.value = row
  Object.assign(formData, {
    name: row.name,
    name_en: row.name_en || '',
    description: row.description || '',
    base_risk_level: row.base_risk_level,
    color_code: row.color_code || '#409EFF',
    icon_url: row.icon_url || '',
    is_active: row.is_active
  })
  warningThresholdJson.value = row.warning_threshold ? JSON.stringify(row.warning_threshold, null, 2) : ''
  showCreateDialog.value = true
}

// 删除灾害类型
const deleteDisasterType = async (id: number) => {
  try {
    const response = await disasterTypesApi.deleteDisasterType(id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadDisasterTypes()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error: any) {
    console.error('删除失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败'
    ElMessage.error(errorMessage)
  }
}

// 批量切换状态
const batchToggleStatus = async (isActive: boolean) => {
  try {
    const promises = selectedRows.value.map(row => 
      disasterTypesApi.toggleDisasterTypeStatus(row.id, isActive)
    )
    await Promise.all(promises)
    ElMessage.success('批量操作成功')
    loadDisasterTypes()
  } catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('批量操作失败')
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    const promises = selectedRows.value.map(row => 
      disasterTypesApi.deleteDisasterType(row.id)
    )
    await Promise.all(promises)
    ElMessage.success('批量删除成功')
    loadDisasterTypes()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    name_en: '',
    description: '',
    base_risk_level: undefined,
    color_code: '#409EFF',
    icon_url: '',
    is_active: true
  })
  warningThresholdJson.value = ''
  editingType.value = null
  formRef.value?.resetFields()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    submitting.value = true
    
    // 处理预警阈值JSON
    let warningThreshold = null
    if (warningThresholdJson.value.trim()) {
      try {
        warningThreshold = JSON.parse(warningThresholdJson.value)
      } catch (error) {
        ElMessage.error('预警阈值配置格式错误，请输入有效的JSON')
        return
      }
    }
    
    const data = {
      ...formData,
      warning_threshold: warningThreshold
    }
    
    let response
    if (editingType.value) {
      response = await disasterTypesApi.updateDisasterType(editingType.value.id, data)
    } else {
      response = await disasterTypesApi.createDisasterType(data)
    }
    
    if (response.success) {
      ElMessage.success(editingType.value ? '更新成功' : '创建成功')
      showCreateDialog.value = false
      resetForm()
      loadDisasterTypes()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 组件挂载
onMounted(() => {
  loadDisasterTypes()
})
</script>

<style scoped>
.disaster-types-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #fff;
}

.stat-icon.online {
  background: #67c23a;
}

.stat-icon.offline {
  background: #f56c6c;
}

.stat-icon.warning {
  background: #e6a23c;
}

.stat-icon.info {
  background: #409eff;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.type-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
}

.type-detail {
  padding: 20px 0;
}

.threshold-section {
  margin-top: 20px;
}

.threshold-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.color-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
</style>