import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入布局组件
import MainLayout from '../components/Layout/MainLayout.vue'

// 导入页面组件
import DashboardView from '../views/dashboard/DashboardView.vue'
import LoginView from '../views/auth/LoginView.vue'
import ProfileView from '../views/profile/ProfileView.vue'
import RiskZonesView from '../views/risk-zones/RiskZonesView.vue'
import DisasterTypesView from '../views/disaster-types/DisasterTypesView.vue'
import RiskAssessmentsView from '../views/risk-assessments/RiskAssessmentsView.vue'
import WarningsView from '../views/warnings/WarningsView.vue'
import WarningDetailView from '../views/warnings/WarningDetailView.vue'
import SheltersView from '../views/shelters/SheltersView.vue'
import EscapeRoutesView from '../views/escape-routes/EscapeRoutesView.vue'
import EscapeRouteDetailView from '../views/escape-routes/EscapeRouteDetailView.vue'
import RoadNetworkView from '../views/road-network/RoadNetworkView.vue'
import MonitoringView from '../views/monitoring/MonitoringView.vue'
import MonitoringStationDetailView from '../views/monitoring/MonitoringStationDetailView.vue'
import UserReportsView from '../views/user-reports/UserReportsView.vue'
import UsersView from '../views/users/UsersView.vue'
import UserDetailView from '../views/users/UserDetailView.vue'
import SystemConfigView from '../views/system-config/SystemConfigView.vue'
import UserReportDetailView from '../views/user-reports/UserReportDetailView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfileView,
        meta: { requiresAuth: true }
      },
      {
        path: 'risk-zones',
        name: 'RiskZones',
        component: RiskZonesView,
        meta: { requiresAuth: true }
      },
      {
        path: 'disaster-types',
        name: 'DisasterTypes',
        component: DisasterTypesView,
        meta: { requiresAuth: true }
      },
      {
        path: 'risk-assessments',
        name: 'RiskAssessments',
        component: RiskAssessmentsView,
        meta: { requiresAuth: true }
      },
      {
        path: 'warnings',
        name: 'Warnings',
        component: WarningsView,
        meta: { requiresAuth: true }
      },
      {
        path: 'warnings/:id',
        name: 'WarningDetail',
        component: WarningDetailView,
        meta: { requiresAuth: true }
      },
      {
        path: 'shelters',
        name: 'Shelters',
        component: SheltersView,
        meta: { requiresAuth: true }
      },
      {
        path: 'escape-routes',
        name: 'EscapeRoutes',
        component: EscapeRoutesView,
        meta: { requiresAuth: true }
      },
      {
        path: 'escape-routes/:id',
        name: 'EscapeRouteDetail',
        component: EscapeRouteDetailView,
        meta: { requiresAuth: true }
      },
      {
        path: 'road-network',
        name: 'RoadNetwork',
        component: RoadNetworkView,
        meta: { requiresAuth: true }
      },
      {
        path: 'monitoring',
        name: 'Monitoring',
        component: MonitoringView,
        meta: { requiresAuth: true }
      },
      {
        path: 'monitoring/stations/:id',
        name: 'MonitoringStationDetail',
        component: MonitoringStationDetailView,
        meta: { requiresAuth: true }
      },
      {
        path: 'user-reports',
        name: 'UserReports',
        component: UserReportsView,
        meta: { requiresAuth: true }
      },
      {
        path: 'user-reports/:id',
        name: 'UserReportDetail',
        component: UserReportDetailView,
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: UsersView,
        meta: { requiresAuth: true }
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: UserDetailView,
        meta: { requiresAuth: true }
      },
      {
        path: 'system-config',
        name: 'SystemConfig',
        component: SystemConfigView,
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('accessToken')

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router