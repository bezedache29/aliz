import { applyBurnedCalories } from '@/src/utils/nutrition'
import type { NutritionalGoals } from '@/src/models/nutrition/nutrition.model'

const baseGoals: NutritionalGoals = {
  bmr: 1700,
  tdeeBase: 2400,
  dailyKcalBase: 1900,
  dailyKcalAdjusted: 1900,
  macros: { proteines: 166, glucides: 155, lipides: 53 },
  estimatedWeeks: 10,
}

describe('applyBurnedCalories', () => {
  it("ne modifie rien si aucune calorie n'a été brûlée", () => {
    expect(applyBurnedCalories(baseGoals, 0)).toEqual(baseGoals)
    expect(applyBurnedCalories(baseGoals, -50)).toEqual(baseGoals)
  })

  it('ajoute les calories brûlées au budget kcal ajusté', () => {
    const result = applyBurnedCalories(baseGoals, 300)
    expect(result.dailyKcalAdjusted).toBe(2200)
  })

  it('redistribue les calories brûlées sur les 3 macros au même ratio que l’objectif de base', () => {
    const result = applyBurnedCalories(baseGoals, 300)

    // kcal de base : 166*4 + 155*4 + 53*9 = 664 + 620 + 477 = 1761
    // ratios : protéines 664/1761, glucides 620/1761, lipides 477/1761
    const totalKcal = 166 * 4 + 155 * 4 + 53 * 9
    const expectedProteines = Math.round(166 + (300 * ((166 * 4) / totalKcal)) / 4)
    const expectedGlucides = Math.round(155 + (300 * ((155 * 4) / totalKcal)) / 4)
    const expectedLipides = Math.round(53 + (300 * ((53 * 9) / totalKcal)) / 9)

    expect(result.macros).toEqual({
      proteines: expectedProteines,
      glucides: expectedGlucides,
      lipides: expectedLipides,
    })
  })

  it('ne conserve pas les autres champs modifiés (bmr, tdeeBase, dailyKcalBase, estimatedWeeks)', () => {
    const result = applyBurnedCalories(baseGoals, 300)
    expect(result.bmr).toBe(baseGoals.bmr)
    expect(result.tdeeBase).toBe(baseGoals.tdeeBase)
    expect(result.dailyKcalBase).toBe(baseGoals.dailyKcalBase)
    expect(result.estimatedWeeks).toBe(baseGoals.estimatedWeeks)
  })

  it('gère le cas où les macros de base sont toutes à zéro', () => {
    const zeroMacrosGoals: NutritionalGoals = {
      ...baseGoals,
      macros: { proteines: 0, glucides: 0, lipides: 0 },
    }
    const result = applyBurnedCalories(zeroMacrosGoals, 300)
    expect(result.dailyKcalAdjusted).toBe(2200)
    expect(result.macros).toEqual({ proteines: 0, glucides: 0, lipides: 0 })
  })
})
