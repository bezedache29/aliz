import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

type ScreenHeaderProps = {
  title: string
  subtitle?: string
  onBack?: () => void
}

export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  const c = useColors()
  const router = useRouter()

  return (
    <View
      style={[
        tw`flex-row items-center gap-3 px-4 py-3`,
        { borderBottomWidth: 1, borderBottomColor: c.border },
      ]}
    >
      <TouchableOpacity onPress={() => (onBack ? onBack() : router.back())} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
      </TouchableOpacity>
      <View style={tw`flex-1`}>
        <Text variant="heading3" style={{ fontWeight: '700' }}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  )
}
