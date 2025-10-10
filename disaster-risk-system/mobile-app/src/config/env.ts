import Constants from 'expo-constants'

// Backend API base URL; can be overridden by app.json -> expo.extra.backendUrl
export const API_BASE_URL: string =
  (Constants?.expoConfig?.extra as any)?.backendUrl || 'http://localhost:3000/api/v1'