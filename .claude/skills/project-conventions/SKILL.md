---
name: project-conventions
description: >
  Conventions du projet React Native "aliz" : stack technique, patterns obligatoires
  (API DTO→Mapper→Model, Jotai+MMKV), structure de dossiers et anti-patterns à éviter.
  Utilise cette skill dès qu'on crée ou modifie un fichier dans le projet aliz — composant,
  screen, hook, atom, mapper, modèle — ou dès qu'une question touche à la gestion
  d'état, au stockage, aux appels API, aux formulaires, à la navigation ou au nommage de fichiers.
  Ne pas attendre que l'utilisateur mentionne explicitement "conventions" pour déclencher la skill.
---

# Conventions du projet aliz

Ce document est la référence unique des règles à suivre dans le projet. Applique-les systématiquement sans attendre que l'utilisateur les rappelle.

## Stack technique

| Domaine                 | Librairie                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| State global            | Jotai (atoms dans `src/store/`)                                          |
| Stockage local persisté | MMKV via `react-native-mmkv`                                             |
| HTTP                    | Axios (une instance par API externe)                                     |
| Cache serveur           | React Query (`@tanstack/react-query`) — `QueryClient` dans `_layout.tsx` |
| Navigation              | Expo Router (file-based routing via `app/`)                              |
| Formulaires             | React Hook Form + Zod                                                    |
| Styles                  | twrnc (Tailwind React Native Classnames)                                 |
| Dates                   | Day.js                                                                   |
| Debug                   | Reactotron                                                               |
| Orientation             | Portrait uniquement (bloqué)                                             |

## Outillage Git

- **Commits** : Conventional Commits (via Commitlint) — `feat:`, `fix:`, `chore:`, etc.
- **Branches** : validées via `validate-branch-name`
- **Pre-commit** : Husky + lint-staged
- **TypeScript** : strict mode activé — pas de `any`, pas d'assertions non justifiées

---

## Pattern Jotai + MMKV — persistance des atoms

La distinction fondamentale entre les deux types d'atoms :

| Type              | Quand l'utiliser                                                                   |
| ----------------- | ---------------------------------------------------------------------------------- |
| `atom()` de Jotai | State non persisté : état UI, données temporaires, navigation locale               |
| `atomWithMMKV()`  | State persisté entre sessions : token auth, préférences utilisateur, onboarding... |

Le wrapper `atomWithMMKV` est défini dans `src/store/atomWithMMKV.ts` :

```ts
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import { createMMKV } from 'react-native-mmkv'

const storage = createMMKV()

function getItem(key: string): string | null {
  const value = storage.getString(key)
  return value ? value : null
}

function setItem(key: string, value: string): void {
  storage.set(key, value)
}

function removeItem(key: string): void {
  storage.remove(key)
}

function subscribe(key: string, callback: (value: string | null) => void): () => void {
  const listener = (changedKey: string) => {
    if (changedKey === key) callback(getItem(key))
  }
  const { remove } = storage.addOnValueChangedListener(listener)
  return () => remove()
}

export const atomWithMMKV = <T>(key: string, initialValue: T) =>
  atomWithStorage<T>(
    key,
    initialValue,
    createJSONStorage<T>(() => ({ getItem, setItem, removeItem, subscribe })),
    { getOnInit: true },
  )
```

**Utilisation** :

```ts
// src/store/authAtom.ts
import { atomWithMMKV } from './atomWithMMKV'

export const authTokenAtom = atomWithMMKV<string | null>('auth_token', null)
export const userPrefsAtom = atomWithMMKV('user_prefs', { theme: 'light' })
```

```ts
// state temporaire — pas besoin de persistance
import { atom } from 'jotai'
export const isMenuOpenAtom = atom(false)
```

Ne jamais utiliser AsyncStorage. Ne jamais utiliser `useState` pour du state global.

---

## Day.js — configuration et usage

Day.js est configuré une seule fois dans `src/config/dayjs.ts` avec la locale française et le plugin `isoWeek` :

```ts
// src/config/dayjs.ts
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)
dayjs.locale('fr')

export default dayjs
```

Ce fichier est importé en premier dans `app/_layout.tsx` (`import '@/src/config/dayjs'`) pour garantir la configuration avant tout rendu.

**Règle d'import** : toujours importer `dayjs` depuis `@/src/config/dayjs`, jamais depuis `'dayjs'` directement. Le type `Dayjs` s'importe lui depuis `'dayjs'` car c'est un type, pas une valeur.

```ts
// ✅ Correct
import dayjs from '@/src/config/dayjs'
import { Dayjs } from 'dayjs'

// ❌ Interdit — locale et plugins non garantis
import dayjs from 'dayjs'
```

Plugins activés :

- `isoWeek` — semaines ISO (lundi = jour 1) : `dayjs().startOf('isoWeek')`, `dayjs().isoWeek()`

---

## Pattern API — un dossier par service

**Règle absolue** : chaque API externe ou backend dispose de son propre dossier racine dans `src/`. Pas de dossier `src/api/` générique.

Tous les dossiers API sont regroupés sous `src/apis/` :

