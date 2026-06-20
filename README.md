# Aliz — Nutrition personnalisée avec IA

> Application mobile de nutrition intelligente, orientée perte de poids et réalimentation.
> Génère des recettes adaptées à tes aliments disponibles, tes objectifs nutritionnels et ton activité physique du jour.

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue)
![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Backend](https://img.shields.io/badge/Backend-Laravel-FF2D20?logo=laravel)
![IA](https://img.shields.io/badge/IA-Claude%20Sonnet-8B5CF6)

---

## Présentation

Aliz calcule ton objectif calorique quotidien en croisant ton profil (BMR/TDEE), tes données de pesée Renpho et ton activité physique récupérée depuis Strava. L'IA génère ensuite des recettes qui respectent tes macros du jour, tes aliments disponibles et tes contraintes matérielles (cuisine en van).

### Fonctionnalités principales

| Fonctionnalité         | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| **Aujourd'hui**        | Objectif kcal du jour, activité détectée, déficit en temps réel         |
| **Mon frigo**          | Scan code-barres, recherche par nom, saisie manuelle                    |
| **Recettes IA**        | Génération selon tes aliments, tes macros et ton activité du jour       |
| **Favoris & Planning** | Sauvegarde des recettes, organisation sur 7 jours, liste de courses     |
| **Suivi**              | Courbe de poids, évolution masse grasse/musculaire, projection objectif |

### Calcul nutritionnel

L'objectif calorique est dynamique : il démarre à **1 500 kcal/jour** (repos) et monte par paliers selon les calories brûlées récupérées depuis Strava — toujours en déficit, jamais en maintien.

```
Calories brûlées       Objectif du jour
0    – 300 kcal    →   1 500 kcal
300  – 600 kcal    →   1 650 kcal  (+150)
600  – 1 000 kcal  →   1 800 kcal  (+300)
1 000 – 1 500 kcal →   2 000 kcal  (+500)
1 500+ kcal        →   2 200 kcal  (+700)
```

---

## Stack technique

### Application mobile

| Domaine            | Librairie                      |
| ------------------ | ------------------------------ |
| Framework          | React Native + Expo SDK 54     |
| Navigation         | Expo Router + React Navigation |
| State global       | Jotai                          |
| Persistance locale | MMKV (`react-native-mmkv`)     |
| Requêtes HTTP      | Axios + `axios-case-converter` |
| Cache serveur      | TanStack Query (React Query)   |
| Formulaires        | React Hook Form + Zod          |
| Styles             | twrnc (Tailwind React Native)  |
| Dates              | Day.js                         |
| Debug              | Reactotron                     |

### Backend (Laravel)

- Proxy API Anthropic (clé jamais exposée côté app)
- OAuth2 Strava — récupération et calcul des calories brûlées
- Base aliments : Ciqual (ANSES), Open Food Facts, Aprifel (scraping)
- Calcul TDEE dynamique côté serveur

### Sources de données

| Source              | Usage                                                           |
| ------------------- | --------------------------------------------------------------- |
| **Strava**          | Activités Garmin (Edge 1000, Forerunner 265) → calories brûlées |
| **Renpho**          | Pesées → poids + composition corporelle → recalcul BMR          |
| **Open Food Facts** | Produits avec code-barres                                       |
| **Ciqual ANSES**    | Viandes, poissons, féculents, laitages                          |
| **Aprifel**         | Fruits et légumes frais                                         |

---

## Architecture

```
App React Native (Expo)
  │
  ├── expo-camera          (scan code-barres)
  ├── Jotai + MMKV         (state global persisté)
  └── axios                (API Laravel)
          │
          ▼
    Backend Laravel
      ├── Proxy Anthropic API    (génération recettes IA)
      ├── OAuth2 Strava          (activités physiques)
      ├── Calcul TDEE            (BMR × coefficient + calories Strava)
      └── Base aliments          (Ciqual + Aprifel + OFF + manuel)
```

### Pattern données : DTO → Mapper → Model

Aucune donnée brute de l'API n'atteint l'interface. Le flux est toujours :

```
API → DTO → Mapper → Model → Composants / Hooks
```

---

## Installation

### Prérequis

- Node.js 18+
- Expo CLI
- Android Studio (émulateur) ou appareil Android physique

### Démarrage

```bash
# Installer les dépendances
npm install

# Lancer en développement
npx expo start

# Lancer directement sur Android
npx expo start --android

# Lancer directement sur iOS
npx expo start --ios
```

---

## Structure du projet

```
aliz/
├── app/                    # Routes Expo Router
├── assets/                 # Images, polices, icônes
├── src/
│   ├── api/
│   │   ├── client.ts       # Instance Axios
│   │   ├── dto/            # Interfaces des données brutes API
│   │   ├── endpoints/      # Appels HTTP
│   │   ├── hooks/          # Hooks React Query (wrappers réseau)
│   │   └── mappers/        # DTO → Model
│   ├── components/         # Composants génériques réutilisables
│   ├── features/           # Composants métier
│   ├── hooks/              # Hooks logique UI / métier
│   ├── models/             # Types métier de l'app
│   ├── navigation/
│   ├── screens/            # Organisés par domaine
│   ├── store/              # Atoms Jotai
│   ├── styles/
│   ├── types/
│   └── utils/
└── __tests__/              # Tests Jest + RNTL (miroir de src/)
```

---

## Qualité & Outillage

| Outil                    | Rôle                                          |
| ------------------------ | --------------------------------------------- |
| **Husky**                | Hooks Git automatiques                        |
| **lint-staged**          | ESLint + Prettier sur les fichiers stagés     |
| **Commitlint**           | Conventional Commits obligatoires             |
| **validate-branch-name** | Nommage de branches strict                    |
| **TypeScript strict**    | Pas de `any`, pas d'assertions non justifiées |
| **Jest + RNTL**          | Tests unitaires et composants                 |

### Hooks Git

```
pre-commit  →  tsc --noEmit + lint-staged
pre-push    →  validate-branch-name + jest
commit-msg  →  commitlint
```

### Convention de commits

```
feat: nouvelle fonctionnalité
fix: correction de bug
chore: config, dépendances, tooling
refactor: refactorisation sans nouveau comportement
test: ajout ou modification de tests
docs: documentation
```

---

## Roadmap MVP

- [ ] **Phase 1** — Onboarding + calcul BMR/TDEE/macros/paliers
- [ ] **Phase 2** — Frigo (scan + Ciqual + Aprifel + Open Food Facts)
- [ ] **Phase 3** — Génération recettes IA + favoris + planning
- [ ] **Phase 4** — Intégration Strava + ajustement calorique dynamique
- [ ] **Phase 5** — Suivi poids + courbes + projection objectif
- [ ] **Phase 6** — Publication Play Store (Android first)
