import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'
import { getExpiryStatus } from '@/src/models/stock/stock-item.model'

export function useExpiringCount(): number {
  const { data: stock = [] } = useStock()
  return stock.filter((item) => {
    const status = getExpiryStatus(item)
    return status === 'expired' || status === 'critical' || status === 'warning'
  }).length
}
