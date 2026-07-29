import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useEffect, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import type { MealType, PlannedRecipeCourse } from '@/src/models/planning/planning.model'
import { computeRecipeNutrition, type RecipeIngredient } from '@/src/models/recipe/recipe.model'

type Props = {
  suggestion: PlannedRecipeCourse | null
  mealType: MealType
  onConfirm: (ingredients: RecipeIngredient[]) => void
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={tw`items-center flex-1`}>
      <Text style={{ fontWeight: '700', fontSize: 17, color }}>{value}g</Text>
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </View>
  )
}

function IngredientRow({
  ingredient,
  onChangeQuantity,
  onRemove,
}: {
  ingredient: RecipeIngredient
  onChangeQuantity: (quantityG: number) => void
  onRemove: () => void
}) {
  const c = useColors()
  const [quantityStr, setQuantityStr] = useState(String(ingredient.quantityG))

  useEffect(() => {
    setQuantityStr(String(ingredient.quantityG))
  }, [ingredient.quantityG])

  function handleChangeText(v: string) {
    setQuantityStr(v)
    const parsed = parseFloat(v.replace(',', '.'))
    if (!isNaN(parsed)) onChangeQuantity(parsed)
  }

  return (
    <View style={tw`flex-row items-center gap-2 py-2`}>
      <Text variant="body" style={tw`flex-1`} numberOfLines={1}>
        {ingredient.food.name}
      </Text>
      <View
        style={[
          tw`flex-row items-center rounded-lg px-2`,
          { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, height: 36 },
        ]}
      >
        <TextInput
          testID="ingredient-quantity"
          value={quantityStr}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          selectTextOnFocus
          style={[tw`w-12 text-right text-sm`, { color: c.textPrimary }]}
        />
        <Text variant="caption" color="muted">
          {' '}
          g
        </Text>
      </View>
      <TouchableOpacity testID="ingredient-remove" onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-circle-outline" size={20} color={c.textMuted} />
      </TouchableOpacity>
    </View>
  )
}

export const IngredientEditSheet = forwardRef<BottomSheetModal, Props>(
  ({ suggestion, mealType, onConfirm }, ref) => {
    const c = useColors()
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])

    useEffect(() => {
      setIngredients(suggestion?.recipe.ingredients ?? [])
    }, [suggestion?.recipe.id])

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    )

    function handleRemove(index: number) {
      setIngredients((prev) => prev.filter((_, i) => i !== index))
    }

    function handleChangeQuantity(index: number, quantityG: number) {
      setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, quantityG } : ing)))
    }

    function handleConfirm() {
      onConfirm(ingredients)
    }

    const nutrition = computeRecipeNutrition(ingredients, 1)

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['75%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
        keyboardBehavior="extend"
      >
        <BottomSheetScrollView contentContainerStyle={tw`px-4 pt-2 pb-8 gap-4`}>
          <View style={tw`gap-0.5`}>
            <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
              {mealType}
            </Text>
            {suggestion && (
              <Text variant="heading3" style={{ fontWeight: '700' }} numberOfLines={2}>
                {suggestion.recipe.name}
              </Text>
            )}
          </View>

          <View style={[tw`flex-row rounded-xl p-3`, { backgroundColor: c.surfaceElevated }]}>
            <View style={tw`items-center flex-1`}>
              <Text style={{ fontWeight: '800', color: c.primary, fontSize: 20 }}>
                {nutrition.kcal}
              </Text>
              <Text variant="caption" color="muted">
                kcal
              </Text>
            </View>
            <View style={[tw`w-px`, { backgroundColor: c.border }]} />
            <MacroChip label="Protéines" value={nutrition.proteines} color={c.info} />
            <View style={[tw`w-px`, { backgroundColor: c.border }]} />
            <MacroChip label="Glucides" value={nutrition.glucides} color={c.warning} />
            <View style={[tw`w-px`, { backgroundColor: c.border }]} />
            <MacroChip label="Lipides" value={nutrition.lipides} color={c.tertiary} />
          </View>

          <View style={tw`gap-1`}>
            <Text variant="label" color="muted" uppercase>
              Ingrédients
            </Text>
            {ingredients.length === 0 ? (
              <Text variant="caption" color="muted" style={tw`py-2`}>
                Plus aucun ingrédient — retire cette suggestion avec « Refuser » à la place.
              </Text>
            ) : (
              ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={`${ingredient.food.id}-${index}`}
                  ingredient={ingredient}
                  onChangeQuantity={(quantityG) => handleChangeQuantity(index, quantityG)}
                  onRemove={() => handleRemove(index)}
                />
              ))
            )}
          </View>

          <TouchableOpacity
            testID="confirm-button"
            activeOpacity={0.8}
            disabled={ingredients.length === 0}
            onPress={handleConfirm}
            style={[
              tw`p-4 rounded-2xl items-center`,
              { backgroundColor: c.primary, opacity: ingredients.length === 0 ? 0.5 : 1 },
            ]}
          >
            <Text variant="body" style={{ fontWeight: '700', color: '#FFFFFF' }}>
              Valider dans le Journal
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

IngredientEditSheet.displayName = 'IngredientEditSheet'
