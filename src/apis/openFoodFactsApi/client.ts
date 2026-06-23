import { create } from 'axios'

export const offClient = create({
  baseURL: 'https://world.openfoodfacts.org',
  timeout: 10000,
})
