import axios from 'axios'
import applyCaseMiddleware from 'axios-case-converter'

export const apiClient = applyCaseMiddleware(
  axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }),
)
