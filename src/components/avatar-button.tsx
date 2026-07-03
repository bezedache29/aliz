import Ionicons from '@expo/vector-icons/Ionicons'
import { DrawerActions } from '@react-navigation/native'
import { useNavigation } from 'expo-router'
import { Pressable, View } from 'react-native'

import { useColors } from '@/src/hooks/use-colors'

export function AvatarButton() {
  const c = useColors()
  const navigation = useNavigation()

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={{ marginRight: 16 }}
      hitSlop={8}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: c.surfaceElevated,
          borderWidth: 1.5,
          borderColor: c.primary + '40',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="person" size={16} color={c.primary} />
      </View>
    </Pressable>
  )
}
