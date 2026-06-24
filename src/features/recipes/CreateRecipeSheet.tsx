import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { forwardRef, useCallback } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { TouchableOpacity, View } from 'react-native'

import { ScrollView } from '@/src/components/scroll-view'
import tw from 'twrnc'
import { z } from 'zod'

import { Button } from '@/src/components/button'
import { Input } from '@/src/components/input'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { RECIPE_CATEGORIES, RecipeCategory } from '@/src/models/recipe/recipe.model'

export { RECIPE_CATEGORIES }

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
  kcal: z.number().min(0, 'Requis'),
  proteines: z.number().min(0, 'Requis'),
  glucides: z.number().min(0, 'Requis'),
  lipides: z.number().min(0, 'Requis'),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  servings: z.number().optional(),
  ingredients: z.array(z.object({ value: z.string() })),
  steps: z.array(z.object({ value: z.string() })),
})

type RecipeForm = z.infer<typeof recipeSchema>

export type CreateRecipeData = {
  name: string
  category: RecipeCategory
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  prepTime?: number
  cookTime?: number
  servings?: number
  ingredients: string[]
  steps: string[]
}

type Props = {
  onSave: (data: CreateRecipeData) => void
}

export const CreateRecipeSheet = forwardRef<BottomSheetModal, Props>(({ onSave }, ref) => {
  const c = useColors()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      category: 'Plat principal',
      kcal: 0,
      proteines: 0,
      glucides: 0,
      lipides: 0,
      prepTime: undefined,
      cookTime: undefined,
      servings: undefined,
      ingredients: [{ value: '' }],
      steps: [{ value: '' }],
    },
  })

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: 'ingredients' })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'steps' })

  const selectedCategory = watch('category')

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function handleSave(data: RecipeForm) {
    onSave({
      name: data.name,
      category: data.category,
      kcal: data.kcal,
      proteines: data.proteines,
      glucides: data.glucides,
      lipides: data.lipides,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      ingredients: data.ingredients.map((i) => i.value).filter(Boolean),
      steps: data.steps.map((s) => s.value).filter(Boolean),
    })
    reset()
    ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['90%']}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.surface }}
      handleIndicatorStyle={{ backgroundColor: c.border }}
      keyboardBehavior="extend"
    >
      <BottomSheetScrollView contentContainerStyle={tw`px-4 pt-2 pb-12 gap-5`}>
        <Text variant="heading3" style={{ fontWeight: '700' }}>
          Nouvelle recette
        </Text>

        {/* Infos générales */}
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

        {/* Macros */}
        <SectionLabel label="Valeurs nutritionnelles (par portion)" />

        <Controller
          control={control}
          name="kcal"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Calories"
              value={value > 0 ? String(value) : ''}
              onChangeText={(t) => onChange(toNum(t))}
              keyboardType="numeric"
              unit="kcal"
              error={errors.kcal?.message}
            />
          )}
        />

        <View style={tw`flex-row gap-3`}>
          <View style={tw`flex-1`}>
            <Controller
              control={control}
              name="proteines"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Protéines"
                  value={value > 0 ? String(value) : ''}
                  onChangeText={(t) => onChange(toNum(t))}
                  keyboardType="numeric"
                  unit="g"
                  error={errors.proteines?.message}
                />
              )}
            />
          </View>
          <View style={tw`flex-1`}>
            <Controller
              control={control}
              name="glucides"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Glucides"
                  value={value > 0 ? String(value) : ''}
                  onChangeText={(t) => onChange(toNum(t))}
                  keyboardType="numeric"
                  unit="g"
                  error={errors.glucides?.message}
                />
              )}
            />
          </View>
          <View style={tw`flex-1`}>
            <Controller
              control={control}
              name="lipides"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Lipides"
                  value={value > 0 ? String(value) : ''}
                  onChangeText={(t) => onChange(toNum(t))}
                  keyboardType="numeric"
                  unit="g"
                  error={errors.lipides?.message}
                />
              )}
            />
          </View>
        </View>

        {/* Préparation */}
        <SectionLabel label="Préparation" />

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

        {/* Ingrédients */}
        <SectionLabel label="Ingrédients" />

        <View style={tw`gap-2`}>
          {ingredientFields.map((field, index) => (
            <View key={field.id} style={tw`flex-row items-center gap-2`}>
              <Text variant="caption" color="muted" style={tw`w-4 text-center`}>
                •
              </Text>
              <View style={tw`flex-1`}>
                <Controller
                  control={control}
                  name={`ingredients.${index}.value`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder={`Ingrédient ${index + 1}`}
                    />
                  )}
                />
              </View>
              {ingredientFields.length > 1 && (
                <TouchableOpacity hitSlop={8} onPress={() => removeIngredient(index)}>
                  <Ionicons name="close-circle-outline" size={22} color={c.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => appendIngredient({ value: '' })}
            style={tw`flex-row items-center gap-2 py-1`}
          >
            <Ionicons name="add-circle-outline" size={18} color={c.primary} />
            <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
              Ajouter un ingrédient
            </Text>
          </TouchableOpacity>
        </View>

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
        </View>

        <Button
          label="Enregistrer la recette"
          variant="primary"
          fullWidth
          onPress={handleSubmit(handleSave)}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})

CreateRecipeSheet.displayName = 'CreateRecipeSheet'

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