| API             | Dossier                      | Client Axios                                  |
| --------------- | ---------------------------- | --------------------------------------------- |
| Notre backend   | `src/apis/backendApi/`       | `backendClient` (avec `axios-case-converter`) |
| OpenFoodFacts   | `src/apis/openFoodFactsApi/` | `offClient` (sans middleware)                 |
| CIQUAL (futur)  | `src/apis/ciqualApi/`        | à créer                                       |
| APRIFEL (futur) | `src/apis/aprifelApi/`       | à créer                                       |

Chaque dossier API suit la même structure interne :

```
src/apis/<nomApi>/
├── client.ts              # Instance Axios dédiée à cette API
├── dto/
│   └── <entity>/
│        └── <entity>.dto.ts
├── mappers/
│   └── <entity>/
│        └── <entity>.mapper.ts
└── hooks/
    └── <entity>/
         └── use<Entity>.ts   # Hook React Query qui appelle l'API
```

**Import Axios** : toujours utiliser le named export `{ create }` plutôt que le default :

```ts
// ✅ Correct
import { create } from 'axios'
export const offClient = create({ baseURL: '...' })

// ❌ Warning ESLint
import axios from 'axios'
export const offClient = axios.create({ baseURL: '...' })
```

**Pas de dossier `endpoints/`** — on utilise `hooks/` à la place. Chaque fichier hook contient :

1. La fonction `async` qui fait l'appel HTTP (fetcher)
2. Le hook `useQuery` / `useMutation` qui l'expose au composant

### Flux obligatoire

```
API externe → DTO → Mapper → Model → Hook React Query → Screen
```

Aucune donnée brute (DTO) ne doit atteindre un screen ou un composant.

### 1. DTO — `src/<nomApi>/dto/<entity>/<entity>.dto.ts`

Représente exactement ce que l'API renvoie. Pour le `backendApi`, `axios-case-converter` convertit automatiquement en camelCase, donc les DTOs sont en camelCase. Pour les APIs tierces (OpenFoodFacts, CIQUAL…), les clés restent telles quelles depuis l'API.

```ts
// src/apis/backendApi/dto/user/user.dto.ts
export interface UserDTO {
  id: number
  firstName: string // camelCase grâce à axios-case-converter
  lastName: string
  emailAddress: string
  createdAt: string
}

// src/apis/openFoodFactsApi/dto/food/food.dto.ts
export interface OpenFoodFactsProductDTO {
  code: string
  product_name?: string // snake_case natif de l'API
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
  }
}
```

### 2. Mapper — `src/<nomApi>/mappers/<entity>/<entity>.mapper.ts`

Convertit un DTO en Model. Nommage obligatoire : `sourceDTOtoEntityModel`.

```ts
// src/apis/openFoodFactsApi/mappers/food/food.mapper.ts
import { OpenFoodFactsProductDTO } from '@/src/apis/openFoodFactsApi/dto/food/food.dto'
import { FoodProduct } from '@/src/models/food/food.model'

export function openFoodFactsDTOtoFoodProduct(dto: OpenFoodFactsProductDTO): FoodProduct {
  return { ... }
}
```

### 3. Model — `src/models/<entity>/<entity>.model.ts`

Le seul type utilisé dans l'app (screens, composants, hooks, atoms). Indépendant de toute API.

```ts
// src/models/food/food.model.ts
export interface FoodProduct {
  id: string
  name: string
  source: 'openfoodfacts' | 'ciqual' | 'aprifel' | 'manual'
  per100g: { kcal: number; proteines: number; glucides: number; lipides: number }
}
```

### 4. Hook React Query — `src/<nomApi>/hooks/<entity>/use<Entity>.ts`

Contient la fonction fetch (privée) et le hook `useQuery` (exporté).

```ts
// src/apis/openFoodFactsApi/hooks/food/useFoodSearch.ts
import { useQuery } from '@tanstack/react-query'
import { offClient } from '@/src/apis/openFoodFactsApi/client'
import { openFoodFactsDTOtoFoodProduct } from '@/src/apis/openFoodFactsApi/mappers/food/food.mapper'

async function fetchFoodSearch(query: string) {
  const { data } = await offClient.get('/cgi/search.pl', { params: { ... } })
  return data.products.map(openFoodFactsDTOtoFoodProduct)
}

export function useFoodSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['openfoodfacts', 'food-search', query],
    queryFn: () => fetchFoodSearch(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}
```

### React Query — configuration globale

Le `QueryClient` est instancié une seule fois à la racine du module `app/_layout.tsx` (hors composant, pour ne pas être recréé à chaque render) :

```tsx
// app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={queryClient}>...</QueryClientProvider>
    </GestureHandlerRootView>
  )
}
```

---

## Structure de dossiers

La navigation est gérée par **Expo Router** via le dossier `app/`. Les screens vivent dans `src/screens/` et sont importés par les fichiers `app/`.

