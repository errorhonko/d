import { describe, expect, it } from 'vitest'
import { calculateRangedAnvilBenefit, compareRangedAnvilBenefits } from './benefit'
import { findStatAnvilOption } from './calculator'

const champion = {
  initialStats: {
    health: 2000,
    attack_damage: 100,
    attack_speed: 1,
    critical_strike_chance: 25,
    critical_strike_damage: 175,
    armor: 50,
    magic_resistance: 50,
  },
  attackSpeedRatio: 0.65,
  selections: [],
} as const

const target = { armor: 100, magicResistance: 100 } as const

describe('calculateRangedAnvilBenefit', () => {
  it('计算攻击力和攻速碎片的 DPS 收益', () => {
    const attackDamage = calculateRangedAnvilBenefit({
      champion,
      target,
      candidate: { option: findStatAnvilOption('silver', 'attack_damage') },
    })
    const attackSpeed = calculateRangedAnvilBenefit({
      champion,
      target,
      candidate: { option: findStatAnvilOption('gold', 'attack_speed') },
    })

    expect(attackDamage.totalDps.before).toBeCloseTo(59.375)
    expect(attackDamage.totalDps.after).toBeCloseTo(68.28125)
    expect(attackDamage.totalDps.percent).toBeCloseTo(15)
    expect(attackSpeed.totalDps.percent).toBeCloseTo(22.75)
  })

  it('百分比护穿通过目标有效护甲转换成 DPS 收益', () => {
    const benefit = calculateRangedAnvilBenefit({
      champion,
      target,
      candidate: {
        option: findStatAnvilOption('prismatic', 'armor_penetration_percent'),
      },
    })

    expect(benefit.afterDps.effectiveTargetArmor).toBe(82.5)
    expect(benefit.totalDps.percent).toBeCloseTo(9.5890410959)
  })

  it('防御碎片不增加 DPS，但会增加对应有效生命', () => {
    const benefit = calculateRangedAnvilBenefit({
      champion,
      target,
      candidate: { option: findStatAnvilOption('gold', 'armor') },
    })

    expect(benefit.totalDps.absolute).toBe(0)
    expect(benefit.physicalEffectiveHealth.before).toBe(3000)
    expect(benefit.physicalEffectiveHealth.after).toBe(3900)
    expect(benefit.physicalEffectiveHealth.percent).toBe(30)
    expect(benefit.magicEffectiveHealth.absolute).toBe(0)
  })

  it('可以一次比较同一轮的多个候选项', () => {
    const results = compareRangedAnvilBenefits({
      champion,
      target,
      candidates: [
        { option: findStatAnvilOption('silver', 'attack_damage') },
        { option: findStatAnvilOption('silver', 'ability_power') },
      ],
    })

    expect(results).toHaveLength(2)
    expect(results[0]?.totalDps.percent).toBe(15)
    expect(results[1]?.totalDps.absolute).toBe(0)
  })
})
