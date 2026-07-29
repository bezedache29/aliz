import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback } from 'react'
import { TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { MealType } from '@/src/models/planning/planning.model'

type Props = {
  mealType: MealType | null
  onSelectFood: () => void
  onSelectRecipe: () => void
  onSelectAiRecipe: () => void
}

export const MealAddPickerSheet = forwardRef<BottomSheetModal, Props>(
  ({ mealType, onSelectFood, onSelectRecipe, onSelectAiRecipe }, ref) => {
    const c = useColors()

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    )

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['42%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-3`}>
          <Text variant="heading3" style={{ fontWeight: '700', marginBottom: 4 }}>
            Ajouter à{mealType ? ` — ${mealType}` : ''}
          </Text>

          <TouchableOpacity
            testID="add-food-option"
            activeOpacity={0.8}
            onPress={onSelectFood}
            style={[
              tw`flex-row items-center gap-4 p-4 rounded-2xl`,
              { backgroundColor: c.surfaceElevated },
            ]}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: c.primary + '25' },
              ]}
            >
              <Ionicons name="nutrition-outline" size={20} color={c.primary} />
            </View>
            <View style={tw`flex-1`}>
              <Text variant="body" style={{ fontWeight: '600' }}>
                Aliment unique
              </Text>
              <Text variant="caption" color="secondary">
                Rechercher un aliment
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="add-recipe-option"
            activeOpacity={0.8}
            onPress={onSelectRecipe}
            style={[
              tw`flex-row items-center gap-4 p-4 rounded-2xl`,
              { backgroundColor: c.surfaceElevated },
            ]}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: c.tertiary + '25' },
              ]}
            >
              <Ionicons name="book-outline" size={20} color={c.tertiary} />
            </View>
            <View style={tw`flex-1`}>
              <Text variant="body" style={{ fontWeight: '600' }}>
                Recette
              </Text>
              <Text variant="caption" color="secondary">
                Choisir parmi mes recettes
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="add-ai-recipe-option"
            activeOpacity={0.8}
            onPress={onSelectAiRecipe}
            style={[
              tw`flex-row items-center gap-4 p-4 rounded-2xl`,
              { backgroundColor: c.surfaceElevated },
            ]}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: c.warning + '25' },
              ]}
            >
              <Ionicons name="sparkles-outline" size={20} color={c.warning} />
            </View>
            <View style={tw`flex-1`}>
              <Text variant="body" style={{ fontWeight: '600' }}>
                Recette générée par IA
              </Text>
              <Text variant="caption" color="secondary">
                Prompt libre + stock en option
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

MealAddPickerSheet.displayName = 'MealAddPickerSheet'
