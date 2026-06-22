import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="strava" />
      <Stack.Screen name="weight" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="summary" />
    </Stack>
  )
}
