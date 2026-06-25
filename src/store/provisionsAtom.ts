import { StockItem } from '@/src/models/stock/stock-item.model'

import { atomWithMMKV } from './atomWithMMKV'

// TODO(backend): remplacer par useQuery/useMutation vers GET|POST /stock
// Lire   : GET /stock → StockItem[]
// Créer  : POST /stock → StockItem
// Modifier : PUT /stock/:id
// Supprimer : DELETE /stock/:id
export const provisionsAtom = atomWithMMKV<StockItem[]>('provisions', [])

export function addProvision(prev: StockItem[], item: StockItem): StockItem[] {
  return [item, ...prev]
}

export function updateProvision(prev: StockItem[], updated: StockItem): StockItem[] {
  return prev.map((it) => (it.id === updated.id ? updated : it))
}

export function removeProvision(prev: StockItem[], id: string): StockItem[] {
  return prev.filter((it) => it.id !== id)
}
