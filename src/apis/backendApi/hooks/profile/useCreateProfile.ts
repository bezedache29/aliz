import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { ProfileDTO, ProfileResponseDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import { onboardingDataToCreateDTO } from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import type { OnboardingData } from '@/src/store/onboardingAtom'

async function fetchCreateProfile(data: OnboardingData): Promise<ProfileDTO> {
  const { data: res } = await backendClient.post<ProfileResponseDTO>(
    '/api/profile',
    onboardingDataToCreateDTO(data),
  )
  return res.data
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchCreateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile)
    },
  })
}
