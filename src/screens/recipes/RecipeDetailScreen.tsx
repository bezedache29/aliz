import Ionicons from '@expo/vector-icons/Ionicons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useRecipes } from '@/src/apis/backendApi/hooks/recipes/useRecipes'
import { Button } from '@/src/components/button'
import { ScreenHeader } from '@/src/components/screen-header'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COOKING_METHOD_ICONS,
  SEASON_ICONS,
} from '@/src/features/recipes/RecipeCard'
import { useColors } from '@/src/hooks/use-colors'
import { computeRecipeNutrition, type Recipe } from '@/src/models/recipe/recipe.model'

export default function RecipeDetailScreen() {
  const c = useColors()
  const router = useRouter()
  const { ids, courses: coursesParam } = useLocalSearchParams<{ ids: string; courses?: string }>()
  const { data: recipes } = useRecipes()

  const idList = ids ? ids.split(',') : []
  const courseList = coursesParam ? coursesParam.split(',') : []

  const entries = idList
    .map((recipeId, index) => ({
      course: courseList[index] ?? '',
      recipe: recipes?.find((r) => r.id === recipeId),
    }))
    .filter((entry): entry is { course: string; recipe: Recipe } => !!entry.recipe)

  if (entries.length === 0) {
    return (
      <SafeAreaView
        style={[tw`flex-1 items-center justify-center`, { backgroundColor: c.background }]}
      >
        <Text variant="body" color="secondary">
          Recette introuvable.
        </Text>
      </SafeAreaView>
    )
  }

  const isMenu = entries.length > 1

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScreenHeader
        title={isMenu ? 'Menu' : entries[0].recipe.name}
        subtitle={isMenu ? `${entries.length} plats` : entries[0].recipe.category}
      />

      <ScrollView contentContainerStyle={tw`p-4 gap-6 pb-10`}>
        {entries.map(({ course, recipe }, index) => (
          <View key={recipe.id} style={tw`gap-5`}>
            {isMenu && (
              <View style={tw`gap-0.5`}>
                <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
                  {course || recipe.category}
                </Text>
                <Text variant="heading3" style={{ fontWeight: '700' }}>
                  {recipe.name}
                </Text>
              </View>
            )}

            <RecipeSection
              recipe={recipe}
              onEdit={() => router.push(`/recipe-edit?id=${recipe.id}`)}
            />

            {index < entries.length - 1 && (
              <View style={[tw`h-px mt-1`, { backgroundColor: c.border }]} />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function RecipeSection({ recipe, onEdit }: { recipe: Recipe; onEdit: () => void }) {
  const c = useColors()
  const categoryColor = CATEGORY_COLORS[recipe.category](c)
  const categoryIcon = CATEGORY_ICONS[recipe.category]
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)
  const nutrition = computeRecipeNutrition(recipe.ingredients, recipe.servings)

  return (
    <View style={tw`gap-5`}>
      <View style={tw`flex-row items-center gap-3`}>
        <View
          style={[
            tw`w-11 h-11 rounded-full items-center justify-center shrink-0`,
            { backgroundColor: categoryColor + '20' },
          ]}
        >
          <Ionicons name={categoryIcon} size={20} color={categoryColor} />
        </View>
        <View style={tw`flex-1 gap-1.5`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View style={tw`flex-row items-center gap-1`}>
              <Ionicons name="flame" size={14} color={c.textPrimary} />
              <Text variant="body" style={{ fontWeight: '700', color: c.textPrimary }}>
                {nutrition.kcal}
              </Text>
              <Text variant="caption" color="muted">
                kcal{recipe.servings && recipe.servings > 1 ? '/pers.' : ''}
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
            {recipe.servings && recipe.servings > 1 && (
              <View style={tw`flex-row items-center gap-1`}>
                <Ionicons name="people-outline" size={13} color={c.textMuted} />
                <Text variant="caption" color="muted">
                  {recipe.servings} pers.
                </Text>
              </View>
            )}
          </View>
          <View style={tw`flex-row items-center gap-3`}>
            <MacroInline label="P" value={nutrition.proteines} color={c.tertiary} />
            <MacroInline label="G" value={nutrition.glucides} color={c.warning} />
            <MacroInline label="L" value={nutrition.lipides} color={c.info} />
          </View>
        </View>
      </View>

      {(!!recipe.seasons?.length || !!recipe.cookingMethod) && (
        <View style={tw`flex-row flex-wrap gap-2`}>
          {recipe.seasons?.map((season) => (
            <View
              key={season}
              style={[
                tw`flex-row items-center gap-1 px-2 py-1 rounded-full`,
                { backgroundColor: c.surfaceElevated },
              ]}
            >
              <Ionicons name={SEASON_ICONS[season]} size={12} color={c.textSecondary} />
              <Text variant="caption" color="secondary">
                {season}
              </Text>
            </View>
          ))}
          {recipe.cookingMethod && (
            <View
              style={[
                tw`flex-row items-center gap-1 px-2 py-1 rounded-full`,
                { backgroundColor: c.surfaceElevated },
              ]}
            >
              <Ionicons
                name={COOKING_METHOD_ICONS[recipe.cookingMethod]}
                size={12}
                color={c.textSecondary}
              />
              <Text variant="caption" color="secondary">
                {recipe.cookingMethod}
              </Text>
            </View>
          )}
        </View>
      )}

      {recipe.ingredients.length > 0 && (
        <View style={tw`gap-2`}>
          <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
            Ingrédients
          </Text>
          {recipe.ingredients
            .filter((ing) => ing.food?.per100g)
            .map((ing, i) => (
              <View key={i} style={tw`flex-row items-center justify-between gap-2`}>
                <View style={tw`flex-row gap-2 flex-1`}>
                  <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
                    •
                  </Text>
                  <Text variant="caption" style={{ flex: 1, fontWeight: '500' }}>
                    {ing.food.name}
                    <Text variant="caption" color="muted">
                      {' '}
                      — {ing.quantityG} g
                    </Text>
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {recipe.ingredients.length > 0 && recipe.steps.length > 0 && (
        <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }]} />
      )}

      {recipe.steps.length > 0 && (
        <View style={tw`gap-2`}>
          <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
            Préparation
          </Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={tw`flex-row gap-3`}>
              <View
                style={[
                  tw`w-7 h-7 rounded-full items-center justify-center shrink-0 mt-0.5`,
                  { backgroundColor: categoryColor + '25' },
                ]}
              >
                <Text
                  variant="caption"
                  style={{ color: categoryColor, fontWeight: '700', fontSize: 13 }}
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

      <Button label="Modifier la recette" variant="secondary" onPress={onEdit} />
    </View>
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
