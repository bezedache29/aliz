import Ionicons from '@expo/vector-icons/Ionicons'
import { Drawer } from 'expo-router/drawer'

import { AvatarButton } from '@/src/components/avatar-button'
import { useColors } from '@/src/hooks/use-colors'

export default function DrawerLayout() {
  const c = useColors()

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: c.background,
          width: 280,
        },
        drawerActiveTintColor: c.primary,
        drawerInactiveTintColor: c.textSecondary,
        drawerActiveBackgroundColor: c.surfaceElevated,
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
          marginLeft: -8,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerTitle: '',
          headerLeft: () => null,
          headerRight: () => <AvatarButton />,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Réglages',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  )
}