> **Règle absolue** : `app/` ne contient que deux types de fichiers :
>
> - `_layout.tsx` — déclaration de navigateurs (Stack, Tabs)
> - thin wrappers one-liner (`export { default } from '@/src/screens/...'`) pour les routes
>
> **Jamais** de composant, de JSX, de logique, ni de screen utilitaire directement dans `app/`. Un composant modal va dans `src/components/`, un screen de debug va dans `src/screens/` et s'importe là où c'est nécessaire.

```
aliz/
├── assets/
├── app/                          # Expo Router — routes file-based
│   ├── _layout.tsx               # Root layout (Stack, providers…)
│   ├── food-search.tsx           # Thin wrapper → src/screens/journal/FoodSearchScreen
│   ├── (drawer)/
│   │    ├── _layout.tsx
│   │    └── (tabs)/
│   │         ├── _layout.tsx
│   │         └── index.tsx
│   └── onboarding/
│        └── *.tsx
├── src/
│   ├── apis/                     # Toutes les intégrations API regroupées ici
│   │    ├── backendApi/          # Notre backend REST
│   │    │    ├── client.ts       # backendClient (axios + axios-case-converter)
│   │    │    ├── dto/<entity>/
│   │    │    ├── mappers/<entity>/
│   │    │    └── hooks/<entity>/
│   │    ├── openFoodFactsApi/    # API OpenFoodFacts
│   │    │    ├── client.ts       # offClient (axios nu, pas de middleware)
│   │    │    ├── dto/<entity>/
│   │    │    ├── mappers/<entity>/
│   │    │    └── hooks/<entity>/
│   │    └── <nomApi>/            # Même structure pour chaque API externe
│   ├── models/
│   │    └── <entity>/
│   │         └── <entity>.model.ts
│   ├── components/    # Composants génériques réutilisables (Button, Input…)
│   ├── features/      # Composants métier non réutilisables ailleurs
│   ├── hooks/         # Hooks génériques (useColors, useColorScheme…)
│   ├── screens/       # Organisés par domaine — importés par app/
│   │    └── <domaine>/
│   │         ├── <Domaine>ListScreen.tsx
│   │         ├── <Domaine>DetailScreen.tsx
│   │         └── <Domaine>Screen.tsx
│   ├── store/
│   │    ├── atomWithMMKV.ts
│   │    └── <feature>Atom.ts
│   ├── styles/
│   ├── types/         # Types utilitaires GÉNÉRIQUES uniquement
│   └── utils/
└── .env
```

### Navigation Expo Router

```tsx
import { useRouter, useLocalSearchParams } from 'expo-router'

const router = useRouter()
router.push('/food-search?mealType=Déjeuner')
router.replace('/(tabs)')
router.back()

const { mealType } = useLocalSearchParams<{ mealType: string }>()
```

### Nommage des screens

| Rôle             | Suffixe        | Exemple                   |
| ---------------- | -------------- | ------------------------- |
| Liste d'items    | `ListScreen`   | `AlimentListScreen.tsx`   |
| Détail d'un item | `DetailScreen` | `AlimentDetailScreen.tsx` |
| Screen générique | `Screen`       | `FoodSearchScreen.tsx`    |

---

## Imports — règle absolue

Tous les imports utilisent l'alias `@/`. Les chemins relatifs remontants (`../`) sont interdits et bloqués par ESLint.

```ts
// ✅ Correct
import { backendClient } from '@/src/apis/backendApi/client'
import { useFoodSearch } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodSearch'
import { FoodProduct } from '@/src/models/food/food.model'

// ❌ Interdit
import { useFoodSearch } from '../../../apis/openFoodFactsApi/hooks/food/useFoodSearch'
```

---

## Anti-patterns — à ne jamais faire

| À éviter                                     | À faire                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `fetch()` natif                              | `axios` via le client dédié à l'API concernée                              |
| Un seul dossier `src/api/` pour tout         | Un dossier par API : `src/apis/backendApi/`, `src/apis/openFoodFactsApi/`… |
| Dossier `endpoints/`                         | Dossier `hooks/` contenant les hooks React Query                           |
| DTO dans un screen/composant/hook            | Toujours passer par le mapper                                              |
| `useState` pour state global                 | `atom()` de Jotai                                                          |
| `atom()` pour état persisté                  | `atomWithMMKV()`                                                           |
| `AsyncStorage`                               | MMKV via `atomWithMMKV`                                                    |
| `moment.js`                                  | `Day.js`                                                                   |
| `import dayjs from 'dayjs'`                  | `import dayjs from '@/src/config/dayjs'`                                   |
| `useNavigation()` React Navigation           | `useRouter()` Expo Router                                                  |
| `navigation.navigate('Screen')`              | `router.push('/path')`                                                     |
| JSX ou logique dans `app/*.tsx`              | `app/` = `_layout.tsx` ou one-liner re-export uniquement                   |
| Imports relatifs remontants (`../`)          | Toujours `@/`                                                              |
| Screen hors de son dossier domaine           | Placer dans `screens/<domaine>/`                                           |
| Screen sans suffixe `List`/`Detail`/`Screen` | Respecter les suffixes                                                     |
| Interface métier dans `src/types/`           | `src/models/<entity>/<entity>.model.ts`                                    |
