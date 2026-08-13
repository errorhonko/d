import { describe, expect, it } from 'vitest'
import { calculateRangedChampion, findStatAnvilOption } from '../calculation'
import { arenaChampionCalculationInput, championStatsAtLevel } from './calculation'
import { championCatalog } from './catalog'
import { findPrismaticItem } from '../prismatic-items'

describe('斗魂锻体英雄属性来源', () => {
  const ashe = championCatalog.championsByKey.get('Ashe')!

  it('使用英雄初始值和非线性等级成长计算 18 级属性', () => {
    const stats = championStatsAtLevel(ashe, 18)

    expect(stats.health).toBeCloseTo(2327)
    expect(stats.attack_damage).toBeCloseTo(118.5)
    expect(stats.attack_speed).toBeCloseTo(0.99358)
    expect(stats.armor).toBeCloseTo(104.2)
    expect(stats.magic_resistance).toBeCloseTo(52.1)
  })

  it('依次组合棱彩装备、属性锻造器和碎片之刃增幅', () => {
    const calculation = calculateRangedChampion(
      arenaChampionCalculationInput({
        champion: ashe,
        level: 18,
        prismaticItem: findPrismaticItem(447103),
        statAnvils: [
          { option: findStatAnvilOption('gold', 'attack_damage') },
          { option: findStatAnvilOption('gold', 'attack_speed') },
        ],
        shardbladeEffectivenessPercent: 120,
      }),
    )

    expect(calculation.initialStats.health).toBeCloseTo(2327)
    expect(calculation.initialStats.attack_damage).toBeCloseTo(188.5)
    expect(calculation.finalStats.attack_damage).toBeCloseTo(230.5)
    expect(calculation.finalStats.attack_speed).toBeCloseTo(1.26994)
    expect(calculation.steps.map((step) => step.effectivenessPercent)).toEqual([120, 120])
  })

  it('按装备表应用棱彩装备攻速，而不是接收手填数值', () => {
    const calculation = calculateRangedChampion(
      arenaChampionCalculationInput({
        champion: ashe,
        level: 18,
        prismaticItem: findPrismaticItem(447100),
        statAnvils: [],
      }),
    )

    expect(calculation.initialStats.attack_speed).toBeCloseTo(1.38838)
  })

  it('拒绝把碎片之刃增幅配置成削弱', () => {
    expect(() =>
      arenaChampionCalculationInput({
        champion: ashe,
        level: 18,
        statAnvils: [],
        shardbladeEffectivenessPercent: 99,
      }),
    ).toThrow('大于等于 100')
  })
})
