import { describe, expect, it } from 'vitest'
import { calculateRangedChampion, findStatAnvilOption } from './calculator'

const shooterStats = {
  health: 2000,
  attack_damage: 100,
  attack_speed: 0.7,
  armor: 100,
  magic_resistance: 60,
  movement_speed: 350,
  critical_strike_damage: 175,
  size: 100,
} as const

describe('calculateRangedChampion', () => {
  it('计算固定属性、攻速比率、生命增幅和远程全能吸血', () => {
    const result = calculateRangedChampion({
      initialStats: shooterStats,
      attackSpeedRatio: 0.65,
      selections: [
        {
          option: findStatAnvilOption('silver', 'attack_damage'),
          effectivenessPercent: 120,
        },
        { option: findStatAnvilOption('gold', 'attack_speed') },
        { option: findStatAnvilOption('gold', 'health') },
        { option: findStatAnvilOption('prismatic', 'health_and_size') },
        { option: findStatAnvilOption('prismatic', 'omnivamp') },
      ],
    })

    expect(result.attackType).toBe('ranged')
    expect(result.finalStats.attack_damage).toBe(118)
    expect(result.finalStats.attack_speed).toBeCloseTo(0.9275)
    expect(result.finalStats.health).toBeCloseTo(2731.25)
    expect(result.finalStats.maximum_health_from_all_sources).toBe(15)
    expect(result.finalStats.size).toBe(110)
    expect(result.finalStats.omnivamp).toBe(15)
    expect(result.finalDefense.armor.damageReductionPercent).toBe(50)
    expect(result.finalDefense.magicResistance.damageReductionPercent).toBe(37.5)
    expect(result.finalDefense.physicalEffectiveHealth).toBeCloseTo(5462.5)
    expect(result.steps).toHaveLength(5)
  })

  it('同类百分比穿透按剩余比例乘算', () => {
    const armorPenetration = findStatAnvilOption(
      'prismatic',
      'armor_penetration_percent',
    )
    const result = calculateRangedChampion({
      initialStats: shooterStats,
      selections: [
        { option: armorPenetration },
        { option: armorPenetration },
      ],
    })

    expect(result.finalStats.armor_penetration_percent).toBeCloseTo(31.9375)
  })

  it('经济碎片按所处回合计算且不受锻体效率放大', () => {
    const result = calculateRangedChampion({
      initialStats: shooterStats,
      selections: [
        {
          option: findStatAnvilOption('prismatic', 'fortune'),
          effectivenessPercent: 200,
          newRoundsAfterSelection: 3,
        },
        {
          option: findStatAnvilOption('prismatic', 'care_package'),
          effectivenessPercent: 200,
          roundsAlreadyLost: 2,
        },
      ],
    })

    expect(result.goldGained).toBe(3000)
    expect(result.steps[0]?.goldGained).toBe(2000)
    expect(result.steps[1]?.goldGained).toBe(1000)
    expect(result.finalStats).toEqual(result.initialStats)
  })

  it('拒绝负数锻体效率和不存在的选项', () => {
    expect(() =>
      calculateRangedChampion({
        initialStats: shooterStats,
        selections: [
          {
            option: findStatAnvilOption('silver', 'attack_damage'),
            effectivenessPercent: -1,
          },
        ],
      }),
    ).toThrow('不能小于 0')

    expect(() => findStatAnvilOption('gold', 'missing')).toThrow('找不到')
  })
})
