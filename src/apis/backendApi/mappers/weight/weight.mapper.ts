import type { WeightEntryDTO } from '@/src/apis/backendApi/dto/weight/weight.dto'
import type { WeightEntry } from '@/src/models/weight/weight.model'

export function weightDTOtoWeightEntry(dto: WeightEntryDTO): WeightEntry {
  return {
    id: dto.id,
    measuredAt: dto.measuredAt ? dto.measuredAt.slice(0, 19) + '.000Z' : '',
    weight: dto.weight,
    bmi: dto.bmi,
    bodyfat: dto.bodyfat,
    water: dto.water,
    muscle: dto.muscle,
    bone: dto.bone,
    bmr: dto.bmr,
    protein: dto.protein,
    bodyAge: dto.bodyAge,
    heartRate: dto.heartRate,
  }
}
