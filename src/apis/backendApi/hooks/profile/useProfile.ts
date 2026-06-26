import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { ProfileResponseDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import { profileDTOtoProfile } from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import type { Profile } from '@/src/models/profile/profile.model'

async function fetchProfile(): Promise<Profile | null> {
  try {
    const { data } = await backendClient.get<ProfileResponseDTO>('/api/profile')
    return profileDTOtoProfile(data.data)
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
