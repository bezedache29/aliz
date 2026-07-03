import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { WeightEntry } from '@/src/models/weight/weight.model'

async function fetchDeleteWeight(id: string): Promise<void> {
  await backendClient.delete(`/api/weight/${id}`)
}

export function useDeleteWeight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchDeleteWeight,
    onSuccess: (_, id) => {
      queryClient.setQueryData<WeightEntry[]>(['weight'], (prev) =>
        prev ? prev.filter((e) => e.id !== id) : [],
      )
    },
  })
}
