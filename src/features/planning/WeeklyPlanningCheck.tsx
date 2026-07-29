import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ToastAndroid, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { useRegenerateMealSlot } from '@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot'
import { Button } from '@/src/components/button'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { openWeeklyGenerateSheetAtom } from '@/src/store/planningAtom'

import { useMissingWeeklySuggestions } from './useMissingWeeklySuggestions'

export function WeeklyPlanningCheck() {
  const c = useColors()
  const { missingSlots, isLoading } = useMissingWeeklySuggestions()
  const regenerateMutation = useRegenerateMealSlot()
  const openRequest = useAtomValue(openWeeklyGenerateSheetAtom)

  const promptSheetRef = useRef<BottomSheetModal>(null)
  const progressSheetRef = useRef<BottomSheetModal>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [generating, setGenerating] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isLoading && missingSlots.length > 0 && !dismissed && !generating) {
      promptSheetRef.current?.present()
    }
  }, [isLoading, missingSlots.length, dismissed, generating])

  useEffect(() => {
    if (openRequest === 0) return
    if (missingSlots.length > 0) {
      promptSheetRef.current?.present()
    } else {
      ToastAndroid.show('Tous les repas de la semaine sont déjà générés', ToastAndroid.SHORT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function handleDismiss() {
    setDismissed(true)
    promptSheetRef.current?.dismiss()
  }

  async function handleGenerate() {
    promptSheetRef.current?.dismiss()
    // Marqué dès le lancement (et pas seulement sur "Plus tard") : sinon, si un créneau
    // échoue et reste "manquant", l'effet d'auto-présentation rouvre aussitôt la même sheet.
    setDismissed(true)
    setGenerating(true)
    setProgress({ done: 0, total: missingSlots.length })
    progressSheetRef.current?.present()

    let failures = 0
    for (const slot of missingSlots) {
      try {
        await regenerateMutation.mutateAsync({ dateKey: slot.dateKey, mealType: slot.mealType })
      } catch {
        failures += 1
      }
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
    }

    setGenerating(false)
    progressSheetRef.current?.dismiss()

    if (failures > 0) {
      ToastAndroid.show(
        `${missingSlots.length - failures} repas générés, ${failures} échec${failures > 1 ? 's' : ''}`,
        ToastAndroid.LONG,
      )
    } else {
      ToastAndroid.show('Repas de la semaine générés', ToastAndroid.SHORT)
    }
  }

  return (
    <>
      <BottomSheetModal
        ref={promptSheetRef}
        snapPoints={['38%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-4`}>
          <View style={tw`gap-1`}>
            <Text variant="heading3" style={{ fontWeight: '700' }}>
              Repas de la semaine
            </Text>
            <Text variant="body" color="secondary">
              {`Il manque des suggestions IA pour ${missingSlots.length > 1 ? 'plusieurs repas' : 'un repas'} d'ici dimanche.`}
            </Text>
          </View>
          <Button
            testID="generate-week-button"
            label="Générer mes repas"
            fullWidth
            onPress={handleGenerate}
          />
          <TouchableOpacity
            testID="dismiss-week-button"
            onPress={handleDismiss}
            hitSlop={8}
            style={tw`items-center`}
          >
            <Text variant="caption" color="muted" style={{ textDecorationLine: 'underline' }}>
              Plus tard
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={progressSheetRef}
        snapPoints={['30%']}
        enablePanDownToClose={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView style={tw`px-4 pt-2 pb-8 gap-4 items-center`}>
          <Text variant="heading3" style={{ fontWeight: '700' }}>
            Génération en cours…
          </Text>
          <Text testID="progress-label" variant="body" color="secondary">
            {`${progress.done} / ${progress.total} repas générés`}
          </Text>
          <View
            style={[
              tw`w-full h-2 rounded-full overflow-hidden`,
              { backgroundColor: c.surfaceElevated },
            ]}
          >
            <View
              style={[
                tw`h-full rounded-full`,
                {
                  backgroundColor: c.primary,
                  width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}
