import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { ScreenHeader } from '@/src/components/screen-header'
import { AiRecipeGenerator } from '@/src/features/recipes/AiRecipeGenerator'
import { useColors } from '@/src/hooks/use-colors'

export default function RecipeGenerateScreen() {
  const c = useColors()
  const router = useRouter()

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScreenHeader title="Générer avec l'IA" />

      <AiRecipeGenerator onSaved={() => router.back()} />
    </SafeAreaView>
  )
}
