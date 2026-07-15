import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'
import { isExpiringSoon } from '@/src/models/stock/stock-item.model'

const EXPIRING_SOON_MAX_DAYS = 3

export function useExpiringSoonCount(): number {
  const { data: stock = [] } = useStock()
  return stock.filter((item) => isExpiringSoon(item, EXPIRING_SOON_MAX_DAYS)).length
}
