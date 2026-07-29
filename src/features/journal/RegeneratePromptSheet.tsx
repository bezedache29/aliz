import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

type Props = {
  onConfirm: (prompt: string) => void
}

export const RegeneratePromptSheet = forwardRef<BottomSheetModal, Props>(({ onConfirm }, ref) => {
  const c = useColors()
  const [prompt, setPrompt] = useState('')

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function handleConfirm() {
    onConfirm(prompt.trim())
    setPrompt('')
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['40%']}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.surface }}
      handleIndicatorStyle={{ backgroundColor: c.border }}
      keyboardBehavior="extend"
    >
      <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-4`}>
        <Text variant="heading3" style={{ fontWeight: '700' }}>
          Régénérer avec une consigne
        </Text>
        <View
          style={[
            tw`rounded-xl px-4`,
            { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border },
          ]}
        >
          <TextInput
            testID="regenerate-prompt-input"
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ex : sans lactose, plus léger..."
            placeholderTextColor={c.textMuted}
            multiline
            style={[tw`text-base py-3`, { color: c.textPrimary, minHeight: 80 }]}
          />
        </View>
        <TouchableOpacity
          testID="regenerate-prompt-confirm"
          activeOpacity={0.8}
          onPress={handleConfirm}
          style={[tw`p-4 rounded-2xl items-center`, { backgroundColor: c.primary }]}
        >
          <Text variant="body" style={{ fontWeight: '700', color: '#FFFFFF' }}>
            Régénérer
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

RegeneratePromptSheet.displayName = 'RegeneratePromptSheet'
