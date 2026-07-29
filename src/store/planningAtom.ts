import dayjs from '@/src/config/dayjs'
import { Dayjs } from 'dayjs'
import { atom } from 'jotai'

import { atomWithMMKV } from './atomWithMMKV'

export const selectedDateAtom = atom<Dayjs>(dayjs())

// Compteur incrémenté pour demander l'ouverture de la bottom sheet de génération
// hebdomadaire (montée une seule fois à la racine dans WeeklyPlanningCheck) depuis
// un endroit qui n'en a pas la ref (drawer, bandeau...).
export const openWeeklyGenerateSheetAtom = atom(0)

// Clés `${dateKey}:${mealType}:${course}` des suggestions IA rejetées dans le Journal,
// pour ne pas les faire réapparaître à chaque refresh (pas de statut "rejeté" côté backend).
export const rejectedSuggestionsAtom = atomWithMMKV<string[]>('journal_rejected_suggestions', [])
