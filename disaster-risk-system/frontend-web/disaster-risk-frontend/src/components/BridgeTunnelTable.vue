<template>
  <div class="bridge-tunnel-table-wrapper">
    <!-- 桥梁表格 -->
    <div v-if="bridgeData.length > 0" class="table-section">
      <div class="section-header">
        <h4>
          <el-icon><Place /></el-icon>
          桥梁信息 ({{ bridgeData.length }}座)
        </h4>
      </div>
      <el-table
        :data="bridgeData"
        border
        stripe
        size="small"
        style="width: 100%"
        empty-text="暂无桥梁数据"
      >
        <el-table-column prop="name" label="桥梁名称" width="120" show-overflow-tooltip />
        <el-table-column prop="length" label="长度(m)" width="80" align="center">
          <template #default="{ row }">
            {{ formatLength(row.length) }}
          </template>
        </el-table-column>
        <el-table-column prop="height" label="高度(m)" width="80" align="center">
          <template #default="{ row }">
            {{ formatHeight(row.height) }}
          </template>
        </el-table-column>
        <el-table-column prop="weight_limit" label="承重(t)" width="80" align="center">
          <template #default="{ row }">
            {{ formatWeightLimit(row.weight_limit) }}
          </template>
        </el-table-column>
        <el-table-column prop="built_year" label="建设年份" width="90" align="center">
          <template #default="{ row }">
            {{ formatBuiltYear(row.built_year) }}
          </template>
        </el-table-column>
        <el-table-column prop="material" label="材质" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" :type="getMaterialTagType(row.material)">
              {{ formatMaterial(row.material) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置信息" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatLocation(row.location) }}
          </template>
        </el-table-column>
        <el-table-column label="其他信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatOtherInfo(row) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 隧道表格 -->
    <div v-if="tunnelData.length > 0" class="table-section">
      <div class="section-header">
        <h4>
          <el-icon><Connection /></el-icon>
          隧道信息 ({{ tunnelData.length }}座)
        </h4>
      </div>
      <el-table
        :data="tunnelData"
        border
        stripe
        size="small"
        style="width: 100%"
        empty-text="暂无隧道数据"
      >
        <el-table-column prop="name" label="隧道名称" width="120" show-overflow-tooltip />
        <el-table-column prop="length" label="长度(m)" width="80" align="center">
          <template #default="{ row }">
            {{ formatLength(row.length) }}
          </template>
        </el-table-column>
        <el-table-column prop="height" label="净高(m)" width="80" align="center">
          <template #default="{ row }">
            {{ formatHeight(row.height) }}
          </template>
        </el-table-column>
        <el-table-column prop="weight_limit" label="承重(t)" width="80" align="center">
          <template #default="{ row }">
            {{ formatWeightLimit(row.weight_limit) }}
          </template>
        </el-table-column>
        <el-table-column prop="built_year" label="建设年份" width="90" align="center">
          <template #default="{ row }">
            {{ formatBuiltYear(row.built_year) }}
          </template>
        </el-table-column>
        <el-table-column prop="ventilation" label="通风方式" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatVentilation(row.ventilation) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置信息" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatLocation(row.location) }}
          </template>
        </el-table-column>
        <el-table-column label="其他信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatOtherInfo(row) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 无数据提示 -->
    <div v-if="bridgeData.length === 0 && tunnelData.length === 0" class="empty-state">
      <el-empty description="暂无桥梁隧道数据" />
    </div>

    <!-- 统计信息 -->
    <div v-if="bridgeData.length > 0 || tunnelData.length > 0" class="summary-info">
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="桥梁总数">{{ bridgeData.length }}座</el-descriptions-item>
        <el-descriptions-item label="隧道总数">{{ tunnelData.length }}座</el-descriptions-item>
        <el-descriptions-item label="总长度">{{ totalLength }}m</el-descriptions-item>
        <el-descriptions-item label="平均承重">{{ averageWeightLimit }}t</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Place, Connection } from '@element-plus/icons-vue'

/**
 * 桥梁隧道信息表格组件
 * 用于以表格形式展示道路网络中的桥梁隧道详细信息
 */

interface BridgeTunnelItem {
  type?: string // bridge | tunnel
  name?: string
  length?: number
  height?: number
  weight_limit?: number
  built_year?: number
  year?: number
  year_built?: number
  material?: string
  material_type?: string
  status?: string
  ventilation?: string
  mechanical?: boolean
  natural?: boolean
  location?: {
    type: string
    coordinates: number[]
  }
  [key: string]: any
}

interface Props {
  bridgeTunnelData?: BridgeTunnelItem[] | any
}

const props = withDefaults(defineProps<Props>(), {})

// 响应式数据
const bridgeData = ref<BridgeTunnelItem[]>([])
const tunnelData = ref<BridgeTunnelItem[]>([])

/**
 * 解析桥梁隧道原始数据，与可视化组件保持一致的解析逻辑
 * @param data 任意原始桥隧数据
 * @returns { bridges: [], tunnels: [] }
 */
const parseBridgeTunnelData = (data: any): { bridges: BridgeTunnelItem[]; tunnels: BridgeTunnelItem[] } => {
  if (!data) return { bridges: [], tunnels: [] }

  // 若是字符串，尝试解析后再处理
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return parseBridgeTunnelData(parsed)
    } catch (e) {
      console.error('桥梁隧道数据解析失败:', e)
      return { bridges: [], tunnels: [] }
    }
  }

  // 若本身是数组，按类型分组
  if (Array.isArray(data)) {
    const bridges = data.filter(item => item.type === 'bridge')
    const tunnels = data.filter(item => item.type === 'tunnel')
    return { bridges, tunnels }
  }

  // 若是聚合对象，从 bridge_info / tunnel_info 提取
  if (typeof data === 'object') {
    const bridges: BridgeTunnelItem[] = []
    const tunnels: BridgeTunnelItem[] = []

    const bridgeList = Array.isArray(data.bridge_info) ? data.bridge_info : []
    const tunnelList = Array.isArray(data.tunnel_info) ? data.tunnel_info : []

    // 处理桥梁信息
    for (const b of bridgeList) {
      bridges.push({
        type: 'bridge',
        name: b.name ?? b.bridge_name ?? `桥梁${bridges.length + 1}`,
        length: Number(b.length ?? b.len ?? 0) || undefined,
        height: b.height ? Number(b.height) : undefined,
        weight_limit: b.weight_limit ? Number(b.weight_limit) : (b.weightLimit ? Number(b.weightLimit) : undefined),
        built_year: b.built_year ? Number(b.built_year) : (b.year ? Number(b.year) : (b.year_built ? Number(b.year_built) : undefined)),
        material: b.material ?? b.material_type ?? undefined,
        status: b.status ?? undefined,
        location: b.location ?? undefined,
        ...b
      })
    }

    // 处理隧道信息
    for (const t of tunnelList) {
      tunnels.push({
        type: 'tunnel',
        name: t.name ?? t.tunnel_name ?? `隧道${tunnels.length + 1}`,
        length: Number(t.length ?? t.len ?? 0) || undefined,
        height: t.height ? Number(t.height) : undefined,
        weight_limit: t.weight_limit ? Number(t.weight_limit) : (t.weightLimit ? Number(t.weightLimit) : undefined),
        built_year: t.built_year ? Number(t.built_year) : (t.year ? Number(t.year) : (t.year_built ? Number(t.year_built) : undefined)),
        ventilation: t.ventilation ?? (t.mechanical ? 'mechanical' : (t.natural ? 'natural' : undefined)),
        status: t.status ?? undefined,
        location: t.location ?? undefined,
        ...t
      })
    }

    return { bridges, tunnels }
  }

  return { bridges: [], tunnels: [] }
}

