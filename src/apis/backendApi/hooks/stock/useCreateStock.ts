import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StockItemResponseDTO } from '@/src/apis/backendApi/dto/stock/stock.dto'
import {
  stockItemDTOtoStockItem,
  stockItemToCreateDTO,
} from '@/src/apis/backendApi/mappers/stock/stock.mapper'
import type { StockItem } from '@/src/models/stock/stock-item.model'

async function fetchCreateStock(item: Omit<StockItem, 'id' | 'addedAt'>): Promise<StockItem> {
  const { data } = await backendClient.post<StockItemResponseDTO>(
    '/api/stock',
    stockItemToCreateDTO(item),
  )
  return stockItemDTOtoStockItem(data.data)
}

export function useCreateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchCreateStock,
    onSuccess: (created, variables) => {
      const full: StockItem = {
        ...variables,
        id: created.id,
        addedAt: created.addedAt,
      }
      queryClient.setQueryData<StockItem[]>(['stock'], (prev) => [full, ...(prev ?? [])])
    },
  })
}
