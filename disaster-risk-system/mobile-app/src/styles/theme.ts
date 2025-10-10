/**
 * 统一主题配置
 * 包含颜色、字体、间距、阴影等设计规范
 */

export const colors = {
  // 主色调
  primary: '#409EFF',
  primaryLight: '#66B1FF',
  primaryLighter: '#A0CFFF',
  primaryLightest: '#ECF5FF',
  
  // 成功色
  success: '#67C23A',
  successLight: '#85CE61',
  successLighter: '#B3E19D',
  successLightest: '#F0F9EB',
  
  // 警告色
  warning: '#E6A23C',
  warningLight: '#EBB563',
  warningLighter: '#F3D19E',
  warningLightest: '#FDF6EC',
  
  // 危险色
  danger: '#F56C6C',
  dangerLight: '#F78989',
  dangerLighter: '#FAB6B6',
  dangerLightest: '#FEF0F0',
  
  // 信息色
  info: '#909399',
  infoLight: '#A6A9AD',
  infoLighter: '#C8C9CC',
  infoLightest: '#F4F4F5',
  
  // 文字颜色
  textPrimary: '#303133',
  textRegular: '#606266',
  textSecondary: '#909399',
  textPlaceholder: '#C0C4CC',
  
  // 背景颜色
  background: '#F5F7FA',
  backgroundLight: '#FFFFFF',
  backgroundDark: '#E4E7ED',
  
  // 边框颜色
  border: '#DCDFE6',
  borderLight: '#E4E7ED',
  borderLighter: '#EBEEF5',
  
  // 渐变色
  gradients: {
    primary: ['#409EFF', '#66B1FF'],
    success: ['#67C23A', '#85CE61'],
    warning: ['#E6A23C', '#EBB563'],
    danger: ['#F56C6C', '#F78989'],
    blue: ['#4A90E2', '#357ABD'],
    purple: ['#667EEA', '#764BA2'],
    orange: ['#FA8C16', '#FF6B35'],
    green: ['#52C41A', '#73D13D'],
  },
};

export const typography = {
  // 字体大小
  sizes: {
    xxs: 10,
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  
  // 字重
  weights: {
    regular: '400',
    medium: '600',
    bold: '700',
  } as const,
  
  // 行高
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 4,
  base: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// 预警等级配置
export const warningLevels = {
  1: { 
    label: '注意', 
    color: colors.success, 
    bgColor: colors.successLightest,
    icon: '🟢'
  },
  2: { 
    label: '一般', 
    color: colors.primary, 
    bgColor: colors.primaryLightest,
    icon: '🔵'
  },
  3: { 
    label: '较重', 
    color: colors.warning, 
    bgColor: colors.warningLightest,
    icon: '🟡'
  },
  4: { 
    label: '严重', 
    color: '#FA8C16', 
    bgColor: '#FFF7E6',
    icon: '🟠'
  },
  5: { 
    label: '特别严重', 
    color: colors.danger, 
    bgColor: colors.dangerLightest,
    icon: '🔴'
  },
};

// 报告类型配置
export const reportTypes = {
  disaster: { 
    label: '灾害报告', 
    icon: '⚠️', 
    color: colors.danger,
    gradient: colors.gradients.danger
  },
  infrastructure: { 
    label: '基础设施', 
    icon: '🏗️', 
    color: colors.warning,
    gradient: colors.gradients.orange
  },
  environmental: { 
    label: '环境问题', 
    icon: '🌳', 
    color: colors.success,
    gradient: colors.gradients.green
  },
  other: { 
    label: '其他', 
    icon: '📋', 
    color: colors.info,
    gradient: [colors.info, colors.infoLight]
  },
};

// 严重程度配置
export const severityLevels = {
  low: { 
    label: '轻微', 
    color: colors.success,
    icon: '✓'
  },
  medium: { 
    label: '中等', 
    color: colors.warning,
    icon: '!'
  },
  high: { 
    label: '严重', 
    color: colors.danger,
    icon: '!!'
  },
  critical: { 
    label: '特别严重', 
    color: '#C03639',
    icon: '!!!'
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  warningLevels,
  reportTypes,
  severityLevels,
};






