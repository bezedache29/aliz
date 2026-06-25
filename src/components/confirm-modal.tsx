import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback } from 'react'
import { View } from 'react-native'
import tw from 'twrnc'

import { Button } from '@/src/components/button'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
}

export const ConfirmModal = forwardRef<BottomSheetModal, Props>(
  (
    {
      title,
      message,
      confirmLabel = 'Confirmer',
      cancelLabel = 'Annuler',
      variant = 'danger',
      onConfirm,
    },
    ref,
  ) => {
    const c = useColors()

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    )

    function handleConfirm() {
      ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
      onConfirm()
    }

    function handleCancel() {
      ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['30%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-5`}>
          <View style={tw`gap-1.5`}>
            <Text variant="heading3" style={{ fontWeight: '700' }}>
              {title}
            </Text>
            <Text variant="body" color="secondary">
              {message}
            </Text>
          </View>

          <View style={tw`flex-row gap-3`}>
            <Button
              label={cancelLabel}
              variant="primary"
              onPress={handleCancel}
              style={tw`flex-1`}
            />
            <Button
              label={confirmLabel}
              variant={variant}
              onPress={handleConfirm}
              style={tw`flex-1`}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

ConfirmModal.displayName = 'ConfirmModal'
