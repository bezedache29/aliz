---
name: aliz-test
description: >
  Génère et maintient les tests Jest + RNTL pour le projet React Native "aliz".
  Se déclenche lorsque l'utilisateur demande d'ajouter des tests sur un fichier ou une feature, 
  ou lorsqu'un nouveau fichier métier (composant, hook, api, dto, mapper, model, atom) vient d'être créé/modifié dans le contexte de travail actuel.
  Toutes les suites de tests doivent être rédigées en anglais, mais les commentaires explicatifs internes doivent être rédigés en français. Ne jamais inclure de tags de citation ou d'identifiants de type dans le code ou les commentaires.
---

# Skill : aliz-test

Génère des tests Jest + RNTL adaptés à ce qui vient d'être créé ou modifié dans le projet aliz.
Ton rôle est d'être autonome : tu analyses le code produit, tu choisis le bon type de test, et tu l'écris sans attendre qu'on te le demande.

## Contraintes techniques absolues

Ces règles sont non-négociables dans ce projet :

- **`render` et `renderHook` sont async** (RNTL v14 + React 19) → toujours `await`
- **Imports** : utilise `@/` pour les chemins internes (ex: `@/components/button`)
- **Emplacement** : tests dans `__tests__/` en miroir de la structure source
  - `src/components/button.tsx` → `__tests__/components/button.test.tsx`
  - `src/hooks/use-user.ts` → `__tests__/hooks/use-user.test.ts`
  - `src/api/hooks/user/use-user.ts` → `__tests__/api/hooks/user/use-user.test.ts`
  - `src/api/endpoints/user/user.api.ts` → `__tests__/api/endpoints/user/user.api.test.ts`
  - `src/api/mappers/user/user.mapper.ts` → `__tests__/api/mappers/user/user.mapper.test.ts`
- **MMKV** : déjà mocké globalement via `__mocks__/react-native-mmkv.ts`, rien à faire
- **Pas de `screen` API** — utilise la destructuration du résultat de `render` / `renderHook`

## Détection du type de fichier

Analyse le fichier créé/modifié et applique la section correspondante :

| Si le fichier contient...                           | Type de test           |
| --------------------------------------------------- | ---------------------- |
| `export default function` / `export function` + JSX | Composant              |
| `export function use` dans `src/api/hooks/`         | Hook API (React Query) |
| `export function use` dans `src/hooks/`             | Hook métier / UI       |
| `axios.get/post/put/delete` ou `apiClient.`         | Service API            |
| `export interface` + suffixe `Dto` ou `Response`    | DTO                    |
| `export function` + `toModel` / `fromDto` / `map`   | Mapper                 |
| `export interface` + suffixe `Model`                | Model (via mapper)     |
| `atomWithMMKV` / `atom(` de jotai                   | Atom Jotai             |

Un fichier peut entrer dans plusieurs catégories — génère les tests pour chacune.

---

## Patterns de test par type

### Composant

```tsx
import { render, fireEvent } from '@testing-library/react-native'
import { MonComposant } from '@/components/mon-composant'

describe('MonComposant', () => {
  it('se rend sans erreur', async () => {
    const { getByText } = await render(<MonComposant />)
    expect(getByText('...')).toBeTruthy()
  })

  it('réagit à une interaction', async () => {
    const onPress = jest.fn()
    const { getByText } = await render(<MonComposant onPress={onPress} />)
    fireEvent.press(getByText('...'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

Teste : rendu par défaut, variations de props importantes, interactions utilisateur (press, change).
Ne pas tester les styles CSS — tester le comportement et le contenu.

### Hook métier / UI — `src/hooks/`

Hooks sans dépendance directe à l'API (logique UI, calculs, state local).

```tsx
import { renderHook, act } from '@testing-library/react-native';
import { useMonHook } from '@/src/hooks/use-mon-hook';

