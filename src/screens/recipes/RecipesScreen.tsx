import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SectionList,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useDeleteRecipe } from '@/src/apis/backendApi/hooks/recipes/useDeleteRecipe'
import { useRecipes } from '@/src/apis/backendApi/hooks/recipes/useRecipes'
import { useUpdateRecipe } from '@/src/apis/backendApi/hooks/recipes/useUpdateRecipe'
import { AvatarButton } from '@/src/components/avatar-button'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COOKING_METHOD_ICONS,
  SEASON_ICONS,
  RecipeCard,
} from '@/src/features/recipes/RecipeCard'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import {
  RECIPE_CATEGORIES,
  RECIPE_COOKING_METHODS,
  RECIPE_SEASONS,
  Recipe,
  RecipeCategory,
  RecipeCookingMethod,
  RecipeSeason,
  computeRecipeNutrition,
} from '@/src/models/recipe/recipe.model'

const CATEGORY_ORDER: RecipeCategory[] = [
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
]

const TABS = [
  { key: 'my' as const, label: 'Mes recettes', icon: 'book-outline' as const },
  { key: 'ai' as const, label: 'Recettes IA', icon: 'bulb-outline' as const },
]

type ActiveFilters = {
  favoriteOnly: boolean
  category: RecipeCategory | null
  maxTime: 15 | 30 | 60 | null
  maxKcal: 300 | 500 | 800 | null
  season: RecipeSeason | null
  cookingMethod: RecipeCookingMethod | null
}

const DEFAULT_FILTERS: ActiveFilters = {
  favoriteOnly: false,
  category: null,
  maxTime: null,
  maxKcal: null,
  season: null,
  cookingMethod: null,
}

function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  if (!query.trim()) return recipes
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return recipes.filter((r) => {
    const name = r.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return name.includes(q)
  })
}

