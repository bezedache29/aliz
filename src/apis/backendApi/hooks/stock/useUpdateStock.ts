import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StockItemResponseDTO } from '@/src/apis/backendApi/dto/stock/stock.dto'
import { stockItemToUpdateDTO } from '@/src/apis/backendApi/mappers/stock/stock.mapper'
import type { StockItem } from '@/src/models/stock/stock-item.model'

async function fetchUpdateStock(item: StockItem): Promise<void> {
  await backendClient.put<StockItemResponseDTO>(`/api/stock/${item.id}`, stockItemToUpdateDTO(item))
}

export function useUpdateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchUpdateStock,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<StockItem[]>(['stock'], (prev) =>
        prev ? prev.map((s) => (s.id === variables.id ? variables : s)) : [variables],
      )
    },
  })
}
