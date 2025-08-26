import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const accessToken = ref('')
  const refreshToken = ref('')

  const login = (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
    isAuthenticated.value = true
    user.value = userData
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = async () => {
    isAuthenticated.value = false
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  const initializeAuth = () => {
    const savedAccessToken = localStorage.getItem('accessToken')
    const savedRefreshToken = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')
    
    if (savedAccessToken && savedUser) {
      accessToken.value = savedAccessToken
      refreshToken.value = savedRefreshToken || ''
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
    }
  }

  return {
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
    login,
    logout,
    initializeAuth
  }
})