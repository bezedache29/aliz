import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { AiRecipeGenerator } from '@/src/features/recipes/AiRecipeGenerator'
import { useColors } from '@/src/hooks/use-colors'

export default function RecipeGenerateScreen() {
  const c = useColors()
  const router = useRouter()

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <View
        style={[
          tw`flex-row items-center gap-3 px-4 py-3`,
          { borderBottomWidth: 1, borderBottomColor: c.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <Text variant="heading3" style={{ fontWeight: '700' }}>
          {"Générer avec l'IA"}
        </Text>
      </View>

      <AiRecipeGenerator onSaved={() => router.back()} />
    </SafeAreaView>
  )
}
