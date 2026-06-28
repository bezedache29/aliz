import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useRef, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import type { MealType } from '@/src/models/planning/planning.model'

type Props = {
  mealType: MealType
  recipeName?: string
  onRegenerate: () => void
  onSendPrompt: (prompt: string) => void
}

export const MealEditSheet = forwardRef<BottomSheetModal, Props>(
  ({ mealType, recipeName, onRegenerate, onSendPrompt }, ref) => {
    const c = useColors()
    const [prompt, setPrompt] = useState('')
    const promptRef = useRef(prompt)

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    )

    const handleSend = useCallback(() => {
      const trimmed = promptRef.current.trim()
      if (!trimmed) return
      onSendPrompt(trimmed)
      setPrompt('')
      promptRef.current = ''
    }, [onSendPrompt])

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['52%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
        keyboardBehavior="extend"
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-4`}>
          {/* En-tête */}
          <View style={tw`gap-0.5`}>
            <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
              {mealType}
            </Text>
            {recipeName && (
              <Text variant="heading3" style={{ fontWeight: '700' }} numberOfLines={2}>
                {recipeName}
              </Text>
            )}
          </View>

          {/* Bouton régénérer */}
          <TouchableOpacity
            testID="regenerate-button"
            activeOpacity={0.8}
            onPress={onRegenerate}
            style={[
              tw`flex-row items-center gap-3 p-4 rounded-2xl`,
              { backgroundColor: c.primary + '15', borderWidth: 1, borderColor: c.primary + '30' },
            ]}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: c.primary + '25' },
              ]}
            >
              <Ionicons name="refresh-outline" size={20} color={c.primary} />
            </View>
            <View style={tw`flex-1`}>
              <Text variant="body" style={{ fontWeight: '600', color: c.primary }}>
                Régénérer
              </Text>
              <Text variant="caption" color="secondary">
                {"Nouvelle suggestion de l'IA"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={tw`flex-row items-center gap-3`}>
            <View style={[tw`flex-1 h-px`, { backgroundColor: c.border }]} />
            <Text variant="caption" color="muted">
              ou expliquer
            </Text>
            <View style={[tw`flex-1 h-px`, { backgroundColor: c.border }]} />
          </View>

          {/* Champ prompt */}
          <View
            style={[
              tw`flex-row items-end gap-2 p-3 rounded-2xl border`,
              { backgroundColor: c.surfaceElevated, borderColor: c.border },
            ]}
          >
            <TextInput
              testID="prompt-input"
              value={prompt}
              onChangeText={(t) => {
                promptRef.current = t
                setPrompt(t)
              }}
              placeholder="Ex : sans gluten, plus léger, je n'aime pas le poisson…"
              placeholderTextColor={c.textSecondary}
              multiline
              style={[tw`flex-1 text-sm pb-0`, { color: c.textPrimary, maxHeight: 80 }]}
            />
            <TouchableOpacity
              testID="send-prompt-button"
              onPress={handleSend}
              style={[
                tw`w-9 h-9 rounded-full items-center justify-center`,
                { backgroundColor: c.primary },
              ]}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

MealEditSheet.displayName = 'MealEditSheet'
