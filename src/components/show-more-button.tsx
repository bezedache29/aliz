import Ionicons from '@expo/vector-icons/Ionicons'
import { TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

interface ShowMoreControlsProps {
  visibleCount: number
  total: number
  previewCount: number
  step: number
  onChange: (count: number) => void
}

export function ShowMoreControls({
  visibleCount,
  total,
  previewCount,
  step,
  onChange,
}: ShowMoreControlsProps) {
  const c = useColors()

  const canShowLess = visibleCount > previewCount
  const canShowMore = visibleCount < total

  if (!canShowLess && !canShowMore) return null

  return (
    <View style={tw`flex-row items-center justify-center gap-4`}>
      {canShowLess && (
        <TouchableOpacity
          onPress={() => onChange(Math.max(previewCount, visibleCount - step))}
          hitSlop={8}
          style={tw`flex-row items-center gap-1 py-1`}
        >
          <Ionicons name="chevron-up" size={14} color={c.primary} />
          <Text variant="label" style={{ color: c.primary, fontWeight: '700' }}>
            Voir moins
          </Text>
        </TouchableOpacity>
      )}
      {canShowMore && (
        <TouchableOpacity
          onPress={() => onChange(Math.min(total, visibleCount + step))}
          hitSlop={8}
          style={tw`flex-row items-center gap-1 py-1`}
        >
          <Text variant="label" style={{ color: c.primary, fontWeight: '700' }}>
            Voir plus
          </Text>
          <Ionicons name="chevron-down" size={14} color={c.primary} />
        </TouchableOpacity>
      )}
    </View>
  )
}
