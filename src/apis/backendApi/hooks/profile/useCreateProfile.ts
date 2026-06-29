import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { ProfileResponseDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import {
  onboardingDataToCreateDTO,
  profileDTOtoProfile,
} from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import type { Profile } from '@/src/models/profile/profile.model'
import type { OnboardingData } from '@/src/store/onboardingAtom'

async function fetchCreateProfile(data: OnboardingData): Promise<Profile> {
  const { data: res } = await backendClient.post<ProfileResponseDTO>(
    '/api/profile',
    onboardingDataToCreateDTO(data),
  )
  return profileDTOtoProfile(res.data)
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchCreateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData<Profile>(['profile'], profile)
    },
  })
}