describe('useMonHook', () => {
  it('retourne la valeur initiale', async () => {
    const { result } = await renderHook(() => useMonHook());
    expect(result.current.value).toBe(...);
  });

  it('met à jour après action', async () => {
    const { result } = await renderHook(() => useMonHook());
    await act(async () => {
      result.current.doSomething();
    });
    expect(result.current.value).toBe(...);
  });
});
```

### Hook API (React Query) — `src/api/hooks/`

Hooks qui wrappent un endpoint via `useQuery` / `useMutation`. Toujours mocker axios + envelopper dans `QueryClientProvider`.

```tsx
import { renderHook, waitFor } from '@testing-library/react-native'
import axios from 'axios'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMonHookApi } from '@/src/api/hooks/mon-entity/use-mon-hook-api'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useMonHookApi', () => {
  afterEach(() => jest.clearAllMocks())

  it('retourne les données en cas de succès', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        /* dto mock */
      },
    })
    const { result } = await renderHook(() => useMonHookApi(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      /* model attendu */
    })
  })

  it('est en état pending au démarrage', async () => {
    // Promesse différée pour bloquer la résolution pendant le check isPending
    let resolveRequest!: (value: any) => void
    mockedAxios.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )
    const { result } = await renderHook(() => useMonHookApi(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(true)
    resolveRequest({
      data: {
        /* dto mock */
      },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("passe en état error en cas d'échec", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))
    const { result } = await renderHook(() => useMonHookApi(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

> **Piège `isPending`** : `await renderHook(...)` laisse le temps au mock axios de résoudre instantanément, donc `isPending` est déjà `false`. Utilise toujours une promesse différée pour tester l'état loading (voir pattern ci-dessus).

### Service API

```tsx
import axios from 'axios'
import { fetchUsers } from '@/api/users/users.service'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('fetchUsers', () => {
  it('retourne les données transformées en cas de succès', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        /* dto mock */
      },
    })
    const result = await fetchUsers()
    expect(result).toEqual(/* model attendu */)
  })

  it("propage l'erreur en cas d'échec", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))
    await expect(fetchUsers()).rejects.toThrow('Network error')
  })
})
```

### Mapper (DTO → Model)

```tsx
import { mapUserDtoToModel } from '@/api/users/user.mapper'
import type { UserDto } from '@/api/users/user.dto'

describe('mapUserDtoToModel', () => {
  const dto: UserDto = {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    // ... tous les champs du DTO
  }

  it('transforme correctement un DTO complet', () => {
    const model = mapUserDtoToModel(dto)
    expect(model).toEqual({
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      // ... champs du Model
    })
  })

  it('gère les champs optionnels absents', () => {
    const partial = { ...dto, optional_field: undefined }
    const model = mapUserDtoToModel(partial)
    expect(model.optionalField).toBeUndefined()
  })
})
```

Le mapper est le test le plus précieux du pattern DTO→Model : teste chaque transformation de champ.

### Atom Jotai

```tsx
import { createStore } from 'jotai'
import { monAtom } from '@/store/mon-atom'

describe('monAtom', () => {
  it('a la bonne valeur initiale', () => {
    const store = createStore()
    expect(store.get(monAtom)).toEqual(/* valeur initiale */)
  })

  it('se met à jour correctement', () => {
    const store = createStore()
    store.set(monAtom /* nouvelle valeur */)
    expect(store.get(monAtom)).toEqual(/* nouvelle valeur */)
  })
})
```

Pour les atoms avec `atomWithMMKV` : le mock MMKV (`__mocks__/react-native-mmkv.ts`) gère la persistance automatiquement — pas besoin de setup supplémentaire.

---

## Ce qu'il ne faut PAS tester

- Les styles visuels (couleurs, marges, fontSize) — ils ne vérifient pas le comportement
- Les implémentations internes (état interne privé d'un composant)
- Les types TypeScript — le compilateur s'en charge

## Ordre de priorité

Si plusieurs fichiers ont été modifiés, priorise dans cet ordre :

1. **Mappers** — le plus de valeur, zéro dépendance externe
2. **Endpoints API** — couverture des cas succès/erreur
3. **Hooks API** (`src/api/hooks/`) — wrappers React Query
4. **Hooks métier** (`src/hooks/`) — logique UI / métier pure
5. **Composants** — interactions utilisateur
6. **Atoms** — uniquement si la logique est non-triviale

## Après avoir écrit les tests

Lance `npx jest <fichier-de-test>` pour vérifier que les tests passent.
Si un test échoue à cause d'un module non mocké, ajoute le mock minimal nécessaire dans le fichier de test (avec `jest.mock()`).
Corrige jusqu'à ce que tous les tests soient verts avant de signaler la tâche comme terminée.
