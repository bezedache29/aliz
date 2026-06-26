import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { ProfileDTO, ProfileResponseDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import { onboardingDataToUpdateDTO } from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import type { OnboardingData } from '@/src/store/onboardingAtom'

async function fetchUpdateProfile(data: Partial<OnboardingData>): Promise<ProfileDTO> {
  const { data: res } = await backendClient.put<ProfileResponseDTO>(
    '/api/profile',
    onboardingDataToUpdateDTO(data),
  )
  return res.data
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchUpdateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile)
    },
  })
}