/**
 * 格式化长度显示
 */
const formatLength = (length: number | undefined): string => {
  return length && !isNaN(length) ? length.toString() : '-'
}

/**
 * 格式化高度显示
 */
const formatHeight = (height: number | undefined): string => {
  return height && !isNaN(height) ? height.toString() : '-'
}

/**
 * 格式化承重显示
 */
const formatWeightLimit = (weightLimit: number | undefined): string => {
  return weightLimit && !isNaN(weightLimit) ? weightLimit.toString() : '-'
}

/**
 * 格式化建设年份显示
 */
const formatBuiltYear = (year: number | undefined): string => {
  return year && !isNaN(year) && year > 1900 ? year.toString() : '-'
}

/**
 * 格式化材质显示
 */
const formatMaterial = (material: string | undefined): string => {
  if (!material) return '-'
  
  const materialMap: Record<string, string> = {
    'steel_concrete': '钢混结构',
    'prestressed_concrete': '预应力混凝土',
    'concrete': '混凝土',
    'steel': '钢结构',
    'stone': '石材',
    'reinforced_concrete': '钢筋混凝土'
  }
  
  return materialMap[material.toLowerCase()] || material
}

/**
 * 获取材质标签类型
 */
const getMaterialTagType = (material: string | undefined): string => {
  if (!material) return ''
  
  const typeMap: Record<string, string> = {
    'steel_concrete': 'primary',
    'prestressed_concrete': 'success',
    'concrete': 'info',
    'steel': 'warning',
    'stone': 'danger'
  }
  
  return typeMap[material.toLowerCase()] || ''
}

