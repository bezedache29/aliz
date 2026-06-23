import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'
import { z } from 'zod'

import { Button } from '@/src/components/button'
import { Text } from '@/src/components/text'
import { isCiqualLoaded } from '@/src/apis/ciqualApi/client'
import { useCiqualSearch } from '@/src/apis/ciqualApi/hooks/food/useCiqualSearch'
import { useFoodSearch } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodSearch'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import { FoodProduct } from '@/src/models/food/food.model'
import { MealType, PlannedMeal } from '@/src/models/planning/planning.model'
import { addCustomFood, customFoodsAtom, searchCustomFoods } from '@/src/store/customFoodsAtom'
import { addToRecent, recentFoodsAtom } from '@/src/store/recentFoodsAtom'
import { weekPlanAtom } from '@/src/store/planningAtom'

type SearchMode = 'favorites' | 'barcode' | 'apis'
type FoodSource = 'openfoodfacts' | 'ciqual'

const manualFoodSchema = z.object({
  name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  brand: z.string().optional(),
  kcal: z.number().min(0, 'Requis'),
  proteines: z.number().min(0, 'Requis'),
  glucides: z.number().min(0, 'Requis'),
  lipides: z.number().min(0, 'Requis'),
  quantite: z.number().min(1, 'Requis'),
})
type ManualFoodForm = z.infer<typeof manualFoodSchema>

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

