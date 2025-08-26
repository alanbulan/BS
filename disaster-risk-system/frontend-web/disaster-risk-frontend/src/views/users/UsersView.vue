<template>
  <div class="users-view">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理系统用户账户和权限</p>
    </div>

    <div class="content-area">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>用户列表</span>
            <el-button type="primary" @click="showCreateDialog">新增用户</el-button>
          </div>
        </template>

        <!-- 筛选区域 -->
        <div class="filter-section">
          <el-form :model="filters" inline>
            <el-form-item label="用户名">
              <el-input v-model="filters.username" placeholder="请输入用户名" clearable />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="filters.email" placeholder="请输入邮箱" clearable />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="filters.role" placeholder="选择角色" clearable>
                <el-option label="管理员" value="admin" />
                <el-option label="操作员" value="operator" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.is_active" placeholder="选择状态" clearable>
                <el-option label="启用" :value="true" />
                <el-option label="禁用" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadUsers">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格 -->
        <el-table :data="users" v-loading="loading" stripe>
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="full_name" label="姓名" width="120" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="position" label="职位" width="120" />
          <el-table-column prop="location" label="位置" width="150">
            <template #default="{ row }">
              {{ formatLocation(row.location) }}
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)">
                {{ getRoleText(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_active" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'danger'">
                {{ row.is_active ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_login" label="最后登录" width="160">
            <template #default="{ row }">
              {{ row.last_login ? formatDateTime(row.last_login) : '从未登录' }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewUserDetail(row.id)">详情</el-button>
              <el-button 
                size="small" 
                :type="row.is_active ? 'warning' : 'success'"
                @click="toggleUserStatus(row)"
              >
                {{ row.is_active ? '禁用' : '启用' }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteUser(row.id)"
                :disabled="row.role === 'admin'"
              >
                删除
              </el-button>
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
            @size-change="loadUsers"
            @current-change="loadUsers"
          />
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="600px"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="userForm.full_name" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="userForm.department" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-input v-model="userForm.position" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <div style="display: flex; gap: 10px;">
            <el-input v-model="userForm.longitude" placeholder="经度" style="flex: 1" />
            <el-input v-model="userForm.latitude" placeholder="纬度" style="flex: 1" />
          </div>
          <div style="margin-top: 5px; font-size: 12px; color: #999;">
            请输入经纬度坐标，例如：经度 116.4074，纬度 39.9042
          </div>
        </el-form-item>
        <el-form-item label="权限" prop="permissions">
          <el-select v-model="userForm.permissions" multiple placeholder="选择权限" style="width: 100%">
            <el-option label="用户管理" value="user_management" />
            <el-option label="监测站管理" value="station_management" />
            <el-option label="风险评估" value="risk_assessment" />
            <el-option label="报告生成" value="report_generation" />
            <el-option label="系统配置" value="system_config" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="确认密码" prop="confirmPassword">
          <el-input v-model="userForm.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { User } from '@/types'
import { formatDateTime } from '@/utils'
import { usersApi } from '@/api'

// 响应式数据
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const users = ref<User[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const userFormRef = ref<FormInstance>()

const filters = reactive({
  username: '',
  email: '',
  role: '',
  is_active: undefined as boolean | undefined
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const userForm = reactive({
  id: undefined as number | undefined,
  username: '',
  email: '',
  full_name: '',
  phone: '',
  department: '',
  position: '',
  longitude: '' as string | undefined,
  latitude: '' as string | undefined,
  location: undefined as string | null | undefined,
  permissions: [] as string[],
  role: 'user',
  password: '' as string | undefined,
  confirmPassword: '' as string | undefined,
  is_active: true
})

const userRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await usersApi.getUsers({
      page: pagination.page,
      limit: pagination.limit,
      username: filters.username,
      email: filters.email,
      role: filters.role,
      is_active: filters.is_active
    })
    
    if (response.success) {
      users.value = response.data
      pagination.total = response.pagination?.total || 0
    } else {
      ElMessage.error(response.message || '加载用户列表失败')
    }
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    username: '',
    email: '',
    role: '',
    is_active: undefined
  })
  loadUsers()
}

const showCreateDialog = () => {
  isEdit.value = false
  resetUserForm()
  dialogVisible.value = true
}



const viewUserDetail = (userId: number) => {
  router.push(`/users/${userId}`)
}

const resetUserForm = () => {
  Object.assign(userForm, {
    id: undefined,
    username: '',
    email: '',
    full_name: '',
    phone: '',
    department: '',
    position: '',
    longitude: '',
    latitude: '',
    permissions: [],
    role: 'user',
    password: '',
    confirmPassword: '',
    is_active: true
  })
  userFormRef.value?.clearValidate()
}

const saveUser = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    saving.value = true
    
    // 处理位置数据
    const processedData = { ...userForm }
    if (userForm.longitude && userForm.latitude) {
      processedData.location = `POINT(${userForm.longitude} ${userForm.latitude})`
    } else {
      processedData.location = null
    }
    
    // 移除临时字段
    if ('longitude' in processedData) delete processedData.longitude
    if ('latitude' in processedData) delete processedData.latitude
    
    if (isEdit.value) {
      const { confirmPassword, ...updateData } = processedData
      await usersApi.updateUser(userForm.id!, updateData)
      ElMessage.success('用户更新成功')
    } else {
      const { id, confirmPassword, ...createData } = processedData
      await usersApi.createUser(createData)
      ElMessage.success('用户创建成功')
    }
    
    dialogVisible.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const toggleUserStatus = async (user: User) => {
  try {
    const action = user.is_active ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}用户 "${user.username}" 吗？`, `确认${action}`, {
      type: 'warning'
    })
    
    const newStatus = !user.is_active
    await usersApi.toggleUserStatus(user.id, newStatus)
    user.is_active = newStatus
    ElMessage.success(`${action}成功`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const deleteUser = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个用户吗？此操作不可恢复。', '确认删除', {
      type: 'warning'
    })
    
    await usersApi.deleteUser(id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
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

const formatLocation = (location: string | null) => {
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
          return '数据格式错误'
        }
      } catch (error) {
        return '解析失败'
      }
    }
    
    // 处理 POINT(longitude latitude) 格式
    if (location.startsWith('POINT(')) {
      const locationText = location.replace('POINT(', '').replace(')', '')
      const coords = locationText.split(' ')
      
      if (coords.length === 2) {
        const longitude = parseFloat(coords[0]).toFixed(4)
        const latitude = parseFloat(coords[1]).toFixed(4)
        return `${longitude}, ${latitude}`
      }
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return '格式错误'
}

// 生命周期
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #666;
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
</style>