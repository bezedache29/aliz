import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import type { PlannedRecipeCourse } from '@/src/models/planning/planning.model'

type Props = {
  course: PlannedRecipeCourse | null
}

export const RecipeDetailSheet = forwardRef<BottomSheetModal, Props>(({ course }, ref) => {
  const c = useColors()

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  const recipe = course?.recipe
  const totalTime = (recipe?.prepTime ?? 0) + (recipe?.cookTime ?? 0)

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['70%']}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.surface }}
      handleIndicatorStyle={{ backgroundColor: c.border }}
    >
      <BottomSheetScrollView contentContainerStyle={tw`px-4 pt-2 pb-10 gap-5`}>
        {recipe && (
          <>
            <View style={tw`gap-0.5`}>
              {!!course?.course && (
                <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
                  {course.course}
                </Text>
              )}
              <Text variant="heading3" style={{ fontWeight: '700' }}>
                {recipe.name}
              </Text>
            </View>

            <View style={tw`flex-row items-center gap-3`}>
              <View style={tw`flex-row items-center gap-1`}>
                <Ionicons name="flame" size={14} color={c.textPrimary} />
                <Text variant="body" style={{ fontWeight: '700' }}>
                  {recipe.kcal}
                </Text>
                <Text variant="caption" color="muted">
                  kcal
                </Text>
              </View>
              {totalTime > 0 && (
                <View style={tw`flex-row items-center gap-1`}>
                  <Ionicons name="time-outline" size={13} color={c.textMuted} />
                  <Text variant="caption" color="muted">
                    {totalTime} min
                  </Text>
                </View>
              )}
              <View style={tw`flex-row items-center gap-1`}>
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

            {!!recipe.description && (
              <Text variant="body" color="secondary" style={{ lineHeight: 22 }}>
                {recipe.description}
              </Text>
            )}

            {recipe.ingredients.length > 0 && (
              <View style={tw`gap-2`}>
                <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
                  Ingrédients
                </Text>
                {recipe.ingredients.map((ing, i) => (
                  <View key={i} style={tw`flex-row gap-2`}>
                    <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
                      •
                    </Text>
                    <View style={tw`flex-1 flex-row flex-wrap gap-1`}>
                      <Text variant="caption" style={{ fontWeight: '500' }}>
                        {ing.food.name}
                      </Text>
                      <Text variant="caption" color="muted">
                        — {ing.quantityG} g
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {recipe.ingredients.length > 0 && !!recipe.steps?.length && (
              <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }]} />
            )}

            {!!recipe.steps?.length && (
              <View style={tw`gap-2`}>
                <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
                  Préparation
                </Text>
                {recipe.steps.map((step, i) => (
                  <View key={i} style={tw`flex-row gap-3`}>
                    <View
                      style={[
                        tw`w-7 h-7 rounded-full items-center justify-center shrink-0 mt-0.5`,
                        { backgroundColor: c.primary + '20' },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    <Text variant="body" style={{ flex: 1, lineHeight: 22 }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})

RecipeDetailSheet.displayName = 'RecipeDetailSheet'
