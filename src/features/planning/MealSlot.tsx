import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { MealType, PlannedMeal } from '@/src/models/planning/planning.model'
import { radius, spacing } from '@/src/styles/design-tokens'

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
      <View style={styles.row}>
        {/* Icône cercle */}
        <View
          style={[styles.iconCircle, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}
        >
          <Ionicons
            name={MEAL_ICONS[meal]}
            size={20}
            color={planned ? c.primary : c.textSecondary}
          />
        </View>

        {/* Contenu central */}
        <View style={styles.content}>
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
              <View style={styles.macros}>
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
            style={[styles.removeButton, { backgroundColor: c.surfaceElevated }]}
          >
            <Ionicons name="close" size={16} color={c.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="add-button" onPress={onAdd} activeOpacity={0.8}>
            <View style={[styles.addButton, { backgroundColor: c.primary }]}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {showSeparator && <View style={[styles.separator, { backgroundColor: c.border }]} />}
    </>
  )
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '35' }]}>
      <Text variant="caption" style={{ color, fontWeight: '600' }}>
        {label} {value}g
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  macros: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48 + spacing.md,
  },
})
