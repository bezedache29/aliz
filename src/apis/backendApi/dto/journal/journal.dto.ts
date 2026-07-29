import type { StockDeduction } from '@/src/models/stock/stock-item.model'

export interface JournalEntryDTO {
  id: string
  date: string
  mealType: string
  course?: string | null
  name: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  quantityG?: number | null
  per100gKcal?: number | null
  per100gProteines?: number | null
  per100gGlucides?: number | null
  per100gLipides?: number | null
  stockDeductions?: StockDeduction[] | null
  source: 'manual' | 'ai_suggestion'
  suggestionStatus?: 'accepted' | 'modified' | null
  createdAt: string
  updatedAt: string
}

export interface JournalEntriesResponseDTO {
  data: JournalEntryDTO[]
}

export interface JournalEntryResponseDTO {
  data: JournalEntryDTO
}

export interface CreateJournalEntryDTO {
  date: string
  mealType: string
  course?: string | null
  name: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  quantityG?: number | null
  per100gKcal?: number | null
  per100gProteines?: number | null
  per100gGlucides?: number | null
  per100gLipides?: number | null
  stockDeductions?: StockDeduction[] | null
  source?: 'manual' | 'ai_suggestion'
  suggestionStatus?: 'accepted' | 'modified' | null
}

export type UpdateJournalEntryDTO = Partial<CreateJournalEntryDTO>
