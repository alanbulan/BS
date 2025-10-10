import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeScreen from '../screens/HomeScreen'
import SheltersScreen from '../screens/SheltersScreen'
import ReportsScreen from '../screens/ReportsScreen'
import ProfileScreen from '../screens/ProfileScreen'

export type TabParamList = {
  Home: undefined
  Shelters: undefined
  Reports: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

/**
 * MainTabs
 * 底部标签导航：隐藏自身 Header，避免与上层 Drawer 的 Header 重叠
 */
export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Shelters" component={SheltersScreen} options={{ title: '避难所' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: '上报' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  )
}