export default function RecipesScreen() {
  const c = useColors()
  const router = useRouter()
  const { data: recipes = [], isLoading, refetch } = useRecipes()
  const { mutate: updateRecipe } = useUpdateRecipe()
  const { mutate: deleteRecipe } = useDeleteRecipe()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))

  const [activeTab, setActiveTab] = useState<'my' | 'ai'>('my')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)

  const activeFilterCount = [
    filters.favoriteOnly,
    filters.category !== null,
    filters.maxTime !== null,
    filters.maxKcal !== null,
    filters.season !== null,
    filters.cookingMethod !== null,
  ].filter(Boolean).length

  const sourceRecipes = useMemo(
    () => recipes.filter((r) => (activeTab === 'my' ? !r.isAiGenerated : r.isAiGenerated)),
    [recipes, activeTab],
  )

  const filteredRecipes = useMemo(() => {
    let result = searchRecipes(sourceRecipes, searchQuery)
    if (filters.favoriteOnly) result = result.filter((r) => r.isFavorite)
    if (filters.maxTime !== null) {
      result = result.filter((r) => (r.prepTime ?? 0) + (r.cookTime ?? 0) <= filters.maxTime!)
    }
    if (filters.maxKcal !== null) {
      result = result.filter(
        (r) => computeRecipeNutrition(r.ingredients, r.servings).kcal <= filters.maxKcal!,
      )
    }
    if (filters.season !== null) {
      result = result.filter((r) => r.seasons?.includes(filters.season!))
    }
    if (filters.cookingMethod !== null) {
      result = result.filter((r) => r.cookingMethod === filters.cookingMethod)
    }
    return result
  }, [sourceRecipes, searchQuery, filters])

  const categoryList = useMemo(() => {
    if (!filters.category) return null
    return filteredRecipes.filter((r) => r.category === filters.category)
  }, [filteredRecipes, filters.category])

  const sections = useMemo(() => {
    if (filters.category) return []
    const grouped = new Map<RecipeCategory, Recipe[]>()
    for (const recipe of filteredRecipes) {
      const existing = grouped.get(recipe.category) ?? []
      grouped.set(recipe.category, [...existing, recipe])
    }
    return CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => ({
      title: cat,
      data: grouped.get(cat)!,
    }))
  }, [filteredRecipes, filters.category])

  function setFilter<K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  function handleToggleFavorite(id: string) {
    const recipe = recipes.find((r) => r.id === id)
    if (recipe) updateRecipe({ ...recipe, isFavorite: !recipe.isFavorite })
  }

  function handleEdit(recipe: Recipe) {
    router.push(`/recipe-edit?id=${recipe.id}`)
  }

  function handleDelete(id: string) {
    deleteRecipe(id)
  }

  const isEmpty = categoryList !== null ? categoryList.length === 0 : sections.length === 0

  const searchAndFiltersProps = {
    c,
    searchQuery,
    onSearchChange: setSearchQuery,
    filtersOpen,
    onToggleFilters: () => setFiltersOpen((v) => !v),
    activeFilterCount,
    filters,
    setFilter,
    resetFilters,
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[tw`flex-1`, { backgroundColor: c.background }]}
    >
      <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-4`}>
        <Text variant="heading1" style={{ fontWeight: '700' }}>
          Recettes
        </Text>
        <AvatarButton />
      </View>

      {/* Onglets */}
      <View style={tw`flex-row gap-2 px-4 pt-4 pb-2`}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
                { backgroundColor: isActive ? c.primary : c.surfaceElevated },
              ]}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? '#FFFFFF' : c.textSecondary} />
              <Text
                variant="caption"
                style={{ color: isActive ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={tw`flex-1`}>
        {isLoading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : isEmpty ? (
          <ScrollView
            contentContainerStyle={tw`px-4 pt-3 pb-28`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
            }
          >
            <SearchAndFilters {...searchAndFiltersProps} />
            <EmptyState
              variant={activeTab}
              hasFilters={activeFilterCount > 0 || searchQuery.length > 0}
              onCreatePress={() =>
                router.push(activeTab === 'my' ? '/recipe-create' : '/recipe-generate')
              }
              onReset={() => {
                resetFilters()
                setSearchQuery('')
              }}
            />
          </ScrollView>
        ) : categoryList !== null ? (
          <FlatList
            data={categoryList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={tw`px-4 pt-3 pb-28`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
            }
            ListHeaderComponent={<SearchAndFilters {...searchAndFiltersProps} />}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={tw`px-4 pt-3 pb-28`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
            }
            ListHeaderComponent={<SearchAndFilters {...searchAndFiltersProps} />}
            renderSectionHeader={({ section: { title } }) => (
              <CategorySectionHeader title={title} />
            )}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push(activeTab === 'my' ? '/recipe-create' : '/recipe-generate')}
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
        <Ionicons
          name={activeTab === 'my' ? 'add' : 'sparkles-outline'}
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

type SearchAndFiltersProps = {
  c: ReturnType<typeof useColors>
  searchQuery: string
  onSearchChange: (v: string) => void
  filtersOpen: boolean
  onToggleFilters: () => void
  activeFilterCount: number
  filters: ActiveFilters
  setFilter: <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => void
  resetFilters: () => void
}

function SearchAndFilters({
  c,
  searchQuery,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  filters,
  setFilter,
  resetFilters,
}: SearchAndFiltersProps) {
  return (
    <View style={tw`gap-0`}>
      <View style={tw`flex-row items-center gap-2 mb-2`}>
        <View
          style={[
            tw`flex-1 flex-row items-center px-4 rounded-xl gap-3`,
            { backgroundColor: c.surfaceElevated, height: 48 },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={c.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Rechercher une recette..."
            placeholderTextColor={c.textMuted}
            style={{ flex: 1, color: c.textPrimary, fontSize: 15 }}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity hitSlop={8} onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={onToggleFilters}
          style={[
            tw`h-12 px-3 rounded-xl flex-row items-center gap-1.5`,
            { backgroundColor: activeFilterCount > 0 ? c.primary : c.surfaceElevated },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? '#FFFFFF' : c.textSecondary}
          />
          {activeFilterCount > 0 && (
            <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {activeFilterCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {filtersOpen && (
        <View
          style={[
            tw`mb-3 rounded-2xl p-4 gap-4`,
            { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
          ]}
        >
          <FilterRow label="Favoris">
            <FilterChip
              label="Mes favoris"
              icon="heart"
              active={filters.favoriteOnly}
              color={c.primary}
              onPress={() => setFilter('favoriteOnly', !filters.favoriteOnly)}
            />
          </FilterRow>

          <FilterRow label="Catégorie">
            {CATEGORY_ORDER.map((cat) => {
              const color = CATEGORY_COLORS[cat]?.(c) ?? c.textMuted
              return (
                <FilterChip
                  key={cat}
                  label={cat}
                  icon={CATEGORY_ICONS[cat]}
                  active={filters.category === cat}
                  color={color}
                  onPress={() => setFilter('category', filters.category === cat ? null : cat)}
                />
              )
            })}
          </FilterRow>

          <FilterRow label="Temps max">
            {([15, 30, 60] as const).map((t) => (
              <FilterChip
                key={t}
                label={t === 60 ? '< 1h' : `< ${t} min`}
                icon="time-outline"
                active={filters.maxTime === t}
                color={c.info}
                onPress={() => setFilter('maxTime', filters.maxTime === t ? null : t)}
              />
            ))}
          </FilterRow>

          <FilterRow label="Kcal max">
            {([300, 500, 800] as const).map((k) => (
              <FilterChip
                key={k}
                label={`< ${k} kcal`}
                icon="flame-outline"
                active={filters.maxKcal === k}
                color={c.warning}
                onPress={() => setFilter('maxKcal', filters.maxKcal === k ? null : k)}
              />
            ))}
          </FilterRow>

          <FilterRow label="Saison">
            {RECIPE_SEASONS.map((season) => (
              <FilterChip
                key={season}
                label={season}
                icon={SEASON_ICONS[season]}
                active={filters.season === season}
                color={c.tertiary}
                onPress={() => setFilter('season', filters.season === season ? null : season)}
              />
            ))}
          </FilterRow>

          <FilterRow label="Cuisson">
            {RECIPE_COOKING_METHODS.map((method) => (
              <FilterChip
                key={method}
                label={method}
                icon={COOKING_METHOD_ICONS[method]}
                active={filters.cookingMethod === method}
                color={c.info}
                onPress={() =>
                  setFilter('cookingMethod', filters.cookingMethod === method ? null : method)
                }
              />
            ))}
          </FilterRow>

          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={resetFilters}
              style={tw`flex-row items-center justify-center gap-2 py-2`}
            >
              <Ionicons name="refresh-outline" size={15} color={c.textMuted} />
              <Text variant="caption" color="muted">
                Réinitialiser les filtres
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={tw`gap-2`}>
      <Text variant="caption" color="muted" style={{ fontWeight: '600', letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
      <View style={tw`flex-row flex-wrap gap-2`}>{children}</View>
    </View>
  )
}

function FilterChip({
  label,
  icon,
  active,
  color,
  onPress,
}: {
  label: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  active: boolean
  color: string
  onPress: () => void
}) {
  const c = useColors()
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`flex-row items-center gap-1.5 px-3 py-2 rounded-xl`,
        {
          backgroundColor: active ? color : c.surfaceElevated,
          borderWidth: 1,
          borderColor: active ? color : 'transparent',
        },
      ]}
    >
      <Ionicons name={icon} size={13} color={active ? '#FFFFFF' : c.textSecondary} />
      <Text
        variant="caption"
        style={{ color: active ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function CategorySectionHeader({ title }: { title: string }) {
  const c = useColors()
  const cat = title as RecipeCategory
  const color = CATEGORY_COLORS[cat]?.(c) ?? c.textMuted
  const icon = CATEGORY_ICONS[cat]
  return (
    <View
      style={[
        tw`flex-row items-center gap-2 mt-4 mb-1 pl-3 py-1`,
        { borderLeftWidth: 3, borderLeftColor: color },
      ]}
    >
      {icon && <Ionicons name={icon} size={15} color={color} />}
      <Text variant="label" style={{ color, fontWeight: '700', letterSpacing: 0.6 }}>
        {title.toUpperCase()}
      </Text>
    </View>
  )
}

function EmptyState({
  variant,
  hasFilters,
  onCreatePress,
  onReset,
}: {
  variant: 'my' | 'ai'
  hasFilters: boolean
  onCreatePress: () => void
  onReset: () => void
}) {
  const c = useColors()
  const isAi = variant === 'ai'
  return (
    <View style={tw`items-center pt-12 px-8 gap-4`}>
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center`,
          { backgroundColor: c.primary + '15' },
        ]}
      >
        <Ionicons
          name={hasFilters ? 'filter-outline' : isAi ? 'sparkles-outline' : 'book-outline'}
          size={36}
          color={c.primary}
        />
      </View>
      <Text variant="heading3" style={{ fontWeight: '700', textAlign: 'center' }}>
        {hasFilters ? 'Aucune recette trouvée' : isAi ? 'Aucune recette IA' : 'Aucune recette'}
      </Text>
      <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
        {hasFilters
          ? 'Aucune recette ne correspond à ces filtres.'
          : isAi
            ? "Tu n'as pas encore généré de recette avec l'IA. Décris tes envies et laisse-la faire !"
            : "Tu n'as pas encore de recette enregistrée. Crée ta première recette pour commencer !"}
      </Text>
      {hasFilters ? (
        <TouchableOpacity
          onPress={onReset}
          style={[
            tw`flex-row items-center gap-2 px-6 py-3 rounded-xl`,
            { backgroundColor: c.surfaceElevated },
          ]}
        >
          <Ionicons name="refresh-outline" size={18} color={c.textSecondary} />
          <Text variant="body" style={{ color: c.textSecondary, fontWeight: '600' }}>
            Réinitialiser les filtres
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onCreatePress}
          style={[
            tw`flex-row items-center gap-2 px-6 py-3 rounded-xl`,
            { backgroundColor: c.primary },
          ]}
        >
          <Ionicons name={isAi ? 'sparkles-outline' : 'add'} size={18} color="#FFFFFF" />
          <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {isAi ? 'Générer une recette' : 'Créer ma première recette'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
