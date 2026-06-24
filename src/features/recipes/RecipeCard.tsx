import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Button } from '@/src/components/button'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { MealType } from '@/src/models/planning/planning.model'
import {
  Recipe,
  RecipeCategory,
  RecipeCookingMethod,
  RecipeIngredient,
  RecipeSeason,
  computeRecipeNutrition,
} from '@/src/models/recipe/recipe.model'

export const CATEGORY_COLORS: Record<RecipeCategory, (c: ReturnType<typeof useColors>) => string> =
  {
    'Petit-déjeuner': (c) => c.warning,
    Brunch: (c) => c.warning,
    Entrée: (c) => c.primary,
    'Plat principal': (c) => c.info,
    Soupe: (c) => c.info,
    Dessert: (c) => c.tertiary,
    Encas: (c) => c.warning,
    Apéritif: (c) => c.tertiary,
    Boulangerie: (c) => c.warning,
    'Sauce & condiments': (c) => c.info,
  }

export const SEASON_ICONS: Record<RecipeSeason, React.ComponentProps<typeof Ionicons>['name']> = {
  Printemps: 'leaf-outline',
  Été: 'sunny-outline',
  Automne: 'partly-sunny-outline',
  Hiver: 'snow-outline',
}

export const COOKING_METHOD_ICONS: Record<
  RecipeCookingMethod,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  Four: 'thermometer-outline',
  Poêle: 'restaurant-outline',
  Cookeo: 'flash-outline',
  Barbecue: 'flame-outline',
  Froid: 'snow',
}

export const CATEGORY_ICONS: Record<RecipeCategory, React.ComponentProps<typeof Ionicons>['name']> =
  {
    'Petit-déjeuner': 'sunny-outline',
    Brunch: 'cafe-outline',
    Entrée: 'leaf-outline',
    'Plat principal': 'restaurant-outline',
    Soupe: 'water-outline',
    Dessert: 'ice-cream-outline',
    Encas: 'nutrition-outline',
    Apéritif: 'wine-outline',
    Boulangerie: 'triangle-outline',
    'Sauce & condiments': 'flask-outline',
  }

type Props = {
  recipe: Recipe
  mealType?: MealType
  onAdd?: (recipe: Recipe) => void
  onToggleFavorite?: (id: string) => void
}

export function RecipeCard({ recipe, mealType, onAdd, onToggleFavorite }: Props) {
  const c = useColors()
  const [expanded, setExpanded] = useState(false)

  const categoryColor = CATEGORY_COLORS[recipe.category](c)
  const categoryIcon = CATEGORY_ICONS[recipe.category]
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)
  const nutrition = computeRecipeNutrition(recipe.ingredients, recipe.servings)

  return (
    <View
      style={[
        tw`rounded-2xl overflow-hidden mb-3`,
        {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: expanded ? categoryColor : c.border,
        },
      ]}
    >
      {/* En-tête — toujours visible */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded((v) => !v)} style={tw`p-4`}>
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
            {/* Nom + actions */}
            <View style={tw`flex-row items-center justify-between`}>
              <Text variant="body" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {recipe.name}
              </Text>
              <View style={tw`flex-row items-center gap-2 ml-2`}>
                {onToggleFavorite && (
                  <TouchableOpacity hitSlop={8} onPress={() => onToggleFavorite(recipe.id)}>
                    <Ionicons
                      name={recipe.isFavorite ? 'heart' : 'heart-outline'}
                      size={18}
                      color={recipe.isFavorite ? c.primary : c.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Kcal bien visible + temps + portions */}
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

            {/* Macros sobres */}
            <View style={tw`flex-row items-center gap-3`}>
              <MacroInline label="P" value={nutrition.proteines} color={c.tertiary} />
              <MacroInline label="G" value={nutrition.glucides} color={c.warning} />
              <MacroInline label="L" value={nutrition.lipides} color={c.info} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Détail — visible si expanded */}
      {expanded && (
        <View>
          <View style={[tw`h-px mx-4`, { backgroundColor: c.border }]} />

          <View style={tw`p-4 gap-4`}>
            {/* Saison + cuisson */}
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

            {/* Ingrédients */}
            {recipe.ingredients.length > 0 && (
              <View style={tw`gap-2`}>
                <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
                  Ingrédients
                </Text>
                {recipe.ingredients
                  .filter((ing) => ing.food?.per100g)
                  .map((ing, i) => (
                    <IngredientDetailRow key={i} ingredient={ing} categoryColor={categoryColor} />
                  ))}
              </View>
            )}

            {recipe.ingredients.length > 0 && recipe.steps.length > 0 && (
              <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }]} />
            )}

            {/* Étapes */}
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

            {mealType && onAdd && (
              <Button
                label={`Ajouter à ${mealType}`}
                variant="primary"
                onPress={() => onAdd(recipe)}
                fullWidth
              />
            )}
          </View>
        </View>
      )}
    </View>
  )
}

function IngredientDetailRow({
  ingredient,
  categoryColor,
}: {
  ingredient: RecipeIngredient
  categoryColor: string
}) {
  const c = useColors()
  const kcal = Math.round((ingredient.food.per100g.kcal * ingredient.quantityG) / 100)
  const proteines =
    Math.round(((ingredient.food.per100g.proteines * ingredient.quantityG) / 100) * 10) / 10
  const glucides =
    Math.round(((ingredient.food.per100g.glucides * ingredient.quantityG) / 100) * 10) / 10
  const lipides =
    Math.round(((ingredient.food.per100g.lipides * ingredient.quantityG) / 100) * 10) / 10

  return (
    <View style={tw`gap-1`}>
      <View style={tw`flex-row items-center justify-between gap-2`}>
        <View style={tw`flex-row gap-2 flex-1`}>
          <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
            •
          </Text>
          <Text variant="caption" style={{ flex: 1, fontWeight: '500' }}>
            {ingredient.food.name}
            <Text variant="caption" color="muted">
              {' '}
              — {ingredient.quantityG} g
            </Text>
          </Text>
        </View>
        <Text variant="caption" style={{ color: categoryColor, fontWeight: '600' }}>
          {kcal} kcal
        </Text>
      </View>
      <View style={tw`flex-row gap-3 pl-4`}>
        <MacroInline label="P" value={proteines} color={c.tertiary} />
        <MacroInline label="G" value={glucides} color={c.warning} />
        <MacroInline label="L" value={lipides} color={c.info} />
      </View>
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
