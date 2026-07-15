import { atom } from 'jotai'

// Reflète l'état réel de la permission OS (Android) — vérifié à chaque lancement de l'app,
// non persisté puisqu'il doit toujours représenter l'état système actuel, pas une préférence.
export const notificationPermissionGrantedAtom = atom(true)
