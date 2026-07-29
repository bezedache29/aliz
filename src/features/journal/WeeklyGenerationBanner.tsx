import Ionicons from '@expo/vector-icons/Ionicons'
import { useSetAtom } from 'jotai'
import { TouchableOpacity } from 'react-native'
import tw from 'twrnc'

import { useMissingWeeklySuggestions } from '@/src/features/planning/useMissingWeeklySuggestions'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { openWeeklyGenerateSheetAtom } from '@/src/store/planningAtom'

export function WeeklyGenerationBanner() {
  const c = useColors()
  const { missingSlots, isLoading } = useMissingWeeklySuggestions()
  const requestOpenWeeklyGenerate = useSetAtom(openWeeklyGenerateSheetAtom)

  if (isLoading || missingSlots.length === 0) return null

  return (
    <TouchableOpacity
      testID="weekly-generation-banner"
      activeOpacity={0.8}
      onPress={() => requestOpenWeeklyGenerate((prev) => prev + 1)}
      style={[
        tw`flex-row items-center gap-3 rounded-2xl p-3`,
        { backgroundColor: c.warning + '15', borderWidth: 1, borderColor: c.warning + '30' },
      ]}
    >
      <Ionicons name="sparkles-outline" size={18} color={c.warning} />
      <Text variant="caption" style={{ flex: 1, color: c.warning, fontWeight: '600' }}>
        Les suggestions IA de la semaine ne sont pas encore générées
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.warning} />
    </TouchableOpacity>
  )
}
