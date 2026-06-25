import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import type {
  AiRecipeSuggestion,
  AiSlotStatus,
  MealType,
} from '@/src/models/planning/planning.model'

const MEAL_ICONS: Record<MealType, React.ComponentProps<typeof Ionicons>['name']> = {
  'Petit-déjeuner': 'sunny-outline',
  Déjeuner: 'restaurant-outline',
  Collation: 'cafe-outline',
  Dîner: 'moon-outline',
}

const MEAL_COLORS: Record<MealType, (c: ReturnType<typeof useColors>) => string> = {
  'Petit-déjeuner': (c) => c.warning,
  Déjeuner: (c) => c.primary,
  Collation: (c) => c.tertiary,
  Dîner: (c) => c.info,
}

type RecipeSlotProps = {
  meal: MealType
  status: AiSlotStatus
  recipe?: AiRecipeSuggestion
  onPress: () => void
  showSeparator?: boolean
}

export function RecipeSlot({
  meal,
  status,
  recipe,
  onPress,
  showSeparator = true,
}: RecipeSlotProps) {
  const c = useColors()
  const mealColor = MEAL_COLORS[meal](c)

  return (
    <>
      <TouchableOpacity
        testID="recipe-slot-pressable"
        onPress={onPress}
        activeOpacity={0.75}
        style={tw`flex-row items-center gap-4 py-3`}
      >
        <View
          style={[
            tw`w-11 h-11 rounded-full items-center justify-center shrink-0`,
            { backgroundColor: mealColor + '20' },
          ]}
        >
          <Ionicons name={MEAL_ICONS[meal]} size={20} color={mealColor} />
        </View>

        <View style={tw`flex-1 gap-0.5`}>
          <Text variant="body" style={{ fontWeight: '700' }}>
            {meal}
          </Text>
          {status === 'loading' && (
            <LoadingContent testID="recipe-slot-loading" color={c.primary} />
          )}
          {status === 'idle' && <IdleContent testID="recipe-slot-idle" />}
          {status === 'done' && recipe && <RecipeContent recipe={recipe} colors={c} />}
        </View>

        {status === 'done' && <Ionicons name="chevron-forward" size={16} color={c.textSecondary} />}
      </TouchableOpacity>

      {showSeparator && (
        <View
          style={[tw`ml-16`, { height: StyleSheet.hairlineWidth, backgroundColor: c.border }]}
        />
      )}
    </>
  )
}

function LoadingContent({ testID, color }: { testID: string; color: string }) {
  return (
    <View testID={testID} style={tw`flex-row items-center gap-2 mt-1`}>
      <ActivityIndicator size="small" color={color} />
      <Text variant="caption" color="muted">
        {"L'IA génère une suggestion…"}
      </Text>
    </View>
  )
}

function IdleContent({ testID }: { testID: string }) {
  return (
    <Text testID={testID} variant="caption" color="muted">
      En attente de génération
    </Text>
  )
}

function RecipeContent({
  recipe,
  colors: c,
}: {
  recipe: AiRecipeSuggestion
  colors: ReturnType<typeof useColors>
}) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)

  return (
    <>
      <Text testID="recipe-name" variant="caption" color="secondary" numberOfLines={1}>
        {recipe.name}
      </Text>
      <View style={tw`flex-row items-center gap-3`}>
        <View style={tw`flex-row items-center gap-1`}>
          <Ionicons name="flame" size={13} color={c.primary} />
          <Text variant="caption" style={{ fontWeight: '700', color: c.primary }}>
            {recipe.kcal}
          </Text>
          <Text variant="caption" style={{ color: c.textMuted }}>
            kcal
          </Text>
        </View>
        {totalTime > 0 && (
          <View style={tw`flex-row items-center gap-1`}>
            <Ionicons name="time-outline" size={13} color={c.textMuted} />
            <Text variant="caption" style={{ color: c.textMuted }}>
              {totalTime} min
            </Text>
          </View>
        )}
      </View>
      <View style={tw`flex-row items-center gap-3 mt-0.5`}>
        <MacroInline label="P" value={recipe.proteines} color={c.tertiary} />
        <MacroInline label="G" value={recipe.glucides} color={c.warning} />
        <MacroInline label="L" value={recipe.lipides} color={c.info} />
      </View>
    </>
  )
}

function MacroInline({ label, value, color }: { label: string; value: number; color: string }) {
  const c = useColors()
  return (
    <View style={tw`flex-row items-center gap-1`}>
      <Text variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </Text>
      <Text variant="caption" style={{ color: c.textSecondary }}>
        {value}g
      </Text>
    </View>
  )
}
