import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type {
  ProfileResponseDTO,
  UpdateProfileDTO,
} from '@/src/apis/backendApi/dto/profile/profile.dto'
import { profileDTOtoProfile } from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import type { Profile } from '@/src/models/profile/profile.model'

async function fetchUpdateProfile(data: UpdateProfileDTO): Promise<Profile> {
  const { data: res } = await backendClient.put<ProfileResponseDTO>('/api/profile', data)
  return profileDTOtoProfile(res.data)
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchUpdateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData<Profile>(['profile'], profile)
    },
  })
}
