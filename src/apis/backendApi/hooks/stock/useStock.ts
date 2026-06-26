import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StockListResponseDTO } from '@/src/apis/backendApi/dto/stock/stock.dto'
import { stockItemDTOtoStockItem } from '@/src/apis/backendApi/mappers/stock/stock.mapper'
import type { StockItem } from '@/src/models/stock/stock-item.model'

async function fetchStock(): Promise<StockItem[]> {
  const { data } = await backendClient.get<StockListResponseDTO>('/api/stock')
  return data.data.map(stockItemDTOtoStockItem)
}

export function useStock() {
  return useQuery({
    queryKey: ['stock'],
    queryFn: fetchStock,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
