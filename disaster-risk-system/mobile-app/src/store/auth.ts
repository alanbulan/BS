import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import axios from 'axios'
import { API_BASE_URL } from '../config/env'

export type User = {
  id: number
  username: string
  email: string
  role: 'user' | 'admin' | 'expert' | string
  [key: string]: any
}

interface AuthState {
  isAuthenticated: boolean
  initializing: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (payload: { user: User; accessToken: string; refreshToken: string }) => Promise<void>
  logout: () => Promise<void>
  initializeFromStorage: () => Promise<void>
  refreshTokens: () => Promise<boolean>
}

let refreshingPromise: Promise<boolean> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  initializing: true,
  user: null,
  accessToken: null,
  refreshToken: null,

  initializeFromStorage: async () => {
    try {
      const [userStr, at, rt] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
      ])
      if (at && userStr) {
        set({ isAuthenticated: true, user: JSON.parse(userStr), accessToken: at, refreshToken: rt })
      }
    } finally {
      set({ initializing: false })
    }
  },

  login: async ({ user, accessToken, refreshToken }) => {
    await Promise.all([
      AsyncStorage.setItem('user', JSON.stringify(user)),
      AsyncStorage.setItem('accessToken', accessToken),
      AsyncStorage.setItem('refreshToken', refreshToken || ''),
    ])
    set({ isAuthenticated: true, user, accessToken, refreshToken })
  },

  logout: async () => {
    try {
      const rt = get().refreshToken
      if (rt) {
        // best-effort logout; ignore errors
        await axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken: rt }).catch(() => {})
      }
    } finally {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken'),
      ])
      set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null })
    }
  },

  refreshTokens: async () => {
    if (refreshingPromise) return refreshingPromise
    const rt = get().refreshToken
    if (!rt) return false
    refreshingPromise = (async () => {
      try {
        const resp = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: rt })
        // Response is wrapped in ApiResponse
        if (resp.data?.success) {
          const { accessToken, refreshToken: newRT } = resp.data.data
          await AsyncStorage.setItem('accessToken', accessToken)
          if (newRT) await AsyncStorage.setItem('refreshToken', newRT)
          set({ accessToken, refreshToken: newRT || rt })
          return true
        }
        return false
      } catch (e) {
        await get().logout()
        return false
      } finally {
        refreshingPromise = null
      }
    })()
    return refreshingPromise
  },
}))