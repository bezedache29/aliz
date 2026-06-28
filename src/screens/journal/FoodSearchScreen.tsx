import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'
import { z } from 'zod'

import { isCiqualLoaded } from '@/src/apis/ciqualApi/client'
import { useCiqualSearch } from '@/src/apis/ciqualApi/hooks/food/useCiqualSearch'
import { useFoodByBarcode } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodByBarcode'
import { useFoodSearch } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodSearch'
import { Button } from '@/src/components/button'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import { FoodProduct } from '@/src/models/food/food.model'
import { MealType, PlannedMeal } from '@/src/models/planning/planning.model'
import { addCustomFood, customFoodsAtom, searchCustomFoods } from '@/src/store/customFoodsAtom'
import { pendingIngredientAtom } from '@/src/store/pendingIngredientAtom'
import { weekPlanAtom } from '@/src/store/planningAtom'
import { addToRecent, recentFoodsAtom } from '@/src/store/recentFoodsAtom'

type SearchMode = 'favorites' | 'barcode' | 'apis'
type FoodSource = 'openfoodfacts' | 'ciqual'

const manualFoodSchema = z.object({
  name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  brand: z.string().optional(),
  kcal: z.coerce.number().min(0, 'Requis'),
  proteines: z.coerce.number().min(0, 'Requis'),
  glucides: z.coerce.number().min(0, 'Requis'),
  lipides: z.coerce.number().min(0, 'Requis'),
  quantite: z.coerce.number().min(1, 'Requis'),
})
type ManualFoodForm = z.infer<typeof manualFoodSchema>
type ManualFoodInput = Omit<
  ManualFoodForm,
  'kcal' | 'proteines' | 'glucides' | 'lipides' | 'quantite'
> & {
  kcal: unknown
  proteines: unknown
  glucides: unknown
  lipides: unknown
  quantite: unknown
}

const MODES: {
  key: SearchMode
  label: string
  icon: React.ComponentProps<typeof Ionicons>['name']
}[] = [
  { key: 'favorites', label: 'Récents', icon: 'star-outline' },
  { key: 'barcode', label: 'Scan', icon: 'barcode-outline' },
  { key: 'apis', label: 'Recherche', icon: 'search-outline' },
]

const SOURCES: {
  key: FoodSource
  label: string
  shortLabel: string
  description: string
  icon: React.ComponentProps<typeof Ionicons>['name']
}[] = [
  {
    key: 'openfoodfacts',
    label: 'OpenFoodFacts',
    shortLabel: 'OFF',
    description: 'Produits alimentaires du monde entier',
    icon: 'globe-outline',
  },
  {
    key: 'ciqual',
    label: 'CIQUAL',
    shortLabel: 'CIQUAL',
    description: 'Table de composition ANSES (3 484 aliments)',
    icon: 'flask-outline',
  },
]

function isValidFood(f: FoodProduct): boolean {
  return f.id != null && typeof f.per100g?.kcal === 'number'
}

function calcMacros(food: FoodProduct, grams: number) {
  const per100g = food.per100g
  if (!per100g) return { kcal: 0, proteines: 0, glucides: 0, lipides: 0 }
  const f = grams / 100
  return {
    kcal: Math.round(per100g.kcal * f),
    proteines: Math.round(per100g.proteines * f * 10) / 10,
    glucides: Math.round(per100g.glucides * f * 10) / 10,
    lipides: Math.round(per100g.lipides * f * 10) / 10,
  }
}

type VolumeUnit = 'g' | 'ml' | 'cl' | 'L'
type FoodUnit = VolumeUnit | 'u'

const UNIT_TO_GRAMS: Record<VolumeUnit, number> = { g: 1, ml: 1, cl: 10, L: 1000 }

function toGrams(valueStr: string, unit: VolumeUnit): string {
  const val = parseFloat(valueStr.replace(',', '.'))
  if (isNaN(val)) return '0'
  return String(Math.round(val * UNIT_TO_GRAMS[unit]))
}

