import { describe, expect, it } from 'vitest'
import {
  calculateCategoryRoundAnvilBenefits,
  resolveArenaCategoryRoundTarget,
} from './arena-targets'

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

describe('resolveArenaCategoryRoundTarget', () => {
  it('默认返回大类与回合的双抗中位数', () => {
    const target = resolveArenaCategoryRoundTarget('Marksman', 10)

    expect(target.categoryZh).toBe('射手')
    expect(target.statistic).toBe('median')
    expect(target.armor).toBe(118)
    expect(target.magicResistance).toBe(74)
    expect(target.confidence).toBe('high')
    expect(target.observations).toBe(235)
  })

  it('允许选择分位数并拒绝不存在的回合', () => {
    const target = resolveArenaCategoryRoundTarget('Tank', 10, 'p75')
    expect(target.armor).toBe(target.distribution.armor.p75)
    expect(() => resolveArenaCategoryRoundTarget('Tank', 99)).toThrow(
      '没有 Tank 第 99 回合的双抗样本',
    )
  })
})

describe('calculateCategoryRoundAnvilBenefits', () => {
  it('比较指定品质的全部锻体候选', () => {
    const result = calculateCategoryRoundAnvilBenefits({
      champion,
      targetCategory: 'Marksman',
      round: 10,
      tier: 'silver',
    })

    expect(result.benefits).toHaveLength(13)
    expect(result.fixedDefenseTarget).toEqual({
      armor: 118,
      magicResistance: 74,
    })
    expect(
      result.benefits.find((benefit) => benefit.option.id === 'attack_damage')
        ?.totalDps.percent,
    ).toBeCloseTo(15)
  })

  it('百分比护穿对高护甲大类产生更高相对收益', () => {
    const marksman = calculateCategoryRoundAnvilBenefits({
      champion,
      targetCategory: 'Marksman',
      round: 10,
      tier: 'prismatic',
    })
    const tank = calculateCategoryRoundAnvilBenefits({
      champion,
      targetCategory: 'Tank',
      round: 10,
      tier: 'prismatic',
    })
    const penetrationBenefit = (result: typeof marksman) =>
      result.benefits.find(
        (benefit) => benefit.option.id === 'armor_penetration_percent',
      )?.totalDps.percent ?? 0

    expect(penetrationBenefit(tank)).toBeGreaterThan(
      penetrationBenefit(marksman),
    )
  })
})
