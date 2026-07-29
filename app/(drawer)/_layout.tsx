import Ionicons from '@expo/vector-icons/Ionicons'
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer'
import { Drawer } from 'expo-router/drawer'
import { useSetAtom } from 'jotai'

import { useColors } from '@/src/hooks/use-colors'
import { openWeeklyGenerateSheetAtom } from '@/src/store/planningAtom'

export default function DrawerLayout() {
  const c = useColors()
  const requestOpenWeeklyGenerate = useSetAtom(openWeeklyGenerateSheetAtom)

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
          <DrawerItem
            label="Générer les repas de la semaine"
            icon={({ color, size }) => (
              <Ionicons name="sparkles-outline" size={size} color={color} />
            )}
            inactiveTintColor={c.textSecondary}
            labelStyle={{ fontSize: 15, fontWeight: '500', marginLeft: -8 }}
            onPress={() => {
              props.navigation.closeDrawer()
              requestOpenWeeklyGenerate((prev) => prev + 1)
            }}
          />
        </DrawerContentScrollView>
      )}
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
          headerShown: false,
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
        name="preferences"
        options={{
          drawerLabel: 'Préférences alimentaires',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
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
