import { CiqualFoodDTO } from '@/src/apis/ciqualApi/dto/food/food.dto'

const rawData = require('@/assets/data/ciqual.json') as CiqualFoodDTO[]

export const isCiqualLoaded = rawData.length > 0

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
}

export function searchCiqual(query: string, limit = 20): CiqualFoodDTO[] {
  const words = normalizeStr(query.trim())
    .split(/[\s,;.()/]+/)
    .filter((w) => w.length >= 3)
  if (words.length === 0) return []

  return rawData
    .filter((item) => {
      const nameWords = normalizeStr(item.nom)
        .split(/[\s,;.()/]+/)
        .filter((w) => w.length >= 2)
      return words.every((qw) => nameWords.some((nw) => nw.startsWith(qw)))
    })
    .slice(0, limit)
}
