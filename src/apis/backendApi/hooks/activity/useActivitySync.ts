import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StravaActivitySyncResponseDTO } from '@/src/apis/backendApi/dto/activity/activity.dto'

async function fetchActivitySync(): Promise<StravaActivitySyncResponseDTO> {
  const { data } = await backendClient.post<StravaActivitySyncResponseDTO>(
    '/api/activities/sync-strava',
  )
  return data
}

export function useActivitySync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchActivitySync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['strava-status'] })
    },
  })
}
