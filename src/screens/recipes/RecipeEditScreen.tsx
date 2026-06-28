import Ionicons from '@expo/vector-icons/Ionicons'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  KeyboardAvoidingView,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'
import { z } from 'zod'

import { useRecipes } from '@/src/apis/backendApi/hooks/recipes/useRecipes'
import { useUpdateRecipe } from '@/src/apis/backendApi/hooks/recipes/useUpdateRecipe'
import { Button } from '@/src/components/button'
import { Input } from '@/src/components/input'
import { Text } from '@/src/components/text'
import { COOKING_METHOD_ICONS, SEASON_ICONS } from '@/src/features/recipes/RecipeCard'
import { useColors } from '@/src/hooks/use-colors'
import {
  RECIPE_CATEGORIES,
  RECIPE_COOKING_METHODS,
  RECIPE_SEASONS,
  Recipe,
  RecipeCategory,
  RecipeCookingMethod,
  RecipeIngredient,
  RecipeSeason,
  computeRecipeNutrition,
} from '@/src/models/recipe/recipe.model'
import { pendingIngredientAtom } from '@/src/store/pendingIngredientAtom'

function toNum(v: string | number | undefined): number {
  if (v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? 0 : n
}

const recipeSchema = z.object({
  name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  category: z.enum([
    'Petit-déjeuner',
    'Brunch',
    'Entrée',
    'Plat principal',
    'Soupe',
    'Dessert',
    'Encas',
    'Apéritif',
    'Boulangerie',
    'Sauce & condiments',
  ] as const),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  servings: z.number().min(1).optional(),
  steps: z.array(z.object({ value: z.string() })).optional(),
  seasons: z.array(z.enum(['Printemps', 'Été', 'Automne', 'Hiver'] as const)).optional(),
  cookingMethod: z.enum(['Four', 'Poêle', 'Cookeo', 'Barbecue', 'Froid'] as const).optional(),
})

type RecipeForm = z.infer<typeof recipeSchema>

export default function RecipeEditScreen() {
  const c = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: recipes } = useRecipes()
  const { mutate: updateRecipe, isPending } = useUpdateRecipe()
  const [pendingIngredient, setPendingIngredient] = useAtom(pendingIngredientAtom)

  const recipe = recipes?.find((r) => r.id === id)

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients ?? [])
  const [ingredientError, setIngredientError] = useState<string | null>(null)
  const [stepsError, setStepsError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      category: 'Plat principal',
      servings: 1,
      steps: [{ value: '' }],
      seasons: [],
    },
  })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'steps' })

  useEffect(() => {
    if (recipe) {
      reset({
        name: recipe.name,
        category: recipe.category,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings ?? 1,
        steps: recipe.steps.length > 0 ? recipe.steps.map((s) => ({ value: s })) : [{ value: '' }],
        seasons: recipe.seasons ?? [],
        cookingMethod: recipe.cookingMethod,
      })
      setIngredients(recipe.ingredients)
    }
  }, [recipe, reset])

  useEffect(() => {
    if (pendingIngredient) {
      setIngredients((prev) => [...prev, pendingIngredient])
      setIngredientError(null)
      setPendingIngredient(null)
    }
  }, [pendingIngredient, setPendingIngredient])

  const selectedCategory = watch('category')
  const servings = watch('servings') ?? 1
  const nutrition = computeRecipeNutrition(ingredients, servings)

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave(data: RecipeForm) {
    if (!recipe) return
    if (ingredients.length === 0) {
      setIngredientError('Ajoute au moins un ingrédient.')
      return
    }
    setIngredientError(null)
    setStepsError(null)
    setApiError(null)

    const updated: Recipe = {
      ...recipe,
      name: data.name,
      category: data.category as RecipeCategory,
      ingredients,
      steps: (data.steps ?? []).map((s) => s.value).filter(Boolean),
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings ?? 1,
      seasons: data.seasons?.length ? (data.seasons as RecipeSeason[]) : undefined,
      cookingMethod: data.cookingMethod as RecipeCookingMethod | undefined,
    }
    updateRecipe(updated, {
      onSuccess: () => {
        ToastAndroid.show('Recette mise à jour !', ToastAndroid.SHORT)
        router.back()
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.data?.errors) {
          const serverErrors = error.response.data.errors as Record<string, string[]>
          let hasIngredientError = false
          let hasOtherError = false

          for (const [key, messages] of Object.entries(serverErrors)) {
            const msg = messages[0]
            if (key === 'name') {
              setError('name', { type: 'server', message: msg })
            } else if (key.startsWith('ingredients')) {
              hasIngredientError = true
            } else if (key === 'steps' || key.startsWith('steps.')) {
              setStepsError(msg)
            } else {
              hasOtherError = true
            }
          }

          if (hasIngredientError) {
            setIngredientError('Certains ingrédients ont des données invalides.')
          }
          if (hasOtherError) {
            setApiError('Une erreur est survenue. Vérifie les informations saisies.')
          }
        } else {
          setApiError('Une erreur est survenue. Réessaie.')
        }
      },
    })
  }

  if (!recipe) {
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        {/* Header */}
        <View
          style={[
            tw`flex-row items-center gap-3 px-4 py-3`,
            { borderBottomWidth: 1, borderBottomColor: c.border },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
          </TouchableOpacity>
          <Text variant="heading3" style={{ fontWeight: '700' }}>
            Modifier la recette
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={tw`p-4 gap-5 pb-10`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel label="Infos générales" />

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nom de la recette"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                autoCapitalize="sentences"
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange } }) => (
              <View style={tw`gap-2`}>
                <Text variant="caption" color="secondary">
                  Catégorie
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
                  <View style={tw`flex-row gap-2 px-1 py-1`}>
                    {RECIPE_CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => onChange(cat)}
                          style={[
                            tw`px-3 py-2 rounded-xl`,
                            { backgroundColor: isActive ? c.primary : c.surfaceElevated },
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={{
                              color: isActive ? '#FFFFFF' : c.textSecondary,
                              fontWeight: '600',
                            }}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          />

          <View style={tw`flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <Controller
                control={control}
                name="prepTime"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Prép."
                    value={value && value > 0 ? String(value) : ''}
                    onChangeText={(t) => onChange(t === '' ? undefined : toNum(t))}
                    keyboardType="numeric"
                    unit="min"
                  />
                )}
              />
            </View>
            <View style={tw`flex-1`}>
              <Controller
                control={control}
                name="cookTime"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Cuisson"
                    value={value && value > 0 ? String(value) : ''}
                    onChangeText={(t) => onChange(t === '' ? undefined : toNum(t))}
                    keyboardType="numeric"
                    unit="min"
                  />
                )}
              />
            </View>
            <View style={tw`flex-1`}>
              <Controller
                control={control}
                name="servings"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Portions"
                    value={value && value > 0 ? String(value) : ''}
                    onChangeText={(t) => onChange(t === '' ? undefined : toNum(t))}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          {/* Saisons */}
          <Controller
            control={control}
            name="seasons"
            render={({ field: { onChange, value } }) => (
              <View style={tw`gap-2`}>
                <Text variant="caption" color="secondary">
                  Saison(s)
                </Text>
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {RECIPE_SEASONS.map((season) => {
                    const isActive = value?.includes(season) ?? false
                    return (
                      <TouchableOpacity
                        key={season}
                        onPress={() => {
                          const current = value ?? []
                          onChange(
                            isActive ? current.filter((s) => s !== season) : [...current, season],
                          )
                        }}
                        style={[
                          tw`flex-row items-center gap-1.5 px-3 py-2 rounded-xl`,
                          { backgroundColor: isActive ? c.primary : c.surfaceElevated },
                        ]}
                      >
                        <Ionicons
                          name={SEASON_ICONS[season]}
                          size={14}
                          color={isActive ? '#FFFFFF' : c.textSecondary}
                        />
                        <Text
                          variant="caption"
                          style={{
                            color: isActive ? '#FFFFFF' : c.textSecondary,
                            fontWeight: '600',
                          }}
                        >
                          {season}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}
          />

          {/* Mode de cuisson */}
          <Controller
            control={control}
            name="cookingMethod"
            render={({ field: { onChange, value } }) => (
              <View style={tw`gap-2`}>
                <Text variant="caption" color="secondary">
                  Mode de cuisson
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
                  <View style={tw`flex-row gap-2 px-1 py-1`}>
                    {RECIPE_COOKING_METHODS.map((method) => {
                      const isActive = value === method
                      return (
                        <TouchableOpacity
                          key={method}
                          onPress={() => onChange(isActive ? undefined : method)}
                          style={[
                            tw`flex-row items-center gap-1.5 px-3 py-2 rounded-xl`,
                            { backgroundColor: isActive ? c.primary : c.surfaceElevated },
                          ]}
                        >
                          <Ionicons
                            name={COOKING_METHOD_ICONS[method]}
                            size={14}
                            color={isActive ? '#FFFFFF' : c.textSecondary}
                          />
                          <Text
                            variant="caption"
                            style={{
                              color: isActive ? '#FFFFFF' : c.textSecondary,
                              fontWeight: '600',
                            }}
                          >
                            {method}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          />

          {/* Ingrédients */}
          <SectionLabel label="Ingrédients" />

          {ingredients.length > 0 && (
            <View style={tw`gap-2`}>
              {ingredients.map((ing, i) => (
                <IngredientRow
                  key={i}
                  ingredient={ing}
                  onRemove={() => handleRemoveIngredient(i)}
                />
              ))}
            </View>
          )}

          {ingredientError && (
            <Text variant="caption" style={{ color: c.danger }}>
              {ingredientError}
            </Text>
          )}

          <TouchableOpacity
            onPress={() => router.push('/food-search?context=recipe')}
            style={tw`flex-row items-center gap-2 py-1`}
          >
            <Ionicons name="add-circle-outline" size={18} color={c.primary} />
            <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
              Ajouter un ingrédient
            </Text>
          </TouchableOpacity>

          {ingredients.length > 0 && <NutritionSummary nutrition={nutrition} servings={servings} />}

          {/* Étapes */}
          <SectionLabel label="Étapes de préparation" />

          <View style={tw`gap-2`}>
            {stepFields.map((field, index) => (
              <View key={field.id} style={tw`flex-row items-start gap-2`}>
                <View
                  style={[
                    tw`w-5 h-5 rounded-full items-center justify-center mt-3 shrink-0`,
                    { backgroundColor: c.primary + '20' },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{ color: c.primary, fontWeight: '700', fontSize: 10 }}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <Controller
                    control={control}
                    name={`steps.${index}.value`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value}
                        onChangeText={onChange}
                        placeholder={`Étape ${index + 1}`}
                        multiline
                      />
                    )}
                  />
                </View>
                {stepFields.length > 1 && (
                  <TouchableOpacity hitSlop={8} onPress={() => removeStep(index)} style={tw`mt-3`}>
                    <Ionicons name="close-circle-outline" size={22} color={c.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={() => appendStep({ value: '' })}
              style={tw`flex-row items-center gap-2 py-1`}
            >
              <Ionicons name="add-circle-outline" size={18} color={c.primary} />
              <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                Ajouter une étape
              </Text>
            </TouchableOpacity>

            {stepsError && (
              <Text variant="caption" style={{ color: '#ef4444' }}>
                {stepsError}
              </Text>
            )}
          </View>

          {apiError && (
            <View
              style={[
                tw`rounded-xl px-4 py-3`,
                { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444' },
              ]}
            >
              <Text variant="caption" style={{ color: '#ef4444' }}>
                {apiError}
              </Text>
            </View>
          )}

          <Button
            label={isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
            variant="primary"
            fullWidth
            disabled={isPending}
            onPress={handleSubmit(handleSave)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function formatIngredientQty(quantityG: number, displayUnit?: string): string {
  if (!displayUnit || displayUnit === 'g') return `${quantityG} g`
  const multipliers: Record<string, number> = { ml: 1, cl: 10, L: 1000 }
  const mult = multipliers[displayUnit] ?? 1
  const qty = quantityG / mult
  const rounded = Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10
  if (displayUnit === 'ml') return `${rounded} ml`
  return `${rounded} ${displayUnit} (${quantityG} g)`
}

function IngredientRow({
  ingredient,
  onRemove,
}: {
  ingredient: RecipeIngredient
  onRemove: () => void
}) {
  const c = useColors()
  const kcal = Math.round((ingredient.food.per100g.kcal * ingredient.quantityG) / 100)
  const qtyLabel = formatIngredientQty(ingredient.quantityG, ingredient.displayUnit)

  return (
    <View
      style={[
        tw`flex-row items-center gap-3 rounded-xl p-3`,
        { backgroundColor: c.surfaceElevated },
      ]}
    >
      <View
        style={[
          tw`w-8 h-8 rounded-full items-center justify-center shrink-0`,
          { backgroundColor: c.primary + '20' },
        ]}
      >
        <Ionicons name="nutrition-outline" size={16} color={c.primary} />
      </View>
      <View style={tw`flex-1`}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {ingredient.unitCount != null ? `${ingredient.unitCount} × ` : ''}
          {ingredient.food.name}
        </Text>
        <Text variant="caption" color="secondary">
          {ingredient.unitCount != null
            ? `${ingredient.unitWeightG} g/u · ${ingredient.quantityG} g · ${kcal} kcal`
            : `${qtyLabel} · ${kcal} kcal`}
        </Text>
      </View>
      <TouchableOpacity hitSlop={8} onPress={onRemove}>
        <Ionicons name="close-circle-outline" size={22} color={c.textMuted} />
      </TouchableOpacity>
    </View>
  )
}

function NutritionSummary({
  nutrition,
  servings,
}: {
  nutrition: ReturnType<typeof computeRecipeNutrition>
  servings: number
}) {
  const c = useColors()
  return (
    <View
      style={[
        tw`rounded-xl p-3 gap-1`,
        { backgroundColor: c.primary + '12', borderWidth: 1, borderColor: c.primary + '30' },
      ]}
    >
      <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
        {servings > 1 ? `Par portion (${servings} portions)` : 'Total'}
      </Text>
      <View style={tw`flex-row items-center justify-between`}>
        <Text variant="body" style={{ fontWeight: '700', color: c.primary }}>
          {nutrition.kcal} kcal
        </Text>
        <Text variant="caption" color="secondary">
          P {nutrition.proteines}g · G {nutrition.glucides}g · L {nutrition.lipides}g
        </Text>
      </View>
    </View>
  )
}

function SectionLabel({ label }: { label: string }) {
  const c = useColors()
  return (
    <View style={[tw`pb-1`, { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  )
}
