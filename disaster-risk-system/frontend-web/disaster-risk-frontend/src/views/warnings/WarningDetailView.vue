<template>
  <div class="warning-detail-container">
    <div class="page-header">
      <el-button @click="$router.back()" type="default">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>预警详情</h2>
    </div>
    
    <div class="warning-content" v-if="warning">
      <el-card>
        <h3>{{ warning.title }}</h3>
        <p>{{ warning.content }}</p>
        <div class="warning-meta">
          <el-tag :type="getWarningType(warning.warning_level)">{{ getWarningLevelText(warning.warning_level) }}</el-tag>
          <span>发布时间: {{ warning.created_at }}</span>
        </div>
      </el-card>
    </div>
    
    <div v-else>
      <el-empty description="预警信息不存在" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { warningsApi } from '@/api/modules/warnings'
import type { Warning } from '@/types'

const route = useRoute()
const router = useRouter()
const warning = ref<Warning | null>(null)
const loading = ref(false)

const getWarningLevelText = (level: number) => {
  switch (level) {
    case 1: return '低'
    case 2: return '中'
    case 3: return '高'
    case 4: return '极高'
    default: return '未知'
  }
}

const getWarningType = (level: number) => {
  switch (level) {
    case 1: return 'info'
    case 2: return 'warning'
    case 3: return 'danger'
    case 4: return 'danger'
    default: return 'info'
  }
}

// 获取预警详情
const fetchWarningDetail = async () => {
  try {
    loading.value = true
    const response = await warningsApi.getWarning(Number(route.params.id))
    if (response.success) {
      warning.value = response.data
    } else {
      ElMessage.error('获取预警详情失败')
      router.back()
    }
  } catch (error) {
    console.error('获取预警详情失败:', error)
    ElMessage.error('获取预警详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWarningDetail()
})
</script>

<style scoped>
.warning-detail-container {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.warning-content h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.warning-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
}
</style>