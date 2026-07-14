import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'

interface StravaDisconnectResponseDTO {
  connected: false
}

async function fetchStravaDisconnect(): Promise<StravaDisconnectResponseDTO> {
  const { data } = await backendClient.post<StravaDisconnectResponseDTO>('/api/strava/disconnect')
  return data
}

export function useStravaDisconnect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchStravaDisconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strava-status'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
