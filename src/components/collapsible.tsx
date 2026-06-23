import { PropsWithChildren, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import tw from 'twrnc'

import { ThemedText } from '@/src/components/themed-text'
import { ThemedView } from '@/src/components/themed-view'
import { IconSymbol } from '@/src/components/icon-symbol'
import { Colors } from '@/src/styles/theme'
import { useColorScheme } from '@/src/hooks/use-color-scheme'

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const theme = useColorScheme() ?? 'light'

  return (
    <ThemedView>
      <TouchableOpacity
        style={tw`flex-row items-center gap-1.5`}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={tw`mt-1.5 ml-6`}>{children}</ThemedView>}
    </ThemedView>
  )
}
