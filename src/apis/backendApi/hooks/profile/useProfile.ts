import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { ProfileDTO, ProfileResponseDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'

async function fetchProfile(): Promise<ProfileDTO | null> {
  try {
    const { data } = await backendClient.get<ProfileResponseDTO>('/api/profile')
    return data.data
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
