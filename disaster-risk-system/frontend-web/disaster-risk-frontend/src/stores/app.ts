import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DashboardStats, RiskLevelStats } from '../types'

export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebarCollapsed = ref(false)
  
  // 主题设置
  const theme = ref<'light' | 'dark'>('light')
  
  // 语言设置
  const locale = ref('zh-CN')
  
  // 加载状态
  const globalLoading = ref(false)
  
  // 仪表板统计数据
  const dashboardStats = ref<DashboardStats>({
    totalZones: 0,
    activeWarnings: 0,
    monitoringStations: 0,
    availableShelters: 0,
    highRiskZones: 0,
    recentReports: 0
  })
  
  // 风险等级统计
  const riskLevelStats = ref<RiskLevelStats>({
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0
  })
  
  // 地图中心点和缩放级别
  const mapCenter = ref({
    lng: 104.066,
    lat: 30.572,
    zoom: 10
  })
  
  // 当前选中的风险区域
  const selectedRiskZone = ref<number | null>(null)
  
  // 当前选中的监测站点
  const selectedStation = ref<string | null>(null)
  
  // 实时数据更新间隔（毫秒）
  const dataUpdateInterval = ref(30000) // 30秒
  
  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }
  
  // 设置主题
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  // 设置语言
  const setLocale = (newLocale: string) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }
  
  // 设置全局加载状态
  const setGlobalLoading = (loading: boolean) => {
    globalLoading.value = loading
  }
  
  // 更新仪表板统计数据
  const updateDashboardStats = (stats: Partial<DashboardStats>) => {
    dashboardStats.value = { ...dashboardStats.value, ...stats }
  }
  
  // 更新风险等级统计
  const updateRiskLevelStats = (stats: Partial<RiskLevelStats>) => {
    riskLevelStats.value = { ...riskLevelStats.value, ...stats }
  }
  
  // 设置地图中心点
  const setMapCenter = (center: { lng: number; lat: number; zoom?: number }) => {
    mapCenter.value = { ...mapCenter.value, ...center }
  }
  
  // 选择风险区域
  const selectRiskZone = (zoneId: number | null) => {
    selectedRiskZone.value = zoneId
  }
  
  // 选择监测站点
  const selectStation = (stationId: string | null) => {
    selectedStation.value = stationId
  }
  
  // 设置数据更新间隔
  const setDataUpdateInterval = (interval: number) => {
    dataUpdateInterval.value = interval
    localStorage.setItem('dataUpdateInterval', String(interval))
  }
  
  // 初始化应用设置
  const initializeApp = () => {
    // 恢复侧边栏状态
    const savedSidebarState = localStorage.getItem('sidebarCollapsed')
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true'
    }
    
    // 恢复主题设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    }
    
    // 恢复语言设置
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale) {
      locale.value = savedLocale
    }
    
    // 恢复数据更新间隔
    const savedInterval = localStorage.getItem('dataUpdateInterval')
    if (savedInterval) {
      dataUpdateInterval.value = parseInt(savedInterval)
    }
  }
  
  // 重置应用状态
  const resetAppState = () => {
    selectedRiskZone.value = null
    selectedStation.value = null
    dashboardStats.value = {
      totalZones: 0,
      activeWarnings: 0,
      monitoringStations: 0,
      availableShelters: 0,
      highRiskZones: 0,
      recentReports: 0
    }
    riskLevelStats.value = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0
    }
  }
  
  return {
    // 状态
    sidebarCollapsed,
    theme,
    locale,
    globalLoading,
    dashboardStats,
    riskLevelStats,
    mapCenter,
    selectedRiskZone,
    selectedStation,
    dataUpdateInterval,
    
    // 方法
    toggleSidebar,
    setTheme,
    setLocale,
    setGlobalLoading,
    updateDashboardStats,
    updateRiskLevelStats,
    setMapCenter,
    selectRiskZone,
    selectStation,
    setDataUpdateInterval,
    initializeApp,
    resetAppState
  }
})