function calcMacros(food: FoodProduct, grams: number) {
  const f = grams / 100
  return {
    kcal: Math.round(food.per100g.kcal * f),
    proteines: Math.round(food.per100g.proteines * f * 10) / 10,
    glucides: Math.round(food.per100g.glucides * f * 10) / 10,
    lipides: Math.round(food.per100g.lipides * f * 10) / 10,
  }
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
  onAdd: () => void
  c: ReturnType<typeof import('@/src/hooks/use-colors').useColors>
}) {
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
          <View style={tw`flex-row items-center gap-2`}>
            <Text
              variant="body"
              style={{ fontWeight: isSelected ? '700' : '500' }}
              numberOfLines={1}
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
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {[item.brand, `${item.per100g.kcal} kcal/100g`].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Ionicons name={isSelected ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
      </View>

      {isSelected && (
        <View style={tw`mt-3 gap-3`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View style={tw`flex-1`}>
              <Text variant="label" color="muted" uppercase style={tw`mb-1`}>
                Quantité
              </Text>
              <View
                style={[
                  tw`flex-row items-center rounded-xl px-4`,
                  { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, height: 44 },
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
          <Button label="Ajouter" fullWidth onPress={onAdd} />
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function FoodSearchScreen() {
  const router = useRouter()
  const { mealType } = useLocalSearchParams<{ mealType: string }>()
  const c = useColors()
  const setWeekPlan = useSetAtom(weekPlanAtom)
  const [recentFoods, setRecentFoods] = useAtom(recentFoodsAtom)
  const [customFoods, setCustomFoods] = useAtom(customFoodsAtom)
  const todayKey = dayjs().format('YYYY-MM-DD')

  const [mode, setMode] = useState<SearchMode>('favorites')
  const [activeSource, setActiveSource] = useState<FoodSource>('ciqual')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodProduct | null>(null)
  const [quantityStr, setQuantityStr] = useState('100')

  const sourceSheetRef = useRef<BottomSheetModal>(null)
  const addFoodSheetRef = useRef<BottomSheetModal>(null)
  const searchInputRef = useRef<TextInput>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualFoodForm>({
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
  const searchResults = [...matchingCustomFoods, ...apiResults]

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
    if (mealType) {
      const macros = calcMacros(food, data.quantite)
      const meal: PlannedMeal = {
        id: `${Date.now()}-${food.id}`,
        name: food.brand ? `${food.name} (${food.brand})` : food.name,
        meal: mealType as MealType,
        ...macros,
      }
      setWeekPlan((prev) => ({
        ...prev,
        [todayKey]: [...(prev[todayKey] ?? []), meal],
      }))
      setRecentFoods((prev) => addToRecent(prev, food))
    }
    setCustomFoods((prev) => addCustomFood(prev, food))
    addFoodSheetRef.current?.dismiss()
    reset()
    router.back()
  }

  function handleAdd() {
    if (!selectedFood || !mealType) return
    const grams = parseFloat(quantityStr.replace(',', '.')) || 100
    const macros = calcMacros(selectedFood, grams)

    const meal: PlannedMeal = {
      id: `${Date.now()}-${selectedFood.id}`,
      name: selectedFood.brand ? `${selectedFood.name} (${selectedFood.brand})` : selectedFood.name,
      meal: mealType as MealType,
      ...macros,
    }

    setWeekPlan((prev) => ({
      ...prev,
      [todayKey]: [...(prev[todayKey] ?? []), meal],
    }))
    setRecentFoods((prev) => addToRecent(prev, selectedFood))
    router.back()
  }

  const activeSourceDef = SOURCES.find((s) => s.key === activeSource)!
  const grams = parseFloat(quantityStr.replace(',', '.')) || 0
  const preview = selectedFood && grams > 0 ? calcMacros(selectedFood, grams) : null
  const isLoading = isFetching && debouncedQuery.trim().length >= 2

  const filteredRecent = query.trim()
    ? recentFoods.filter((f) => {
        const q = query.toLowerCase()
        return f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)
      })
    : recentFoods

  const foodItemProps = {
    quantityStr,
    preview,
    onChangeQuantity: setQuantityStr,
    onAdd: handleAdd,
    c,
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
              Aliment unique
            </Text>
            {mealType && (
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
            <View style={tw`items-center px-8 pt-6 gap-2`}>
              <Ionicons name="star-outline" size={40} color={c.textMuted} />
              <Text variant="body" color="muted" style={tw`text-center`}>
                Les aliments que tu ajoutes apparaîtront ici.
              </Text>
            </View>
          ) : filteredRecent.length === 0 ? (
            <View style={tw`items-center px-8 pt-6 gap-2`}>
              <Ionicons name="search-outline" size={40} color={c.textMuted} />
              <Text variant="body" color="muted" style={tw`text-center`}>
                Aucun résultat pour « {query} »
              </Text>
            </View>
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
          <View style={tw`items-center px-8 pt-6 gap-2`}>
            <Ionicons name="barcode-outline" size={40} color={c.textMuted} />
            <Text variant="body" color="muted" style={tw`text-center`}>
              Scanner un code-barre — bientôt disponible.
            </Text>
          </View>
        ) : activeSource === 'ciqual' && !isCiqualLoaded ? (
          <View style={tw`items-center px-8 pt-6 gap-2`}>
            <Ionicons name="flask-outline" size={40} color={c.textMuted} />
            <Text variant="body" color="muted" style={tw`text-center`}>
              Base CIQUAL non chargée.
            </Text>
            <Text variant="caption" color="muted" style={tw`text-center`}>
              Lance{'\n'}
              <Text variant="caption" style={{ fontFamily: 'monospace', color: c.textSecondary }}>
                python3 scripts/generate-ciqual.py
              </Text>
              {'\n'}puis redémarre Expo.
            </Text>
          </View>
        ) : isLoading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        ) : isError ? (
          <View style={tw`items-center px-8 pt-6 gap-2`}>
            <Ionicons name="cloud-offline-outline" size={40} color={c.textMuted} />
            <Text variant="body" color="muted" style={tw`text-center`}>
              Impossible de contacter {activeSourceDef.label}. Vérifie ta connexion.
            </Text>
          </View>
        ) : searchResults.length === 0 && debouncedQuery.trim() ? (
          <View style={tw`items-center px-8 pt-6 gap-2`}>
            <Ionicons name="search-outline" size={40} color={c.textMuted} />
            <Text variant="body" color="muted" style={tw`text-center`}>
              Aucun résultat pour « {debouncedQuery} »
            </Text>
          </View>
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
        keyboardBehavior="interactive"
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
                          onChangeText={(v) => onChange(parseFloat(v) || 0)}
                          onBlur={onBlur}
                          keyboardType="numeric"
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
                          onChangeText={(v) => onChange(parseFloat(v) || 0)}
                          onBlur={onBlur}
                          keyboardType="numeric"
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
