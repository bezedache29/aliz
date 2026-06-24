# RefreshControl — règle globale

Tout écran ou liste affichant de la data doit avoir un `RefreshControl` (pull-to-refresh).

- Hook : `useRefresh` depuis `@/src/hooks/use-refresh`
- Appliquer sur `ScrollView`, `FlatList` et `SectionList` via la prop `refreshControl`

```tsx
import { RefreshControl } from 'react-native'
import { useRefresh } from '@/src/hooks/use-refresh'

const { refreshing, refresh } = useRefresh()

<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
  }
/>
```

---

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Composants custom — toujours préférer aux imports react-native directs

| Composant    | Import à utiliser              | Ne pas importer depuis |
| ------------ | ------------------------------ | ---------------------- |
| `ScrollView` | `@/src/components/scroll-view` | `react-native`         |

Le `ScrollView` custom masque les scrollbars (`showsVerticalScrollIndicator={false}`, `showsHorizontalScrollIndicator={false}`) par défaut et accepte tous les props natifs.
