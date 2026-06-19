---
name: project-conventions
description: >
  Conventions du projet React Native "aliz" : stack technique, patterns obligatoires
  (API DTO→Mapper→Model, Jotai+MMKV), structure de dossiers et anti-patterns à éviter.
  Utilise cette skill dès qu'on crée ou modifie un fichier dans le projet aliz — composant,
  screen, hook, atom, endpoint, mapper, modèle — ou dès qu'une question touche à la gestion
  d'état, au stockage, aux appels API, aux formulaires, à la navigation ou au nommage de fichiers.
  Ne pas attendre que l'utilisateur mentionne explicitement "conventions" pour déclencher la skill.
---

# Conventions du projet aliz

Ce document est la référence unique des règles à suivre dans le projet. Applique-les systématiquement sans attendre que l'utilisateur les rappelle.

## Stack technique

| Domaine | Librairie |
|---|---|
| State global | Jotai (atoms dans `src/store/`) |
| Stockage local persisté | MMKV via `react-native-mmkv` |
| HTTP | Axios + `axios-case-converter` (snake_case ↔ camelCase automatique) |
| Cache serveur | React Query |
| Navigation | React Navigation |
| Formulaires | React Hook Form + Zod |
| Styles | twrnc (Tailwind React Native Classnames) |
| Dates | Day.js |
| Debug | Reactotron |
| Orientation | Portrait uniquement (bloqué) |

## Outillage Git

- **Commits** : Conventional Commits (via Commitlint) — `feat:`, `fix:`, `chore:`, etc.
- **Branches** : validées via `validate-branch-name`
- **Pre-commit** : Husky + lint-staged
- **TypeScript** : strict mode activé — pas de `any`, pas d'assertions non justifiées

---

## Pattern Jotai + MMKV — persistance des atoms

La distinction fondamentale entre les deux types d'atoms :

| Type | Quand l'utiliser |
|---|---|
| `atom()` de Jotai | State non persisté : état UI, données temporaires, navigation locale |
| `atomWithMMKV()` | State persisté entre sessions : token auth, préférences utilisateur, onboarding... |

Le wrapper `atomWithMMKV` est défini dans `src/store/atomWithMMKV.ts` :

```ts
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

function getItem(key: string): string | null {
  const value = storage.getString(key);
  return value ? value : null;
}

function setItem(key: string, value: string): void {
  storage.set(key, value);
}

function removeItem(key: string): void {
  storage.remove(key);
}

function subscribe(key: string, callback: (value: string | null) => void): () => void {
  const listener = (changedKey: string) => {
    if (changedKey === key) callback(getItem(key));
  };
  const { remove } = storage.addOnValueChangedListener(listener);
  return () => remove();
}

export const atomWithMMKV = <T>(key: string, initialValue: T) =>
  atomWithStorage<T>(
    key,
    initialValue,
    createJSONStorage<T>(() => ({ getItem, setItem, removeItem, subscribe })),
    { getOnInit: true }
  );
```

**Utilisation** :

```ts
// src/store/authAtom.ts
import { atomWithMMKV } from './atomWithMMKV';

export const authTokenAtom = atomWithMMKV<string | null>('auth_token', null);
export const userPrefsAtom = atomWithMMKV('user_prefs', { theme: 'light' });
```

```ts
// state temporaire — pas besoin de persistance
import { atom } from 'jotai';
export const isMenuOpenAtom = atom(false);
```

Ne jamais utiliser AsyncStorage. Ne jamais utiliser `useState` pour du state global.

---

## Pattern API — DTO → Mapper → Model

**Règle absolue** : aucune donnée brute de l'API ne doit atteindre un screen, composant ou hook directement. Le flux est toujours :

```
API externe → DTO → Mapper → Model → App
```

Ce pattern isole l'app des changements d'API : si le backend change, seul le mapper change.

### 1. DTO — `src/api/dto/<entity>/<entity>.dto.ts`

Représente exactement ce que l'API renvoie. Grâce à `axios-case-converter`, les clés sont déjà converties en camelCase à la réception, donc les DTOs utilisent le camelCase.

```ts
// src/api/dto/user/user.dto.ts
export interface UserDTO {
  id: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  createdAt: string;
}
```

### 2. Mapper — `src/api/mappers/<entity>/<entity>.mapper.ts`

Convertit un DTO en Model. Nommage obligatoire : `entityDTOtoEntityModel`.

