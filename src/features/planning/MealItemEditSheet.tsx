import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useEffect, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import type { MealType, PlannedMeal } from '@/src/models/planning/planning.model'

type Props = {
  item: PlannedMeal | null
  mealType: MealType
  onSave: (updated: PlannedMeal) => void
  onDelete: (id: string) => void
}

function recalcMacros(
  per100g: NonNullable<PlannedMeal['per100g']>,
  grams: number,
): Pick<PlannedMeal, 'kcal' | 'proteines' | 'glucides' | 'lipides'> {
  const f = grams / 100
  return {
    kcal: Math.round(per100g.kcal * f),
    proteines: Math.round(per100g.proteines * f * 10) / 10,
    glucides: Math.round(per100g.glucides * f * 10) / 10,
    lipides: Math.round(per100g.lipides * f * 10) / 10,
  }
}

export const MealItemEditSheet = forwardRef<BottomSheetModal, Props>(
  ({ item, mealType, onSave, onDelete }, ref) => {
    const c = useColors()
    const [quantityStr, setQuantityStr] = useState('100')

    const canEdit = !!item?.per100g

    useEffect(() => {
      if (item?.quantityG != null) {
        setQuantityStr(String(item.quantityG))
      } else {
        setQuantityStr('100')
      }
    }, [item?.id])

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    )

    function handleSave() {
      if (!item || !item.per100g) return
      const grams = parseFloat(quantityStr.replace(',', '.')) || (item.quantityG ?? 100)
      onSave({ ...item, ...recalcMacros(item.per100g, grams), quantityG: grams })
    }

    function handleDelete() {
      if (!item) return
      onDelete(item.id)
    }

    const grams = parseFloat(quantityStr.replace(',', '.')) || 0
    const preview = item?.per100g && grams > 0 ? recalcMacros(item.per100g, grams) : null

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['52%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-4`}>
          {/* Header */}
          <View style={tw`gap-0.5`}>
            <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
              {mealType}
            </Text>
            {item && (
              <Text variant="heading3" style={{ fontWeight: '700' }} numberOfLines={2}>
                {item.name}
              </Text>
            )}
          </View>

          {canEdit && item ? (
            <>
              {/* Quantité + aperçu kcal */}
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`flex-1 gap-1`}>
                  <Text variant="label" color="muted" uppercase>
                    Quantité
                  </Text>
                  <View
                    style={[
                      tw`flex-row items-center rounded-xl px-4`,
                      {
                        backgroundColor: c.surfaceElevated,
                        borderWidth: 1,
                        borderColor: c.border,
                        height: 48,
                      },
                    ]}
                  >
                    <TextInput
                      value={quantityStr}
                      onChangeText={setQuantityStr}
                      keyboardType="numeric"
                      selectTextOnFocus
                      style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                    />
                    <Text variant="body" color="muted">
                      g
                    </Text>
                  </View>
                </View>
                {preview && (
                  <View
                    style={[
                      tw`px-4 py-3 rounded-xl items-center justify-center`,
                      { backgroundColor: c.primary + '15', minWidth: 88 },
                    ]}
                  >
                    <Text
                      style={{ fontWeight: '800', color: c.primary, fontSize: 20, lineHeight: 24 }}
                    >
                      {preview.kcal}
                    </Text>
                    <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                      kcal
                    </Text>
                  </View>
                )}
              </View>

              {/* Aperçu macros */}
              {preview && (
                <View style={[tw`flex-row rounded-xl p-3`, { backgroundColor: c.surfaceElevated }]}>
                  <MacroChip label="Protéines" value={preview.proteines} color={c.info} />
                  <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                  <MacroChip label="Glucides" value={preview.glucides} color={c.warning} />
                  <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                  <MacroChip label="Lipides" value={preview.lipides} color={c.tertiary} />
                </View>
              )}

              {/* Enregistrer */}
              <TouchableOpacity
                testID="save-button"
                activeOpacity={0.8}
                onPress={handleSave}
                style={[tw`p-4 rounded-2xl items-center`, { backgroundColor: c.primary }]}
              >
                <Text variant="body" style={{ fontWeight: '700', color: '#FFFFFF' }}>
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            item && (
              <View style={[tw`flex-row rounded-xl p-3`, { backgroundColor: c.surfaceElevated }]}>
                <MacroChip label="Protéines" value={item.proteines} color={c.info} />
                <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                <MacroChip label="Glucides" value={item.glucides} color={c.warning} />
                <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                <MacroChip label="Lipides" value={item.lipides} color={c.tertiary} />
              </View>
            )
          )}

          {/* Supprimer */}
          <TouchableOpacity
            testID="delete-button"
            activeOpacity={0.8}
            onPress={handleDelete}
            style={[
              tw`p-4 rounded-2xl items-center flex-row justify-center gap-2`,
              {
                backgroundColor: '#ef4444' + '12',
                borderWidth: 1,
                borderColor: '#ef4444' + '30',
              },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text variant="body" style={{ fontWeight: '700', color: '#ef4444' }}>
              Supprimer
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

MealItemEditSheet.displayName = 'MealItemEditSheet'

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  const c = useColors()
  return (
    <View style={tw`items-center flex-1`}>
      <Text style={{ fontWeight: '700', fontSize: 17, color }}>{value}g</Text>
      <Text variant="caption" style={{ color: c.textMuted }}>
        {label}
      </Text>
    </View>
  )
}
