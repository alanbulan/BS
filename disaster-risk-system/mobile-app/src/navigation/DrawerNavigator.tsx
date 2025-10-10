import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { Pressable, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth'

// Screens
import HomeScreen from '../screens/HomeScreen'
import SheltersScreen from '../screens/SheltersScreen'
import ReportsScreen from '../screens/ReportsScreen'
import CreateReportScreen from '../screens/CreateReportScreen'
import ReportDetailScreen from '../screens/ReportDetailScreen'
import ProfileScreen from '../screens/ProfileScreen'
import NavigationScreen from '../screens/NavigationScreen'

// 预留模块屏幕（后续逐步实现）
import MonitoringView from '../screens/MonitoringScreen'
import WarningsView from '../screens/WarningsScreen'
import WarningDetailScreen from '../screens/WarningDetailScreen'
import RiskZonesView from '../screens/RiskZonesScreen'
import EscapeRoutesView from '../screens/EscapeRoutesScreen'
import SettingsView from '../screens/SettingsScreen'

export type DrawerParamList = {
  Home: undefined
  Warnings: undefined
  WarningDetail: { id: number }
  RiskZones: undefined
  Monitoring: undefined
  EscapeRoutes: undefined
  Shelters: undefined
  Reports: undefined
  CreateReport: undefined
  ReportDetail: { id: number }
  Profile: undefined
  Settings: undefined
  Navigation: { destination: { lat: number; lng: number; name: string }; routeId?: number; routeGeometry?: any }
}

const Drawer = createDrawerNavigator<DrawerParamList>()

// 自定义侧边栏内容
function CustomDrawerContent(props: any) {
  const { user } = useAuthStore()
  const avatarUrl = (user as any)?.avatar_url
  
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      {/* 用户信息头部 */}
      <LinearGradient colors={['#409EFF', '#5CADFF']} style={styles.drawerHeader}>
        {avatarUrl ? (
          <Image 
            source={{ uri: `http://localhost:3000${avatarUrl}` }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
        )}
        <Text style={styles.userName}>{user?.full_name || user?.username || '游客'}</Text>
        <Text style={styles.userRole}>{user?.role === 'admin' ? '系统管理员' : '普通用户'}</Text>
      </LinearGradient>
      
      {/* 菜单项 */}
      <View style={styles.menuSection}>
        <DrawerItemList {...props} />
      </View>
      
      {/* 底部版本信息 */}
      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>灾害风险评估系统</Text>
        <Text style={styles.footerVersion}>v1.2.0</Text>
      </View>
    </DrawerContentScrollView>
  )
}

/**
 * DrawerNavigator
 * 侧边栏为唯一的一级导航，不再使用底部Tabs。
 * Header 左侧统一提供菜单按钮。
 */
export default function DrawerNavigator() {
  const navigation = useNavigation()

  const getMenuIcon = (routeName: string) => {
    const icons: Record<string, string> = {
      Home: 'home',
      Warnings: 'warning',
      RiskZones: 'map',
      Monitoring: 'stats-chart',
      EscapeRoutes: 'navigate-circle',
      Shelters: 'business',
      Reports: 'document-text',
      Profile: 'person',
      Settings: 'settings'
    }
    return icons[routeName] || 'ellipse'
  }

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        headerShown: true,
        drawerType: 'front',
        drawerActiveTintColor: '#409EFF',
        drawerInactiveTintColor: '#606266',
        drawerActiveBackgroundColor: '#E3F2FD',
        drawerItemStyle: { borderRadius: 8, marginVertical: 2, marginHorizontal: 8 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
        drawerIcon: ({ focused, color }) => (
          <Ionicons 
            name={getMenuIcon(route.name) as any} 
            size={22} 
            color={focused ? '#409EFF' : '#909399'} 
          />
        ),
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityLabel="打开菜单"
          >
            <Ionicons name="menu" size={24} color="#303133" />
          </Pressable>
        ),
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Drawer.Screen name="Warnings" component={WarningsView} options={{ title: '预警' }} />
      <Drawer.Screen 
        name="WarningDetail" 
        component={WarningDetailScreen} 
        options={{ 
          title: '预警详情',
          drawerItemStyle: { display: 'none' }
        }} 
      />
      <Drawer.Screen name="RiskZones" component={RiskZonesView} options={{ title: '风险区域' }} />
      <Drawer.Screen name="Monitoring" component={MonitoringView} options={{ title: '监测' }} />
      <Drawer.Screen name="EscapeRoutes" component={EscapeRoutesView} options={{ title: '逃生路线' }} />
      <Drawer.Screen name="Shelters" component={SheltersScreen} options={{ title: '避难所' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: '上报' }} />
      <Drawer.Screen 
        name="CreateReport" 
        component={CreateReportScreen} 
        options={{ 
          title: '创建报告',
          drawerItemStyle: { display: 'none' }
        }} 
      />
      <Drawer.Screen 
        name="ReportDetail" 
        component={ReportDetailScreen} 
        options={{ 
          title: '报告详情',
          drawerItemStyle: { display: 'none' }
        }} 
      />
      <Drawer.Screen 
        name="Navigation" 
        component={NavigationScreen} 
        options={{ 
          title: '实时导航',
          drawerItemStyle: { display: 'none' }
        }} 
      />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
      <Drawer.Screen name="Settings" component={SettingsView} options={{ title: '设置' }} />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawerContent: { flex: 1 },
  drawerHeader: { padding: 20, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#FFFFFF' },
  avatarImage: { width: 70, height: 70, borderRadius: 35, marginBottom: 12, borderWidth: 3, borderColor: '#FFFFFF' },
  userName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  userRole: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  menuSection: { flex: 1, paddingTop: 8 },
  drawerFooter: { padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  footerText: { fontSize: 13, color: '#909399', marginBottom: 4 },
  footerVersion: { fontSize: 11, color: '#C0C4CC' },
})