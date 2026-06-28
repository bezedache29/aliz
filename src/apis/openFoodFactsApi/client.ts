import { create } from 'axios'

export const offClient = create({
  baseURL: 'https://world.openfoodfacts.org',
  timeout: 8000,
  auth: {
    username: process.env.EXPO_PUBLIC_OFF_USERNAME ?? '',
    password: process.env.EXPO_PUBLIC_OFF_PASSWORD ?? '',
  },
  headers: {
    'User-Agent': 'Aliz/1.0.0 (bezedache29@gmail.com)',
  },
})