```ts
// src/api/mappers/user/user.mapper.ts
import { UserDTO } from '@/api/dto/user/user.dto';
import { User } from '@/models/user/user.model';

export function userDTOtoUserModel(dto: UserDTO): User {
  return {
    id: dto.id,
    fullName: `${dto.firstName} ${dto.lastName}`,
    email: dto.emailAddress,
    createdAt: dayjs(dto.createdAt),
  };
}
```

### 3. Model — `src/models/<entity>/<entity>.model.ts`

Le seul type utilisé dans l'app (screens, composants, hooks, atoms).

```ts
// src/models/user/user.model.ts
import { Dayjs } from 'dayjs';

export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: Dayjs;
}
```

### 4. Endpoint — `src/api/endpoints/<entity>/<entity>.api.ts`

Appelle l'API, reçoit le DTO, applique le mapper.

```ts
// src/api/endpoints/user/user.api.ts
import { apiClient } from '@/api/client';
import { UserDTO } from '@/api/dto/user/user.dto';
import { userDTOtoUserModel } from '@/api/mappers/user/user.mapper';

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<UserDTO>('/me');
  return userDTOtoUserModel(data);
}
```

---

## Structure de dossiers

```
aliz/
├── assets/
├── src/
│   ├── api/
│   │    ├── client.ts                          # Instance Axios configurée
│   │    ├── dto/
│   │    │    └── <entity>/
│   │    │         └── <entity>.dto.ts
│   │    ├── endpoints/
│   │    │    └── <entity>/
│   │    │         └── <entity>.api.ts
│   │    └── mappers/
│   │         └── <entity>/
│   │              └── <entity>.mapper.ts
│   ├── models/
│   │    └── <entity>/
│   │         └── <entity>.model.ts
│   ├── components/    # Composants génériques réutilisables (Button, Input, Avatar…)
│   ├── features/      # Composants métier non réutilisables ailleurs (ex: UserCard)
│   ├── hooks/
│   ├── navigation/
│   ├── screens/       # Organisés par domaine
│   │    └── <domaine>/
│   │         ├── <Domaine>ListScreen.tsx       # Liste → PascalCase, suffixe "List" + "Screen"
│   │         ├── <Domaine>DetailScreen.tsx     # Détail → PascalCase, suffixe "Detail" + "Screen"
│   │         └── <Domaine>Screen.tsx           # Screen générique → PascalCase, suffixe "Screen"
│   ├── services/
│   ├── store/
│   │    ├── atomWithMMKV.ts                    # Wrapper Jotai + MMKV
│   │    └── <feature>Atom.ts                   # Ex: authAtom.ts, userPrefsAtom.ts
│   ├── styles/
│   ├── types/
│   └── utils/
├── App.js
└── .env
```

### Nommage des screens

Les screens sont en **PascalCase** et suivent un suffixe strict selon leur rôle :

| Rôle | Suffixe | Exemple |
|---|---|---|
| Liste d'items | `ListScreen` | `AlimentListScreen.tsx` |
| Détail d'un item | `DetailScreen` | `AlimentDetailScreen.tsx` |
| Screen générique | `Screen` | `ProfileScreen.tsx` |

Un screen sans son suffixe, sans PascalCase, ou hors de son dossier de domaine est une erreur.

---

## Imports — règle absolue

Tous les imports utilisent l'alias `@/`. Les chemins relatifs remontants (`../`) sont interdits et bloqués par ESLint.

```ts
// ✅ Correct
import { atomWithMMKV } from '@/src/store/atomWithMMKV'
import { UserDTO } from '@/src/api/dto/user/user.dto'

// ❌ Interdit
import { atomWithMMKV } from '../store/atomWithMMKV'
import { UserDTO } from '../../api/dto/user/user.dto'
```

---

## Anti-patterns — à ne jamais faire

| À éviter | À faire |
|---|---|
| `fetch()` natif | `axios` via `src/api/client.ts` |
| DTO dans un screen/composant/hook | Toujours passer par le mapper |
| `useState` pour state global | `atom()` de Jotai |
| `atom()` pour état persisté | `atomWithMMKV()` |
| `AsyncStorage` | MMKV via `atomWithMMKV` |
| `moment.js` | `Day.js` |
| Imports relatifs remontants (`../`) | Toujours `@/` |
| Screen hors de son dossier domaine | Placer dans `screens/<domaine>/` |
| Screen sans suffixe `List`/`Detail`/`Screen` | Respecter les suffixes |
| Screen en camelCase (`mealListScreen.tsx`) | PascalCase obligatoire (`MealListScreen.tsx`) |