function FoodItem({
  item,
  isSelected,
  quantityStr,
  preview,
  onPress,
  onChangeQuantity,
  onAdd,
  c,
}: {
  item: FoodProduct
  isSelected: boolean
  quantityStr: string
  preview: ReturnType<typeof calcMacros> | null
  onPress: () => void
  onChangeQuantity: (v: string) => void
  onAdd: (unitInfo?: { count: number; weightG: number }, displayUnit?: string) => void
  c: ReturnType<typeof import('@/src/hooks/use-colors').useColors>
}) {
  const [selectedUnit, setSelectedUnit] = useState<FoodUnit>('g')
  const [localQty, setLocalQty] = useState('100')
  const [unitCount, setUnitCount] = useState('1')
  const [unitWeight, setUnitWeight] = useState('100')

  useEffect(() => {
    if (!isSelected) {
      setSelectedUnit('g')
      setLocalQty('100')
      setUnitCount('1')
      setUnitWeight('100')
    }
  }, [isSelected])

  function handleUnitSelect(u: FoodUnit) {
    setSelectedUnit(u)
    if (u === 'u') {
      const weight = parseFloat(toGrams(localQty, selectedUnit !== 'u' ? selectedUnit : 'g')) || 100
      setUnitWeight(String(weight))
      setUnitCount('1')
      onChangeQuantity(String(Math.round(weight)))
    } else {
      onChangeQuantity(toGrams(localQty, u))
    }
  }

  function handleLocalQtyChange(v: string) {
    setLocalQty(v)
    onChangeQuantity(toGrams(v, selectedUnit !== 'u' ? selectedUnit : 'g'))
  }

  function handleUnitCountChange(v: string) {
    setUnitCount(v)
    const count = parseFloat(v.replace(',', '.')) || 0
    const weight = parseFloat(unitWeight.replace(',', '.')) || 0
    onChangeQuantity(String(Math.round(count * weight)))
  }

  function handleUnitWeightChange(v: string) {
    setUnitWeight(v)
    const count = parseFloat(unitCount.replace(',', '.')) || 0
    const weight = parseFloat(v.replace(',', '.')) || 0
    onChangeQuantity(String(Math.round(count * weight)))
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[tw`rounded-xl p-3 mb-1`, isSelected && { backgroundColor: c.surfaceElevated }]}
    >
      <View style={tw`flex-row items-center gap-3`}>
        <View
          style={[
            tw`w-9 h-9 rounded-full items-center justify-center shrink-0`,
            { backgroundColor: isSelected ? c.primary + '20' : c.surfaceElevated },
          ]}
        >
          <Ionicons
            name="nutrition-outline"
            size={18}
            color={isSelected ? c.primary : c.textSecondary}
          />
        </View>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center gap-2 flex-wrap`}>
            <Text
              variant="body"
              style={{ fontWeight: isSelected ? '700' : '500' }}
              numberOfLines={isSelected ? undefined : 1}
            >
              {item.name}
            </Text>
            {item.source === 'manual' && (
              <View style={[tw`px-1.5 py-0.5 rounded`, { backgroundColor: c.primary + '20' }]}>
                <Text variant="label" style={{ color: c.primary, fontSize: 10 }}>
                  Perso
                </Text>
              </View>
            )}
          </View>
          <Text variant="caption" color="secondary" numberOfLines={isSelected ? undefined : 1}>
            {[item.brand, item.per100g ? `${item.per100g.kcal} kcal/100g` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <Ionicons name={isSelected ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
      </View>

      {isSelected && (
        <View style={tw`mt-3 gap-3`}>
          {/* Sélecteur d'unité unifié */}
          <View style={tw`flex-row gap-1 flex-wrap`}>
            {(['g', 'ml', 'cl', 'L', 'u'] as FoodUnit[]).map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => handleUnitSelect(u)}
                style={[
                  tw`px-3 py-1.5 rounded-lg`,
                  {
                    backgroundColor: selectedUnit === u ? c.primary : c.surface,
                    borderWidth: 1,
                    borderColor: selectedUnit === u ? c.primary : c.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: selectedUnit === u ? '#fff' : c.textSecondary,
                    fontWeight: '600',
                  }}
                >
                  {u === 'u' ? 'unité' : u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedUnit !== 'u' ? (
            <View style={tw`flex-row items-center gap-3`}>
              <View style={tw`flex-1`}>
                <View
                  style={[
                    tw`flex-row items-center rounded-xl px-4`,
                    {
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      height: 44,
                    },
                  ]}
                >
                  <TextInput
                    value={localQty}
                    onChangeText={handleLocalQtyChange}
                    keyboardType="numeric"
                    selectTextOnFocus
                    style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                  />
                  <Text variant="body" color="muted">
                    {selectedUnit}
                  </Text>
                </View>
              </View>
              {preview && (
                <View
                  style={[
                    tw`flex-1 rounded-xl p-3`,
                    { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
                  ]}
                >
                  <Text variant="body" style={{ fontWeight: '700', color: c.primary }}>
                    {preview.kcal} kcal
                  </Text>
                  <Text variant="caption" color="secondary">
                    P {preview.proteines}g · G {preview.glucides}g · L {preview.lipides}g
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={tw`gap-2`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View
                  style={[
                    tw`flex-1 flex-row items-center rounded-xl px-4`,
                    {
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      height: 44,
                    },
                  ]}
                >
                  <TextInput
                    value={unitCount}
                    onChangeText={handleUnitCountChange}
                    keyboardType="numeric"
                    selectTextOnFocus
                    style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                  />
                  <Text variant="body" color="muted">
                    unité(s)
                  </Text>
                </View>
                <Text variant="body" color="muted">
                  ×
                </Text>
                <View
                  style={[
                    tw`flex-1 flex-row items-center rounded-xl px-4`,
                    {
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                      height: 44,
                    },
                  ]}
                >
                  <TextInput
                    value={unitWeight}
                    onChangeText={handleUnitWeightChange}
                    keyboardType="numeric"
                    selectTextOnFocus
                    style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                  />
                  <Text variant="body" color="muted">
                    g/unité
                  </Text>
                </View>
              </View>
              {preview && (
                <View
                  style={[
                    tw`flex-row items-center justify-between rounded-xl px-4 py-3`,
                    { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
                  ]}
                >
                  <Text variant="caption" color="secondary">
                    = {quantityStr} g au total
                  </Text>
                  <Text variant="body" style={{ fontWeight: '700', color: c.primary }}>
                    {preview.kcal} kcal · P {preview.proteines}g · G {preview.glucides}g · L{' '}
                    {preview.lipides}g
                  </Text>
                </View>
              )}
            </View>
          )}

          <Button
            label="Ajouter"
            fullWidth
            onPress={() =>
              onAdd(
                selectedUnit === 'u'
                  ? {
                      count: parseFloat(unitCount.replace(',', '.')) || 1,
                      weightG: parseFloat(unitWeight.replace(',', '.')) || 100,
                    }
                  : undefined,
                selectedUnit !== 'g' && selectedUnit !== 'u' ? selectedUnit : undefined,
              )
            }
          />
        </View>
      )}
    </TouchableOpacity>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  c,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  description?: string
  action?: { label: string; onPress: () => void }
  secondaryAction?: { label: string; onPress: () => void }
  c: ReturnType<typeof useColors>
}) {
  return (
    <View style={tw`px-4 pt-6 gap-3 items-center`}>
      <View
        style={[
          tw`w-11 h-11 rounded-2xl items-center justify-center`,
          { backgroundColor: c.surfaceElevated },
        ]}
      >
        <Ionicons name={icon} size={20} color={c.textMuted} />
      </View>
      <View style={tw`gap-1 items-center`}>
        <Text variant="body" style={{ fontWeight: '700' }}>
          {title}
        </Text>
        {description ? (
          <Text variant="caption" color="secondary" style={tw`text-center`}>
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <View style={tw`self-stretch`}>
          <Button label={action.label} onPress={action.onPress} fullWidth />
        </View>
      ) : null}
      {secondaryAction ? (
        <TouchableOpacity onPress={secondaryAction.onPress} hitSlop={8}>
          <Text variant="caption" color="muted" style={{ textDecorationLine: 'underline' }}>
            {secondaryAction.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={tw`items-center flex-1`}>
      <Text style={{ fontWeight: '700', fontSize: 17, color }}>{value}g</Text>
      <Text variant="caption" style={{ color, opacity: 0.75 }}>
        {label}
      </Text>
    </View>
  )
}

function BarcodeFoodCard({
  food,
  quantityStr,
  onChangeQuantity,
  onAdd,
  c,
}: {
  food: FoodProduct
  quantityStr: string
  onChangeQuantity: (v: string) => void
  onAdd: () => void
  c: ReturnType<typeof useColors>
}) {
  const grams = parseFloat(quantityStr.replace(',', '.')) || 0
  const preview = grams > 0 ? calcMacros(food, grams) : null

  return (
    <View
      style={[
        tw`rounded-2xl overflow-hidden`,
        { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
      ]}
    >
      {/* Header produit */}
      <View
        style={[
          tw`flex-row items-center gap-3 p-4`,
          { borderBottomWidth: 1, borderBottomColor: c.border },
        ]}
      >
        <View
          style={[
            tw`w-12 h-12 rounded-2xl items-center justify-center shrink-0`,
            { backgroundColor: c.primary + '20' },
          ]}
        >
          <Ionicons name="nutrition-outline" size={24} color={c.primary} />
        </View>
        <View style={tw`flex-1`}>
          <Text variant="body" style={{ fontWeight: '700' }} numberOfLines={2}>
            {food.name}
          </Text>
          <View style={tw`flex-row items-center flex-wrap gap-1 mt-0.5`}>
            {food.brand && (
              <>
                <Text variant="caption" color="secondary">
                  {food.brand}
                </Text>
                <Text variant="caption" color="muted">
                  ·
                </Text>
              </>
            )}
            <Text variant="caption" color="muted">
              OpenFoodFacts
            </Text>
          </View>
        </View>
      </View>

      {/* Valeurs pour 100g */}
      <View style={tw`p-4 gap-3`}>
        <Text variant="label" color="muted" uppercase>
          Valeurs pour 100g
        </Text>
        <View style={tw`flex-row gap-3`}>
          <View
            style={[
              tw`rounded-2xl p-3 items-center justify-center`,
              { backgroundColor: c.primary + '15', minWidth: 88 },
            ]}
          >
            <Text style={{ fontSize: 32, fontWeight: '800', color: c.primary, lineHeight: 36 }}>
              {food.per100g?.kcal ?? 0}
            </Text>
            <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
              kcal
            </Text>
          </View>
          <View style={[tw`flex-1 justify-center gap-2`]}>
            {(
              [
                {
                  label: 'Protéines',
                  value: Math.round((food.per100g?.proteines ?? 0) * 10) / 10,
                  color: c.info,
                },
                {
                  label: 'Glucides',
                  value: Math.round((food.per100g?.glucides ?? 0) * 10) / 10,
                  color: c.warning,
                },
                {
                  label: 'Lipides',
                  value: Math.round((food.per100g?.lipides ?? 0) * 10) / 10,
                  color: c.tertiary,
                },
              ] as const
            ).map(({ label, value, color }) => (
              <View key={label} style={tw`flex-row items-center gap-2`}>
                <View style={[tw`w-2 h-2 rounded-full shrink-0`, { backgroundColor: color }]} />
                <Text variant="caption" color="secondary" style={tw`flex-1`}>
                  {label}
                </Text>
                <Text variant="caption" style={{ fontWeight: '700', color: c.textPrimary }}>
                  {value}g
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quantité + preview */}
      <View style={[tw`px-4 pb-4 gap-3`, { borderTopWidth: 1, borderTopColor: c.border }]}>
        <Text variant="label" color="muted" uppercase style={tw`mt-3`}>
          Quantité consommée
        </Text>
        <View style={tw`flex-row gap-3`}>
          <View
            style={[
              tw`flex-1 flex-row items-center rounded-xl px-4`,
              {
                backgroundColor: c.surfaceElevated,
                borderWidth: 1,
                borderColor: c.border,
                height: 44,
              },
            ]}
          >
            <TextInput
              value={quantityStr}
              onChangeText={onChangeQuantity}
              keyboardType="numeric"
              selectTextOnFocus
              style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
            />
            <Text variant="body" color="muted">
              g
            </Text>
          </View>
          {preview && (
            <View
              style={[
                tw`px-4 rounded-xl items-center justify-center`,
                { backgroundColor: c.primary + '15', minWidth: 88 },
              ]}
            >
              <Text style={{ fontWeight: '800', color: c.primary, fontSize: 18, lineHeight: 22 }}>
                {preview.kcal}
              </Text>
              <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                kcal
              </Text>
            </View>
          )}
        </View>
        {preview && (
          <View style={[tw`flex-row rounded-xl p-3`, { backgroundColor: c.surfaceElevated }]}>
            <MacroChip label="Protéines" value={preview.proteines} color={c.info} />
            <View style={[tw`w-px`, { backgroundColor: c.border }]} />
            <MacroChip label="Glucides" value={preview.glucides} color={c.warning} />
            <View style={[tw`w-px`, { backgroundColor: c.border }]} />
            <MacroChip label="Lipides" value={preview.lipides} color={c.tertiary} />
          </View>
        )}
        <Button label="Ajouter" fullWidth onPress={onAdd} />
      </View>
    </View>
  )
}

export default function FoodSearchScreen() {
  const router = useRouter()
  const { mealType, context } = useLocalSearchParams<{ mealType: string; context: string }>()
  const c = useColors()
  const setWeekPlan = useSetAtom(weekPlanAtom)
  const [recentFoodsRaw, setRecentFoods] = useAtom(recentFoodsAtom)
  const [customFoodsRaw, setCustomFoods] = useAtom(customFoodsAtom)
  const recentFoods = recentFoodsRaw.filter((f) => typeof f.per100g?.kcal === 'number')
  const customFoods = customFoodsRaw.filter((f) => typeof f.per100g?.kcal === 'number')
  const setPendingIngredient = useSetAtom(pendingIngredientAtom)
  const isRecipeMode = context === 'recipe'
  const todayKey = dayjs().format('YYYY-MM-DD')

  const [mode, setMode] = useState<SearchMode>('favorites')
  const [activeSource, setActiveSource] = useState<FoodSource>('ciqual')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodProduct | null>(null)
  const [quantityStr, setQuantityStr] = useState('100')
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)
  const [editableBarcode, setEditableBarcode] = useState('')
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  const sourceSheetRef = useRef<BottomSheetModal>(null)
  const addFoodSheetRef = useRef<BottomSheetModal>(null)
  const searchInputRef = useRef<TextInput>(null)

  const {
    data: barcodeFood,
    isFetching: barcodeFetching,
    isError: barcodeError,
  } = useFoodByBarcode(scannedBarcode)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualFoodInput, unknown, ManualFoodForm>({
    resolver: zodResolver(manualFoodSchema),
    defaultValues: { quantite: 100, kcal: 0, proteines: 0, glucides: 0, lipides: 0 },
  })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (mode === 'apis') {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'barcode' && cameraPermission !== null && !cameraPermission.granted) {
      requestCameraPermission()
    }
  }, [mode, cameraPermission])

  useEffect(() => {
    if (scannedBarcode) setEditableBarcode(scannedBarcode)
  }, [scannedBarcode])

  const {
    data: offResults = [],
    isFetching: offFetching,
    isError: offError,
  } = useFoodSearch(debouncedQuery, mode === 'apis' && activeSource === 'openfoodfacts')
  const { data: ciqualResults = [], isFetching: ciqualFetching } = useCiqualSearch(
    debouncedQuery,
    mode === 'apis' && activeSource === 'ciqual',
  )

  const apiResults = activeSource === 'ciqual' ? ciqualResults : offResults
  const isFetching = activeSource === 'ciqual' ? ciqualFetching : offFetching
  const isError = activeSource === 'ciqual' ? false : offError

  const matchingCustomFoods =
    mode === 'apis' && debouncedQuery.trim().length >= 2
      ? searchCustomFoods(customFoods, debouncedQuery).filter(
          (cf) => !apiResults.some((r) => r.id === cf.id),
        )
      : []
  const searchResults = [...matchingCustomFoods, ...apiResults].filter(isValidFood)

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function handleModeChange(m: SearchMode) {
    Keyboard.dismiss()
    setMode(m)
    setSelectedFood(null)
    setQuery('')
    setScannedBarcode(null)
  }

  function handleSourceChange(source: FoodSource) {
    setActiveSource(source)
    setSelectedFood(null)
    sourceSheetRef.current?.dismiss()
  }

  function handleSelectFood(food: FoodProduct) {
    if (selectedFood?.id === food.id) {
      setSelectedFood(null)
    } else {
      setSelectedFood(food)
      setQuantityStr('100')
    }
  }

  function handleCreateManualFood(data: ManualFoodForm) {
    const food: FoodProduct = {
      id: `manual-${Date.now()}`,
      name: data.name,
      brand: data.brand || undefined,
      source: 'manual',
      per100g: {
        kcal: data.kcal,
        proteines: data.proteines,
        glucides: data.glucides,
        lipides: data.lipides,
      },
    }
    setCustomFoods((prev) => addCustomFood(prev, food))

    if (isRecipeMode) {
      setPendingIngredient({ food, quantityG: data.quantite })
      addFoodSheetRef.current?.dismiss()
      reset()
      router.back()
      return
    }

    if (mealType) {
      const macros = calcMacros(food, data.quantite)
      const meal: PlannedMeal = {
        id: `${Date.now()}-${food.id}`,
        name: food.brand ? `${food.name} (${food.brand})` : food.name,
        meal: mealType as MealType,
        ...macros,
        quantityG: data.quantite,
        per100g: food.per100g,
      }
      setWeekPlan((prev) => ({
        ...prev,
        [todayKey]: [...(prev[todayKey] ?? []), meal],
      }))
      setRecentFoods((prev) => addToRecent(prev, { ...food, per100g: { ...food.per100g } }))
    }
    addFoodSheetRef.current?.dismiss()
    reset()
    router.back()
  }

  function handleAdd(
    overrideFood?: FoodProduct,
    unitInfo?: { count: number; weightG: number },
    displayUnit?: string,
  ) {
    const rawFood = overrideFood ?? selectedFood
    if (!rawFood) return

    // Construction explicite pour exclure toute propriété interne React/React Query
    const food: FoodProduct = {
      id: rawFood.id,
      name: rawFood.name,
      source: rawFood.source,
      per100g: {
        kcal: rawFood.per100g.kcal,
        proteines: rawFood.per100g.proteines,
        glucides: rawFood.per100g.glucides,
        lipides: rawFood.per100g.lipides,
        ...(rawFood.per100g.fibres != null ? { fibres: rawFood.per100g.fibres } : {}),
        ...(rawFood.per100g.sel != null ? { sel: rawFood.per100g.sel } : {}),
      },
      ...(rawFood.barcode != null ? { barcode: rawFood.barcode } : {}),
      ...(rawFood.brand != null ? { brand: rawFood.brand } : {}),
    }
    const grams = parseFloat(quantityStr.replace(',', '.')) || 100

    if (isRecipeMode) {
      setPendingIngredient({
        food,
        quantityG: grams,
        ...(unitInfo ? { unitCount: unitInfo.count, unitWeightG: unitInfo.weightG } : {}),
        ...(displayUnit ? { displayUnit } : {}),
      })
      router.back()
      return
    }

    if (!mealType) return
    const macros = calcMacros(food, grams)

    const meal: PlannedMeal = {
      id: `${Date.now()}-${food.id}`,
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      meal: mealType as MealType,
      ...macros,
      quantityG: grams,
      per100g: food.per100g,
    }

    setWeekPlan((prev) => ({
      ...prev,
      [todayKey]: [...(prev[todayKey] ?? []), meal],
    }))
    setRecentFoods((prev) => addToRecent(prev, food))
    router.back()
  }

  const activeSourceDef = SOURCES.find((s) => s.key === activeSource)!
  const grams = parseFloat(quantityStr.replace(',', '.')) || 0
  const preview = selectedFood && grams > 0 ? calcMacros(selectedFood, grams) : null
  const isLoading = isFetching && debouncedQuery.trim().length >= 2

  const filteredRecent = (
    query.trim()
      ? recentFoods.filter((f) => {
          const q = query.toLowerCase()
          return f.name?.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)
        })
      : recentFoods
  ).filter(isValidFood)

  const foodItemProps = {
    quantityStr,
    preview,
    onChangeQuantity: setQuantityStr,
    onAdd: (unitInfo?: { count: number; weightG: number }, displayUnit?: string) =>
      handleAdd(undefined, unitInfo, displayUnit),
    c,
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
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
          <View style={tw`flex-1`}>
            <Text variant="heading3" style={{ fontWeight: '700' }}>
              {isRecipeMode ? 'Ajouter un ingrédient' : 'Aliment unique'}
            </Text>
            {!isRecipeMode && mealType && (
              <Text variant="caption" color="secondary">
                {mealType}
              </Text>
            )}
          </View>
        </View>

        {/* Barre de modes */}
        <View style={tw`flex-row gap-2 px-4 py-3`}>
          {MODES.map((m) => {
            const isActive = mode === m.key
            const icon = m.key === 'apis' && isActive ? activeSourceDef.icon : m.icon
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => {
                  if (m.key === 'apis' && isActive) {
                    Keyboard.dismiss()
                    sourceSheetRef.current?.present()
                  } else {
                    handleModeChange(m.key)
                  }
                }}
                activeOpacity={0.8}
                style={[
                  tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
                  { backgroundColor: isActive ? c.primary : c.surfaceElevated },
                ]}
              >
                <Ionicons name={icon} size={16} color={isActive ? '#FFFFFF' : c.textSecondary} />
                <Text
                  variant="caption"
                  style={{ color: isActive ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
                >
                  {m.key === 'apis' && isActive ? activeSourceDef.shortLabel : m.label}
                </Text>
                {m.key === 'apis' && isActive && (
                  <Ionicons name="chevron-down" size={13} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Barre de recherche — Récents et APIs */}
        {(mode === 'favorites' || mode === 'apis') && (
          <View
            style={[
              tw`flex-row items-center mx-4 mb-3 px-4 rounded-xl gap-3`,
              { backgroundColor: c.surfaceElevated, height: 48 },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={c.textMuted} />
            <TextInput
              ref={searchInputRef}
              placeholder={
                mode === 'favorites' ? 'Filtrer mes récents...' : 'Rechercher un aliment...'
              }
              placeholderTextColor={c.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Contenu selon le mode */}
        {mode === 'favorites' ? (
          recentFoods.length === 0 ? (
            <EmptyState
              icon="star-outline"
              title="Aucun aliment récent"
              description="Les aliments que tu ajoutes apparaîtront ici."
              c={c}
            />
          ) : filteredRecent.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Aucun résultat"
              description={`Aucun récent correspondant à « ${query} ».`}
              c={c}
            />
          ) : (
            <FlatList
              data={filteredRecent}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={tw`px-4 pb-4`}
              renderItem={({ item }) => (
                <FoodItem
                  item={item}
                  isSelected={selectedFood?.id === item.id}
                  onPress={() => handleSelectFood(item)}
                  {...foodItemProps}
                />
              )}
            />
          )
        ) : mode === 'barcode' ? (
          <View style={tw`flex-1`}>
            {cameraPermission === null ? (
              <View style={tw`px-4 pt-8 items-center`}>
                <ActivityIndicator color={c.primary} />
              </View>
            ) : !cameraPermission.granted ? (
              <EmptyState
                icon="camera-outline"
                title="Accès caméra requis"
                description="L'accès à la caméra est nécessaire pour scanner un code-barres."
                action={{ label: 'Autoriser la caméra', onPress: requestCameraPermission }}
                secondaryAction={{
                  label: 'Gérer dans les réglages',
                  onPress: () => Linking.openSettings(),
                }}
                c={c}
              />
            ) : scannedBarcode && barcodeFetching ? (
              <View style={tw`px-4 pt-8 items-center gap-2`}>
                <ActivityIndicator color={c.primary} size="large" />
                <Text variant="caption" color="muted">
                  Recherche du produit...
                </Text>
              </View>
            ) : scannedBarcode && barcodeError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="Connexion impossible"
                description="Impossible de contacter OpenFoodFacts. Vérifie ta connexion."
                action={{ label: 'Re-scanner', onPress: () => setScannedBarcode(null) }}
                c={c}
              />
            ) : scannedBarcode && !barcodeFetching && barcodeFood === null ? (
              <View style={tw`px-4 pt-6 gap-4`}>
                {/* Header */}
                <View style={tw`items-center gap-3`}>
                  <View
                    style={[
                      tw`w-11 h-11 rounded-2xl items-center justify-center`,
                      { backgroundColor: c.surfaceElevated },
                    ]}
                  >
                    <Ionicons name="help-circle-outline" size={20} color={c.textMuted} />
                  </View>
                  <View style={tw`gap-1 items-center`}>
                    <Text variant="body" style={{ fontWeight: '700' }}>
                      Produit introuvable
                    </Text>
                    <Text variant="caption" color="secondary" style={tw`text-center`}>
                      {"Ce code-barres n'existe pas dans OpenFoodFacts."}
                    </Text>
                  </View>
                </View>

                {/* Action principale */}
                <Button label="Re-scanner" fullWidth onPress={() => setScannedBarcode(null)} />

                {/* Séparateur */}
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={[tw`flex-1 h-px`, { backgroundColor: c.border }]} />
                  <Text variant="caption" color="muted">
                    ou corriger le code
                  </Text>
                  <View style={[tw`flex-1 h-px`, { backgroundColor: c.border }]} />
                </View>

                {/* Correction du code-barres */}
                <View style={tw`gap-2`}>
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
                    <Ionicons
                      name="barcode-outline"
                      size={18}
                      color={c.textMuted}
                      style={tw`mr-2`}
                    />
                    <TextInput
                      value={editableBarcode}
                      onChangeText={setEditableBarcode}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      placeholder="Code-barres"
                      placeholderTextColor={c.textMuted}
                      style={[
                        tw`flex-1 text-base`,
                        { color: c.textPrimary, fontFamily: 'monospace' },
                      ]}
                    />
                  </View>
                  <Button
                    variant="secondary"
                    label="Rechercher ce code"
                    fullWidth
                    onPress={() => {
                      const trimmed = editableBarcode.trim()
                      if (trimmed) setScannedBarcode(trimmed)
                    }}
                  />
                </View>
              </View>
            ) : scannedBarcode && barcodeFood ? (
              <ScrollView contentContainerStyle={tw`px-4 pt-2 pb-4 gap-3`}>
                <BarcodeFoodCard
                  food={barcodeFood}
                  quantityStr={quantityStr}
                  onChangeQuantity={setQuantityStr}
                  onAdd={() => handleAdd(barcodeFood)}
                  c={c}
                />
                <Button
                  variant="secondary"
                  label="Re-scanner"
                  fullWidth
                  onPress={() => setScannedBarcode(null)}
                />
              </ScrollView>
            ) : (
              <View style={tw`flex-1`}>
                <CameraView
                  style={tw`flex-1`}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                  }}
                  onBarcodeScanned={({ data }) => {
                    if (!scannedBarcode) setScannedBarcode(data)
                  }}
                />
                <View
                  style={[tw`absolute top-0 left-0 right-0 bottom-0 items-center justify-center`]}
                  pointerEvents="none"
                >
                  <View
                    style={[tw`w-64 h-32 rounded-2xl`, { borderWidth: 2, borderColor: c.primary }]}
                  />
                  <Text
                    variant="body"
                    style={[tw`mt-4 text-center`, { color: '#FFFFFF', fontWeight: '600' }]}
                  >
                    Pointez le code-barres
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : activeSource === 'ciqual' && !isCiqualLoaded ? (
          <EmptyState
            icon="flask-outline"
            title="Base CIQUAL non chargée"
            description={`Lance python3 scripts/generate-ciqual.py puis redémarre Expo.`}
            c={c}
          />
        ) : isLoading ? (
          <View style={tw`px-4 pt-8 items-center`}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="OpenFoodFacts indisponible"
            description="Le service est temporairement surchargé. Utilise CIQUAL pour la recherche, le scan code-barres reste fonctionnel."
            c={c}
          />
        ) : searchResults.length === 0 && debouncedQuery.trim() ? (
          <EmptyState
            icon="search-outline"
            title="Aucun résultat"
            description={`Aucun aliment correspondant à « ${debouncedQuery} ».`}
            c={c}
          />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={tw`px-4 pb-4`}
            renderItem={({ item }) => (
              <FoodItem
                item={item}
                isSelected={selectedFood?.id === item.id}
                onPress={() => handleSelectFood(item)}
                {...foodItemProps}
              />
            )}
          />
        )}
      </KeyboardAvoidingView>

      {/* FAB — ajouter un aliment manuellement */}
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss()
          addFoodSheetRef.current?.present()
        }}
        activeOpacity={0.85}
        style={[
          tw`absolute bottom-12 right-6 w-14 h-14 rounded-full items-center justify-center`,
          {
            backgroundColor: c.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom sheet sélection de source */}
      <BottomSheetModal
        ref={sourceSheetRef}
        snapPoints={['42%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-2`}>
          <Text variant="heading3" style={{ fontWeight: '700', marginBottom: 4 }}>
            Source des aliments
          </Text>
          {SOURCES.map((source) => {
            const isActive = activeSource === source.key
            return (
              <TouchableOpacity
                key={source.key}
                activeOpacity={0.8}
                onPress={() => handleSourceChange(source.key)}
                style={[
                  tw`flex-row items-center gap-4 p-4 rounded-2xl`,
                  { backgroundColor: isActive ? c.primary + '15' : c.surfaceElevated },
                ]}
              >
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center shrink-0`,
                    { backgroundColor: isActive ? c.primary + '25' : c.surface },
                  ]}
                >
                  <Ionicons
                    name={source.icon}
                    size={20}
                    color={isActive ? c.primary : c.textSecondary}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text
                    variant="body"
                    style={{ fontWeight: '600', color: isActive ? c.primary : c.textPrimary }}
                  >
                    {source.label}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {source.description}
                  </Text>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={20} color={c.primary} />}
              </TouchableOpacity>
            )
          })}
        </BottomSheetView>
      </BottomSheetModal>
      {/* Bottom sheet — ajout manuel d'un aliment */}
      <BottomSheetModal
        ref={addFoodSheetRef}
        snapPoints={['90%']}
        backdropComponent={renderBackdrop}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetScrollView
          contentContainerStyle={tw`px-4 pt-2 pb-10 gap-4`}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="heading3" style={{ fontWeight: '700', marginBottom: 4 }}>
            Ajouter un aliment
          </Text>

          {/* Nom */}
          <View style={tw`gap-1`}>
            <Text variant="label" color="muted" uppercase>
              Nom *
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <View
                  style={[
                    tw`flex-row items-center rounded-xl px-4`,
                    {
                      backgroundColor: c.surfaceElevated,
                      borderWidth: 1,
                      borderColor: errors.name ? '#ef4444' : c.border,
                      height: 44,
                    },
                  ]}
                >
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex : Riz basmati cuit"
                    placeholderTextColor={c.textMuted}
                    style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                  />
                </View>
              )}
            />
            {errors.name && (
              <Text variant="caption" style={{ color: '#ef4444' }}>
                {errors.name.message}
              </Text>
            )}
          </View>

          {/* Marque (optionnel) */}
          <View style={tw`gap-1`}>
            <Text variant="label" color="muted" uppercase>
              Marque (optionnel)
            </Text>
            <Controller
              control={control}
              name="brand"
              render={({ field: { value, onChange, onBlur } }) => (
                <View
                  style={[
                    tw`flex-row items-center rounded-xl px-4`,
                    {
                      backgroundColor: c.surfaceElevated,
                      borderWidth: 1,
                      borderColor: c.border,
                      height: 44,
                    },
                  ]}
                >
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex : Lustucru"
                    placeholderTextColor={c.textMuted}
                    style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                  />
                </View>
              )}
            />
          </View>

          {/* Macros pour 100g */}
          <View style={tw`gap-2`}>
            <Text variant="label" color="muted" uppercase>
              Valeurs pour 100g
            </Text>
            <View style={tw`flex-row gap-3`}>
              {(
                [
                  { name: 'kcal', label: 'Kcal', unit: 'kcal' },
                  { name: 'proteines', label: 'Protéines', unit: 'g' },
                ] as const
              ).map(({ name, label, unit }) => (
                <View key={name} style={tw`flex-1 gap-1`}>
                  <Text variant="caption" color="secondary">
                    {label}
                  </Text>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View
                        style={[
                          tw`flex-row items-center rounded-xl px-3`,
                          {
                            backgroundColor: c.surfaceElevated,
                            borderWidth: 1,
                            borderColor: errors[name] ? '#ef4444' : c.border,
                            height: 44,
                          },
                        ]}
                      >
                        <TextInput
                          value={String(value)}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                        />
                        <Text variant="caption" color="muted">
                          {unit}
                        </Text>
                      </View>
                    )}
                  />
                </View>
              ))}
            </View>
            <View style={tw`flex-row gap-3`}>
              {(
                [
                  { name: 'glucides', label: 'Glucides', unit: 'g' },
                  { name: 'lipides', label: 'Lipides', unit: 'g' },
                ] as const
              ).map(({ name, label, unit }) => (
                <View key={name} style={tw`flex-1 gap-1`}>
                  <Text variant="caption" color="secondary">
                    {label}
                  </Text>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View
                        style={[
                          tw`flex-row items-center rounded-xl px-3`,
                          {
                            backgroundColor: c.surfaceElevated,
                            borderWidth: 1,
                            borderColor: errors[name] ? '#ef4444' : c.border,
                            height: 44,
                          },
                        ]}
                      >
                        <TextInput
                          value={String(value)}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                        />
                        <Text variant="caption" color="muted">
                          {unit}
                        </Text>
                      </View>
                    )}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Quantité */}
          <View style={tw`gap-1`}>
            <Text variant="label" color="muted" uppercase>
              Quantité consommée
            </Text>
            <Controller
              control={control}
              name="quantite"
              render={({ field: { value, onChange, onBlur } }) => (
                <View
                  style={[
                    tw`flex-row items-center rounded-xl px-4`,
                    {
                      backgroundColor: c.surfaceElevated,
                      borderWidth: 1,
                      borderColor: errors.quantite ? '#ef4444' : c.border,
                      height: 44,
                    },
                  ]}
                >
                  <TextInput
                    value={String(value)}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    selectTextOnFocus
                    style={[tw`flex-1 text-base`, { color: c.textPrimary }]}
                  />
                  <Text variant="body" color="muted">
                    g
                  </Text>
                </View>
              )}
            />
          </View>

          <Button
            label="Créer et ajouter"
            fullWidth
            onPress={handleSubmit(handleCreateManualFood)}
            style={tw`mt-2`}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  )
}
