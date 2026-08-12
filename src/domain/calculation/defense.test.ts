import { describe, expect, it } from 'vitest'
import { calculateResistanceMitigation } from './defense'

describe('calculateResistanceMitigation', () => {
  it('正确计算零抗性和正抗性减伤', () => {
    expect(calculateResistanceMitigation(0)).toEqual({
      resistance: 0,
      damageMultiplier: 1,
      damageReductionPercent: 0,
      damageTakenPer100Raw: 100,
    })

    expect(calculateResistanceMitigation(100)).toEqual({
      resistance: 100,
      damageMultiplier: 0.5,
      damageReductionPercent: 50,
      damageTakenPer100Raw: 50,
    })

    expect(calculateResistanceMitigation(300).damageReductionPercent).toBe(75)
  })

  it('负抗性会放大受到的伤害', () => {
    const result = calculateResistanceMitigation(-50)

    expect(result.damageMultiplier).toBeCloseTo(4 / 3)
    expect(result.damageReductionPercent).toBeCloseTo(-100 / 3)
    expect(result.damageTakenPer100Raw).toBeCloseTo(400 / 3)
  })
})
