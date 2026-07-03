import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { WeightSyncResponseDTO } from '@/src/apis/backendApi/dto/weight/weight.dto'

async function fetchWeightSync(): Promise<WeightSyncResponseDTO> {
  const { data } = await backendClient.post<WeightSyncResponseDTO>('/api/weight/sync-renpho')
  return data
}

export function useWeightSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchWeightSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] })
    },
  })
}
