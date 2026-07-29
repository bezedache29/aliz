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

const MEAL_COLORS: Record<MealType, (c: ReturnType<typeof useColors>) => string> = {
  'Petit-déjeuner': (c) => c.warning,
  Déjeuner: (c) => c.primary,
  Collation: (c) => c.tertiary,
  Dîner: (c) => c.info,
}

type MealSlotProps = {
  meal: MealType
  plannedItems: PlannedMeal[]
  onAdd?: () => void
  onPressItem?: (item: PlannedMeal) => void
  showSeparator?: boolean
  readOnly?: boolean
}

export function MealSlot({
  meal,
  plannedItems,
  onAdd,
  onPressItem,
  showSeparator = true,
  readOnly = false,
}: MealSlotProps) {
  const c = useColors()
  const mealColor = MEAL_COLORS[meal](c)

  const totalKcal = plannedItems.reduce((sum, m) => sum + m.kcal, 0)
  const totalP = plannedItems.reduce((sum, m) => sum + m.proteines, 0)
  const totalG = plannedItems.reduce((sum, m) => sum + m.glucides, 0)
  const totalL = plannedItems.reduce((sum, m) => sum + m.lipides, 0)

  return (
    <>
      {/* Header */}
      <View style={tw`flex-row items-center gap-4 py-3`}>
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
          {plannedItems.length === 0 ? (
            <Text variant="caption" color="muted">
              Aucun aliment ajouté
            </Text>
          ) : (
            <View style={tw`flex-row items-center gap-1`}>
              <Ionicons name="flame" size={13} color={c.primary} />
              <Text variant="caption" style={{ fontWeight: '700', color: c.primary }}>
                {totalKcal}
              </Text>
              <Text variant="caption" color="muted">
                kcal
              </Text>
              <Text variant="caption" color="muted">
                ·
              </Text>
              <Text variant="caption" style={{ color: c.tertiary, fontWeight: '700' }}>
                P{Math.round(totalP)}g
              </Text>
              <Text variant="caption" style={{ color: c.warning, fontWeight: '700' }}>
                G{Math.round(totalG)}g
              </Text>
              <Text variant="caption" style={{ color: c.info, fontWeight: '700' }}>
                L{Math.round(totalL)}g
              </Text>
            </View>
          )}
        </View>

        {!readOnly && (
          <TouchableOpacity
            testID="add-button"
            onPress={onAdd}
            activeOpacity={0.8}
            style={[
              tw`w-9 h-9 rounded-full items-center justify-center shrink-0`,
              { backgroundColor: c.primary },
            ]}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Items list */}
      {plannedItems.map((item, index) => {
        const ItemContainer = readOnly ? View : TouchableOpacity
        return (
          <View key={item.id}>
            {index === 0 && (
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: c.border,
                  marginLeft: 60,
                }}
              />
            )}
            <ItemContainer
              testID="meal-item"
              {...(!readOnly && { onPress: () => onPressItem?.(item), activeOpacity: 0.75 })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingLeft: 60,
              }}
            >
              <View style={tw`flex-1`}>
                <Text variant="body" numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={tw`flex-row items-center gap-1.5`}>
                  {item.quantityG != null && (
                    <>
                      <Text variant="caption" color="muted">
                        {item.quantityG}g
                      </Text>
                      <Text variant="caption" color="muted">
                        ·
                      </Text>
                    </>
                  )}
                  <Ionicons name="flame" size={11} color={c.primary} />
                  <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                    {item.kcal}
                  </Text>
                  <Text variant="caption" color="muted">
                    kcal
                  </Text>
                </View>
              </View>
              {!readOnly && (
                <Ionicons name="chevron-forward" size={14} color={c.textMuted} style={tw`mr-1`} />
              )}
            </ItemContainer>
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: c.border,
                marginLeft: 60,
              }}
            />
          </View>
        )
      })}

      {showSeparator && plannedItems.length === 0 && (
        <View
          style={[tw`ml-16`, { height: StyleSheet.hairlineWidth, backgroundColor: c.border }]}
        />
      )}
      {showSeparator && plannedItems.length > 0 && (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />
      )}
    </>
  )
}
