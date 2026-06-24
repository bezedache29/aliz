import { Redirect } from 'expo-router'
import { useAtomValue } from 'jotai'

import JournalScreen from '@/src/screens/journal/JournalScreen'
import { onboardingAtom } from '@/src/store/onboardingAtom'

export default function JournalRoute() {
  const onboarding = useAtomValue(onboardingAtom)
  if (!onboarding.completed) {
    return <Redirect href="/onboarding" />
  }
  return <JournalScreen />
}
