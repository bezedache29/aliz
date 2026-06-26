import {
  ACTIVITY_LABELS,
  BMI_LABELS,
  computeBmi,
  getBmiCategory,
} from '@/src/models/profile/profile.model'

describe('computeBmi', () => {
  it('calcule correctement pour un profil standard', () => {
    // 85.5 / (1.78^2) = 26.985 → arrondi à 27
    expect(computeBmi(85.5, 178)).toBe(27)
  })

  it('arrondit à 1 décimale', () => {
    // 70 / (1.75^2) = 22.857 → 22.9
    expect(computeBmi(70, 175)).toBe(22.9)
  })

  it('calcule pour une personne légère', () => {
    // 50 / (1.75^2) = 16.326 → 16.3
    expect(computeBmi(50, 175)).toBe(16.3)
  })

  it('calcule pour une personne en surpoids', () => {
    // 80 / (1.75^2) = 26.122 → 26.1
    expect(computeBmi(80, 175)).toBe(26.1)
  })

  it('calcule pour une personne obèse', () => {
    // 100 / (1.75^2) = 32.653 → 32.7
    expect(computeBmi(100, 175)).toBe(32.7)
  })
})

describe('getBmiCategory', () => {
  it('retourne underweight pour un IMC < 18.5', () => {
    expect(getBmiCategory(16.3)).toBe('underweight')
    expect(getBmiCategory(18.4)).toBe('underweight')
  })

  it('retourne normal pour un IMC entre 18.5 et 24.9', () => {
    expect(getBmiCategory(18.5)).toBe('normal')
    expect(getBmiCategory(22.9)).toBe('normal')
    expect(getBmiCategory(24.9)).toBe('normal')
  })

  it('retourne overweight pour un IMC entre 25 et 29.9', () => {
    expect(getBmiCategory(25)).toBe('overweight')
    expect(getBmiCategory(26.1)).toBe('overweight')
    expect(getBmiCategory(29.9)).toBe('overweight')
  })

  it('retourne obese pour un IMC >= 30', () => {
    expect(getBmiCategory(30)).toBe('obese')
    expect(getBmiCategory(32.7)).toBe('obese')
  })
})

describe('BMI_LABELS', () => {
  it('contient une entrée pour chaque catégorie', () => {
    expect(BMI_LABELS.underweight).toBe('Maigreur')
    expect(BMI_LABELS.normal).toBe('Normal')
    expect(BMI_LABELS.overweight).toBe('Surpoids')
    expect(BMI_LABELS.obese).toBe('Obésité')
  })
})

describe('ACTIVITY_LABELS', () => {
  it("contient une entrée pour chaque niveau d'activité", () => {
    expect(ACTIVITY_LABELS.sedentary).toBeDefined()
    expect(ACTIVITY_LABELS.light).toBeDefined()
    expect(ACTIVITY_LABELS.moderate).toBeDefined()
    expect(ACTIVITY_LABELS.active).toBeDefined()
    expect(ACTIVITY_LABELS.very_active).toBeDefined()
  })

  it('retourne les bons labels en français', () => {
    expect(ACTIVITY_LABELS.sedentary).toBe('Sédentaire')
    expect(ACTIVITY_LABELS.moderate).toBe('Modérément actif')
    expect(ACTIVITY_LABELS.very_active).toBe('Extrêmement actif')
  })
})
