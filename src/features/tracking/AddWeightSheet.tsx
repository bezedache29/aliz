import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useState } from 'react'
import { Keyboard, View } from 'react-native'
import tw from 'twrnc'

import { Button } from '@/src/components/button'
import { Input } from '@/src/components/input'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

type Props = {
  onSave: (weight: number) => void
}

export const AddWeightSheet = forwardRef<BottomSheetModal, Props>(({ onSave }, ref) => {
  const c = useColors()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | undefined>()

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function handleSave() {
    const parsed = parseFloat(value.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
      setError('Poids invalide')
      return
    }
    Keyboard.dismiss()
    setValue('')
    setError(undefined)
    onSave(parsed)
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['40%']}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: c.surface }}
      handleIndicatorStyle={{ backgroundColor: c.border }}
      keyboardBehavior="fillParent"
    >
      <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-4`}>
        <Text variant="heading3" style={{ fontWeight: '700' }}>
          {"Peser aujourd'hui"}
        </Text>

        <Input
          label="Poids"
          unit="kg"
          keyboardType="decimal-pad"
          placeholder="75.5"
          value={value}
          onChangeText={(t) => {
            setValue(t)
            setError(undefined)
          }}
          error={error}
          autoFocus
        />

        <View style={tw`flex-row gap-3`}>
          <Button
            label="Annuler"
            variant="secondary"
            style={tw`flex-1`}
            onPress={() => {
              setValue('')
              setError(undefined)
              ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
            }}
          />
          <Button label="Enregistrer" style={tw`flex-1`} onPress={handleSave} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

AddWeightSheet.displayName = 'AddWeightSheet'
