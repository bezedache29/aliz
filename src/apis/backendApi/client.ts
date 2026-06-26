import { create } from 'axios'
import applyCaseMiddleware from 'axios-case-converter'

export const backendClient = applyCaseMiddleware(
  create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_TOKEN}`,
    },
  }),
)
