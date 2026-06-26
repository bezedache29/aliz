import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StockItem } from '@/src/models/stock/stock-item.model'

async function fetchDeleteStock(id: string): Promise<void> {
  await backendClient.delete(`/api/stock/${id}`)
}

export function useDeleteStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchDeleteStock,
    onSuccess: (_, id) => {
      queryClient.setQueryData<StockItem[]>(['stock'], (prev) =>
        prev ? prev.filter((s) => s.id !== id) : [],
      )
    },
  })
}