/**
 * 格式化状态显示
 */
const formatStatus = (status: string | undefined): string => {
  if (!status) return '正常'
  
  const statusMap: Record<string, string> = {
    'good': '良好',
    'fair': '一般',
    'poor': '较差',
    'maintenance': '维护中',
    'normal': '正常',
    'warning': '警告',
    'danger': '危险'
  }
  
  return statusMap[status.toLowerCase()] || status
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: string | undefined): string => {
  if (!status) return 'success'
  
  const typeMap: Record<string, string> = {
    'good': 'success',
    'normal': 'success',
    'fair': 'warning',
    'maintenance': 'info',
    'warning': 'warning',
    'poor': 'danger',
    'danger': 'danger'
  }
  
  return typeMap[status.toLowerCase()] || 'info'
}

/**
 * 格式化通风方式显示
 */
const formatVentilation = (ventilation: string | undefined): string => {
  if (!ventilation) return '-'
  
  const ventilationMap: Record<string, string> = {
    'mechanical': '机械通风',
    'natural': '自然通风',
    'mixed': '混合通风'
  }
  
  return ventilationMap[ventilation.toLowerCase()] || ventilation
}

/**
 * 格式化位置信息显示
 */
const formatLocation = (location: any): string => {
  if (!location) return '-'
  
  if (typeof location === 'string') return location
  
  if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    const [lng, lat] = location.coordinates
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
  
  return '-'
}

/**
 * 格式化其他信息显示
 */
const formatOtherInfo = (item: BridgeTunnelItem): string => {
  const otherFields: string[] = []
  
  // 收集除了主要显示字段之外的其他有用信息
  const mainFields = ['type', 'name', 'length', 'height', 'weight_limit', 'built_year', 'year', 'year_built', 'material', 'material_type', 'status', 'ventilation', 'mechanical', 'natural', 'location']
  
  Object.keys(item).forEach(key => {
    if (!mainFields.includes(key) && item[key] !== undefined && item[key] !== null && item[key] !== '') {
      const value = typeof item[key] === 'object' ? JSON.stringify(item[key]) : String(item[key])
      if (value.length < 50) { // 避免显示过长的内容
        otherFields.push(`${key}: ${value}`)
      }
    }
  })
  
  return otherFields.length > 0 ? otherFields.join('; ') : '-'
}

// 计算属性
const totalLength = computed(() => {
  const bridgeLength = bridgeData.value.reduce((sum, item) => sum + (Number(item.length) || 0), 0)
  const tunnelLength = tunnelData.value.reduce((sum, item) => sum + (Number(item.length) || 0), 0)
  return bridgeLength + tunnelLength
})

const averageWeightLimit = computed(() => {
  const allItems = [...bridgeData.value, ...tunnelData.value]
  const itemsWithWeight = allItems.filter(item => item.weight_limit && !isNaN(Number(item.weight_limit)))
  
  if (itemsWithWeight.length === 0) return 0
  
  const totalWeight = itemsWithWeight.reduce((sum, item) => sum + Number(item.weight_limit), 0)
  return Math.round(totalWeight / itemsWithWeight.length * 10) / 10
})

/**
 * 解析并更新数据
 */
const updateData = () => {
  const { bridges, tunnels } = parseBridgeTunnelData(props.bridgeTunnelData)
  bridgeData.value = bridges
  tunnelData.value = tunnels
}

// 监听数据变化
watch(() => props.bridgeTunnelData, updateData, { deep: true, immediate: true })
</script>

<style scoped>
.bridge-tunnel-table-wrapper {
  width: 100%;
}

.table-section {
  margin-bottom: 24px;
}

.table-section:last-of-type {
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.summary-info {
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.el-table .cell) {
  line-height: 1.4;
}

:deep(.el-tag) {
  font-size: 12px;
}

@media (max-width: 768px) {
  .summary-info :deep(.el-descriptions) {
    --el-descriptions-item-bordered-label-background: #fafafa;
  }
  
  .summary-info :deep(.el-descriptions__label) {
    width: 80px;
  }
}
</style>