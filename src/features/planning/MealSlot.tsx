import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { MealType, PlannedMeal } from '@/src/models/planning/planning.model'

const MEAL_ICONS: Record<MealType, React.ComponentProps<typeof Ionicons>['name']> = {
  'Petit-déjeuner': 'sunny-outline',
  Déjeuner: 'restaurant-outline',
  Collation: 'cafe-outline',
  Dîner: 'moon-outline',
}

type MealSlotProps = {
  meal: MealType
  planned?: PlannedMeal
  onAdd: () => void
  onRemove: () => void
  showSeparator?: boolean
}

export function MealSlot({ meal, planned, onAdd, onRemove, showSeparator = true }: MealSlotProps) {
  const c = useColors()

  return (
    <>
      <View style={tw`flex-row items-center gap-4 py-2`}>
        {/* Icône cercle */}
        <View
          style={[
            tw`w-12 h-12 rounded-full border items-center justify-center shrink-0`,
            { backgroundColor: c.surfaceElevated, borderColor: c.border },
          ]}
        >
          <Ionicons
            name={MEAL_ICONS[meal]}
            size={20}
            color={planned ? c.primary : c.textSecondary}
          />
        </View>

        {/* Contenu central */}
        <View style={tw`flex-1 gap-0.5`}>
          <Text variant="body" style={{ fontWeight: '700' }}>
            {meal}
          </Text>
          {planned ? (
            <>
              <Text variant="caption" color="accent" style={{ fontWeight: '600' }}>
                {planned.kcal} kcal
              </Text>
              <Text variant="caption" color="secondary" numberOfLines={1}>
                {planned.name}
              </Text>
              <View style={tw`flex-row gap-1 mt-0.5`}>
                <MacroPill label="P" value={planned.proteines} color={c.info} />
                <MacroPill label="G" value={planned.glucides} color={c.warning} />
                <MacroPill label="L" value={planned.lipides} color={c.tertiary} />
              </View>
            </>
          ) : (
            <Text variant="caption" color="muted">
              Aucun repas planifié
            </Text>
          )}
        </View>

        {/* Action bouton */}
        {planned ? (
          <TouchableOpacity
            testID="remove-button"
            onPress={onRemove}
            hitSlop={8}
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center shrink-0`,
              { backgroundColor: c.surfaceElevated },
            ]}
          >
            <Ionicons name="close" size={16} color={c.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="add-button" onPress={onAdd} activeOpacity={0.8}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center shrink-0`,
                { backgroundColor: c.primary },
              ]}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {showSeparator && (
        <View
          style={[tw`ml-16`, { height: StyleSheet.hairlineWidth, backgroundColor: c.border }]}
        />
      )}
    </>
  )
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[tw`py-0.5 px-1.5 rounded-lg`, { backgroundColor: color + '35' }]}>
      <Text variant="caption" style={{ color, fontWeight: '600' }}>
        {label} {value}g
      </Text>
    </View>
  )
}
