import { describe, expect, it } from 'vitest'
import { calculateRangedChampion } from './calculator'
import { calculateEffectiveResistance, calculateRangedDps } from './dps'

describe('calculateEffectiveResistance', () => {
  it('先应用百分比穿透，再应用固定穿透', () => {
    expect(calculateEffectiveResistance(100, 30, 20)).toBe(50)
    expect(calculateEffectiveResistance(10, 0, 20)).toBe(0)
  })

  it('穿透不影响已经为负数的抗性', () => {
    expect(calculateEffectiveResistance(-25, 30, 20)).toBe(-25)
  })
})

describe('calculateRangedDps', () => {
  it('计算普攻暴击期望和固定双抗下的三类秒伤', () => {
    const stats = calculateRangedChampion({
      initialStats: {
        attack_damage: 100,
        attack_speed: 2,
        critical_strike_chance: 25,
        critical_strike_damage: 175,
        armor_penetration_percent: 30,
        lethality: 20,
        magic_penetration_percent: 20,
        magic_penetration_flat: 10,
      },
      selections: [],
    }).finalStats

    const result = calculateRangedDps({
      stats,
      target: { armor: 100, magicResistance: 100 },
      profile: {
        magicOnHitPerAttack: 50,
        trueOnHitPerAttack: 10,
        additionalTrueDps: 5,
      },
    })

    expect(result.expectedCritMultiplier).toBe(1.1875)
    expect(result.effectiveTargetArmor).toBe(50)
    expect(result.effectiveTargetMagicResistance).toBe(70)
    expect(result.physical.raw).toBe(237.5)
    expect(result.physical.afterMitigation).toBeCloseTo(158.3333333333)
    expect(result.magic.raw).toBe(100)
    expect(result.magic.afterMitigation).toBeCloseTo(58.8235294118)
    expect(result.true.afterMitigation).toBe(25)
    expect(result.totalDps).toBeCloseTo(242.1568627451)
  })

  it('可关闭普攻暴击并拒绝负数伤害输入', () => {
    const stats = calculateRangedChampion({
      initialStats: {
        attack_damage: 100,
        attack_speed: 1,
        critical_strike_chance: 100,
        critical_strike_damage: 200,
      },
      selections: [],
    }).finalStats

    expect(
      calculateRangedDps({
        stats,
        target: { armor: 0, magicResistance: 0 },
        profile: { basicAttackCanCrit: false },
      }).totalDps,
    ).toBe(100)

    expect(() =>
      calculateRangedDps({
        stats,
        target: { armor: 0, magicResistance: 0 },
        profile: { magicOnHitPerAttack: -1 },
      }),
    ).toThrow('不能小于 0')
  })

  it('按总效能倍率放大一次主攻击附带的攻击特效', () => {
    const stats = calculateRangedChampion({
      initialStats: { attack_damage: 0, attack_speed: 2 },
      selections: [],
    }).finalStats

    const result = calculateRangedDps({
      stats,
      target: { armor: 0, magicResistance: 0 },
      profile: {
        onHitEffectiveness: 1.4,
        physicalOnHitPerAttack: 10,
        magicOnHitPerAttack: 20,
        trueOnHitPerAttack: 5,
      },
    })

    expect(result.physical.raw).toBe(28)
    expect(result.magic.raw).toBe(56)
    expect(result.true.raw).toBe(14)
    expect(result.totalDps).toBe(98)
  })
})
