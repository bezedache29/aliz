import Ionicons from '@expo/vector-icons/Ionicons'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import {
  ActivityIndicator,
  Switch,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native'
import tw from 'twrnc'

import { useCreateRecipe } from '@/src/apis/backendApi/hooks/recipes/useCreateRecipe'
import { useGenerateRecipe } from '@/src/apis/backendApi/hooks/recipes/useGenerateRecipe'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { RecipeCard } from '@/src/features/recipes/RecipeCard'
import { useColors } from '@/src/hooks/use-colors'
import { Recipe } from '@/src/models/recipe/recipe.model'

type Props = {
  onSaved?: (recipe: Recipe) => void
  saveLabel?: string
}

export function AiRecipeGenerator({ onSaved, saveLabel = 'Enregistrer' }: Props) {
  const c = useColors()
  const [prompt, setPrompt] = useState('')
  const [useStock, setUseStock] = useState(false)
  const [preview, setPreview] = useState<Omit<Recipe, 'id'> | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const { mutate: generateRecipe, isPending: isGenerating } = useGenerateRecipe()
  const { mutate: createRecipe, isPending: isSaving } = useCreateRecipe()

  function extractErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError(error)) {
      const data = error.response?.data
      if (data?.message) {
        const firstFieldError = data?.errors
          ? (Object.values(data.errors)[0] as string[] | undefined)?.[0]
          : undefined
        return firstFieldError ? `${data.message} (${firstFieldError})` : data.message
      }
    }
    return fallback
  }

  function handleGenerate() {
    setApiError(null)

    generateRecipe(
      { prompt: prompt.trim(), useStock },
      {
        onSuccess: (recipe) => setPreview(recipe),
        onError: (error) => {
          setApiError(extractErrorMessage(error, 'Impossible de générer une recette. Réessaie.'))
        },
      },
    )
  }

  function handleSave() {
    if (!preview) return
    setApiError(null)

    createRecipe(preview, {
      onSuccess: (recipe) => {
        ToastAndroid.show('Recette enregistrée', ToastAndroid.SHORT)
        setPreview(null)
        setPrompt('')
        onSaved?.(recipe)
      },
      onError: (error) => {
        setApiError(extractErrorMessage(error, "Impossible d'enregistrer la recette. Réessaie."))
      },
    })
  }

  const previewRecipe: Recipe | null = preview ? { ...preview, id: 'ai-preview' } : null

  return (
    <ScrollView contentContainerStyle={tw`px-4 pt-3 pb-28 gap-4`}>
      <View
        style={[
          tw`rounded-2xl p-3 gap-2`,
          { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
        ]}
      >
        <Text variant="caption" color="secondary" style={{ paddingHorizontal: 4 }}>
          Décris ce que tu as envie de manger (optionnel)
        </Text>
        <TextInput
          testID="ai-prompt-input"
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ex : un plat épicé et rapide avec du poulet — ou laisse vide"
          placeholderTextColor={c.textMuted}
          multiline
          style={[
            tw`rounded-xl p-3 text-base`,
            { backgroundColor: c.surfaceElevated, color: c.textPrimary, minHeight: 80 },
          ]}
        />
      </View>

      <TouchableOpacity
        testID="use-stock-toggle"
        activeOpacity={0.8}
        onPress={() => setUseStock((v) => !v)}
        style={[
          tw`flex-row items-center justify-between p-4 rounded-2xl`,
          { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
        ]}
      >
        <View style={tw`flex-1 gap-0.5 pr-3`}>
          <Text variant="body" style={{ fontWeight: '600' }}>
            Tenir compte de mon stock
          </Text>
          <Text variant="caption" color="muted">
            Priorise les aliments bientôt périmés et déjà en stock
          </Text>
        </View>
        <Switch
          testID="use-stock-switch"
          value={useStock}
          onValueChange={setUseStock}
          trackColor={{ false: c.border, true: c.primary }}
          thumbColor="#FFFFFF"
        />
      </TouchableOpacity>

      <TouchableOpacity
        testID="generate-button"
        activeOpacity={0.8}
        onPress={handleGenerate}
        disabled={isGenerating}
        style={[
          tw`flex-row items-center justify-center gap-2 py-4 rounded-2xl`,
          {
            backgroundColor: c.primary,
            opacity: isGenerating ? 0.6 : 1,
          },
        ]}
      >
        {isGenerating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
        )}
        <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
          {isGenerating ? 'Génération…' : 'Générer une recette'}
        </Text>
      </TouchableOpacity>

      {apiError && (
        <View
          testID="ai-error-banner"
          style={[
            tw`rounded-xl px-4 py-3`,
            { backgroundColor: c.danger + '20', borderWidth: 1, borderColor: c.danger },
          ]}
        >
          <Text variant="caption" style={{ color: c.danger }}>
            {apiError}
          </Text>
        </View>
      )}

      {previewRecipe && (
        <View style={tw`gap-3`}>
          <RecipeCard recipe={previewRecipe} />
          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              testID="regenerate-button"
              activeOpacity={0.8}
              onPress={handleGenerate}
              disabled={isGenerating || isSaving}
              style={[
                tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
                { backgroundColor: c.surfaceElevated, opacity: isGenerating || isSaving ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="refresh-outline" size={16} color={c.textSecondary} />
              <Text variant="body" style={{ color: c.textSecondary, fontWeight: '600' }}>
                Régénérer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="save-recipe-button"
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isGenerating || isSaving}
              style={[
                tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
                { backgroundColor: c.primary, opacity: isGenerating || isSaving ? 0.6 : 1 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
              )}
              <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {saveLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
