import type { WeightEntryDTO } from '@/src/apis/backendApi/dto/weight/weight.dto'
import { weightDTOtoWeightEntry } from '@/src/apis/backendApi/mappers/weight/weight.mapper'

const makeDTO = (overrides: Partial<WeightEntryDTO> = {}): WeightEntryDTO => ({
  id: 'w-1',
  weight: 75.5,
  bmi: 23.4,
  bodyfat: 18.2,
  water: 55.0,
  muscle: 32.1,
  bone: 3.4,
  bmr: 1800,
  protein: 14.0,
  bodyAge: 38,
  heartRate: 68,
  measuredAt: '2026-06-25T07:00:00',
  createdAt: '2026-06-25T07:00:01Z',
  updatedAt: '2026-06-25T07:00:01Z',
  ...overrides,
})

describe('weightDTOtoWeightEntry', () => {
  it('mappe tous les champs correctement', () => {
    const result = weightDTOtoWeightEntry(makeDTO())
    expect(result.id).toBe('w-1')
    expect(result.weight).toBe(75.5)
    expect(result.bmi).toBe(23.4)
    expect(result.bodyfat).toBe(18.2)
    expect(result.water).toBe(55.0)
    expect(result.muscle).toBe(32.1)
    expect(result.bone).toBe(3.4)
    expect(result.bmr).toBe(1800)
    expect(result.protein).toBe(14.0)
    expect(result.bodyAge).toBe(38)
    expect(result.heartRate).toBe(68)
  })

  it('normalise measuredAt en ajoutant .000Z', () => {
    const result = weightDTOtoWeightEntry(makeDTO({ measuredAt: '2026-06-25T07:00:00' }))
    expect(result.measuredAt).toBe('2026-06-25T07:00:00.000Z')
  })

  it('tronque measuredAt à 19 caractères avant .000Z', () => {
    // Cas où le backend envoie une date avec offset ou millisecondes
    const result = weightDTOtoWeightEntry(makeDTO({ measuredAt: '2026-06-25T07:00:00.123+02:00' }))
    expect(result.measuredAt).toBe('2026-06-25T07:00:00.000Z')
  })

  it('retourne une chaîne vide si measuredAt est null', () => {
    const result = weightDTOtoWeightEntry(makeDTO({ measuredAt: null as any }))
    expect(result.measuredAt).toBe('')
  })

  it('préserve les champs nullables à null', () => {
    const result = weightDTOtoWeightEntry(
      makeDTO({
        weight: null,
        bmi: null,
        bodyfat: null,
        water: null,
        muscle: null,
        bone: null,
        bmr: null,
        protein: null,
        bodyAge: null,
        heartRate: null,
      }),
    )
    expect(result.weight).toBeNull()
    expect(result.bmi).toBeNull()
    expect(result.bodyfat).toBeNull()
    expect(result.water).toBeNull()
    expect(result.muscle).toBeNull()
    expect(result.bone).toBeNull()
    expect(result.bmr).toBeNull()
    expect(result.protein).toBeNull()
    expect(result.bodyAge).toBeNull()
    expect(result.heartRate).toBeNull()
  })

  it("n'inclut pas les champs createdAt/updatedAt du DTO", () => {
    const result = weightDTOtoWeightEntry(makeDTO()) as any
    expect(result.createdAt).toBeUndefined()
    expect(result.updatedAt).toBeUndefined()
  })
})
