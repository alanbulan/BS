import 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import AuthStack from './src/navigation/AuthStack'
import DrawerNavigator from './src/navigation/DrawerNavigator'
import { useEffect } from 'react'
import { useAuthStore } from './src/store/auth'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

/**
 * App 根组件
 * - 未登录：进入 AuthStack
 * - 已登录：进入 DrawerNavigator（侧边栏 + MainTabs）
 */
export default function App() {
  const initialize = useAuthStore((s) => s.initializeFromStorage)
  const initializing = useAuthStore((s) => s.initializing)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    initialize()
  }, [])

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <StatusBar style="auto" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationContainer>
        {isAuthenticated ? <DrawerNavigator /> : <AuthStack />}
        <StatusBar style="auto" />
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}
