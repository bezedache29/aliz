import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import type { PlannedRecipeCourse } from '@/src/models/planning/planning.model'

type AiSuggestionCardProps = {
  suggestion: PlannedRecipeCourse
  onAccept: () => void
  onModify: () => void
  onRegenerate: () => void
  onOpenRegeneratePrompt: () => void
  onReject: () => void
  onViewDetails: () => void
  isRegenerating?: boolean
}

function ActionButton({
  testID,
  icon,
  color,
  disabled,
  loading,
  onPress,
}: {
  testID: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  color: string
  disabled?: boolean
  loading?: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        tw`w-10 h-10 rounded-full items-center justify-center`,
        { backgroundColor: color + '18', opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={18} color={color} />
      )}
    </TouchableOpacity>
  )
}

export function AiSuggestionCard({
  suggestion,
  onAccept,
  onModify,
  onRegenerate,
  onOpenRegeneratePrompt,
  onReject,
  onViewDetails,
  isRegenerating = false,
}: AiSuggestionCardProps) {
  const c = useColors()
  const { recipe, course } = suggestion

  return (
    <TouchableOpacity
      testID="suggestion-view-details"
      onPress={onViewDetails}
      activeOpacity={0.7}
      style={[
        tw`rounded-2xl p-3 mb-2 gap-2`,
        { backgroundColor: c.primary + '10', borderWidth: 1, borderColor: c.primary + '30' },
      ]}
    >
      <View style={tw`flex-row items-center gap-2`}>
        <Ionicons name="bulb-outline" size={15} color={c.primary} />
        <Text variant="caption" style={{ color: c.primary, fontWeight: '700' }} uppercase>
          {course ? `Suggestion IA · ${course}` : 'Suggestion IA'}
        </Text>
      </View>

      <View style={tw`flex-row items-center gap-2`}>
        <View style={tw`flex-1 gap-0.5`}>
          <Text variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
            {recipe.name}
          </Text>
          <View style={tw`flex-row items-center gap-1.5`}>
            <Ionicons name="flame" size={12} color={c.primary} />
            <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
              {recipe.kcal} kcal
            </Text>
            <Text variant="caption" color="muted">
              ·
            </Text>
            <Text variant="caption" style={{ color: c.tertiary, fontWeight: '700' }}>
              P{Math.round(recipe.proteines)}g
            </Text>
            <Text variant="caption" style={{ color: c.warning, fontWeight: '700' }}>
              G{Math.round(recipe.glucides)}g
            </Text>
            <Text variant="caption" style={{ color: c.info, fontWeight: '700' }}>
              L{Math.round(recipe.lipides)}g
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
      </View>

      <View style={tw`flex-row justify-between mt-1`}>
        <ActionButton
          testID="suggestion-accept"
          icon="checkmark"
          color={c.primary}
          disabled={isRegenerating}
          onPress={onAccept}
        />
        <ActionButton
          testID="suggestion-modify"
          icon="create-outline"
          color={c.info}
          disabled={isRegenerating}
          onPress={onModify}
        />
        <ActionButton
          testID="suggestion-regenerate"
          icon="refresh-outline"
          color={c.warning}
          disabled={isRegenerating}
          loading={isRegenerating}
          onPress={onRegenerate}
        />
        <ActionButton
          testID="suggestion-regenerate-prompt"
          icon="chatbubble-ellipses-outline"
          color={c.tertiary}
          disabled={isRegenerating}
          onPress={onOpenRegeneratePrompt}
        />
        <ActionButton
          testID="suggestion-reject"
          icon="close"
          color={c.danger}
          disabled={isRegenerating}
          onPress={onReject}
        />
      </View>
    </TouchableOpacity>
  )
}
