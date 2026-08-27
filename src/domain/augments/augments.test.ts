import { describe, expect, it } from 'vitest'
import { arenaChampionCalculationInput } from '../champions'
import { championCatalog } from '../champions'
import { findPrismaticItem } from '../prismatic-items'
import { AD_AUGMENTS_CATALOG } from './catalog'
import { calculateAugmentBenefit } from './calculator'

describe('AD 强化符文全量计算模型深度核验', () => {
  const ashe = championCatalog.championsByKey.get('Ashe')!
  const arenaInput = arenaChampionCalculationInput({
    champion: ashe,
    level: 11,
    prismaticItem: findPrismaticItem(443069), // 断筋者
    statAnvils: [],
  })
  const dummyTarget = {
    armor: 100,
    magicResistance: 60,
  }

  // 1. 双刀流 (Dual Wield)
  it('双刀流：正确计算额外一击（次级攻击伤害）与攻速加成', () => {
    const dualWield = AD_AUGMENTS_CATALOG.find((a) => a.id === 'dualwield')!
    expect(dualWield.tier).toBe('prismatic')
    const resultLv1 = calculateAugmentBenefit(arenaInput, dualWield, dummyTarget, 1)
    const resultLv2 = calculateAugmentBenefit(arenaInput, dualWield, dummyTarget, 2)

    expect(resultLv1.currentOutcome.dpsPercentGain).toBeGreaterThan(40)
    expect(resultLv1.currentOutcome.statsDeltaSummary).toContain('额外发射一击')
    expect(resultLv1.currentOutcome.statsDeltaSummary).toContain('+40% 伤害')
    expect(resultLv1.currentOutcome.statsDeltaSummary).toContain('+15% 总攻击速度')

    expect(resultLv2.currentOutcome.statsDeltaSummary).toContain('+50% 伤害')
    expect(resultLv2.currentOutcome.statsDeltaSummary).toContain('+25% 总攻击速度')
  })

  // 2. 重量级打击手 (Heavy Hitter)
  it('重量级打击手：基于英雄真实最大生命值附带物理伤害', () => {
    const heavyHitter = AD_AUGMENTS_CATALOG.find((a) => a.id === 'heavyhitter')!
    const resultLv1 = calculateAugmentBenefit(arenaInput, heavyHitter, dummyTarget, 1)
    const resultLv2 = calculateAugmentBenefit(arenaInput, heavyHitter, dummyTarget, 2)

    expect(resultLv1.currentOutcome.dpsPercentGain).toBeGreaterThan(5)
    expect(resultLv1.currentOutcome.statsDeltaSummary).toContain('3.5% 最大生命值')
    expect(resultLv2.currentOutcome.dpsPercentGain).toBeGreaterThan(resultLv1.currentOutcome.dpsPercentGain)
    expect(resultLv2.currentOutcome.statsDeltaSummary).toContain('5% 最大生命值')
  })

  // 3. 闪电打击 (Lightning Strikes)
  it('闪电打击：总攻击速度按乘算放大，并在攻速达标时触发附伤', () => {
    const lightning = AD_AUGMENTS_CATALOG.find((a) => a.id === 'lightningstrikes')!
    expect(lightning.tier).toBe('gold')
    const result = calculateAugmentBenefit(arenaInput, lightning, dummyTarget, 1)

    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(15)
    expect(result.currentOutcome.statsDeltaSummary).toContain('+20% 总攻击速度')
  })

  // 4. 亮出你的剑 (Draw Your Sword)
  it('亮出你的剑：基于英雄基础攻击距离（艾希 600 射程）额外计算射程损失补正', () => {
    const drawSword = AD_AUGMENTS_CATALOG.find((a) => a.id === 'drawyoursword')!
    const result = calculateAugmentBenefit(arenaInput, drawSword, dummyTarget, 1)

    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(20)
    // 艾希 600 射程损失 (600-500)/150 * 30% = +20% 属性放大
    expect(result.currentOutcome.statsDeltaSummary).toContain('基于舍弃射程额外放大')
  })

  // 5. 瞄准脑袋 (Aim For The Head)
  it('瞄准脑袋：暴击封顶 50%，超出部分按比例转化为暴击伤害', () => {
    const aimHead = AD_AUGMENTS_CATALOG.find((a) => a.id === 'aimforthehead')!
    const result = calculateAugmentBenefit(arenaInput, aimHead, dummyTarget, 1)

    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(10)
    expect(result.currentOutcome.statsDeltaSummary).toContain('+25% 暴击几率')
    expect(result.currentOutcome.statsDeltaSummary).toContain('+25% 暴击伤害')
  })

  // 6. 残暴之力 (The Brutalizer)
  it('残暴之力（官方白银阶）：Lv1 20 AD, 10 急速, 10 穿甲', () => {
    const brutalizer = AD_AUGMENTS_CATALOG.find((a) => a.id === 'thebrutalizer')!
    expect(brutalizer.tier).toBe('silver')
    const result = calculateAugmentBenefit(arenaInput, brutalizer, dummyTarget, 1)
    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(5)
    expect(result.currentOutcome.statsDeltaSummary).toContain('20 攻击力')
    expect(result.currentOutcome.statsDeltaSummary).toContain('10 穿甲')
  })

  // 7. 易损 (Vulnerability)
  it('易损（官方金色阶）：提供 25% 暴击率，特效暴击倍率提升', () => {
    const vuln = AD_AUGMENTS_CATALOG.find((a) => a.id === 'vulnerability')!
    expect(vuln.tier).toBe('gold')
    const result = calculateAugmentBenefit(arenaInput, vuln, dummyTarget, 1)
    expect(result.currentOutcome.statsDeltaSummary).toContain('25% 暴击几率')
  })

  // 8. 歌利亚巨人 (Goliath)
  it('歌利亚巨人（棱彩阶）：Lv1 15% HP, 10% 适应之力', () => {
    const goliath = AD_AUGMENTS_CATALOG.find((a) => a.id === 'goliath')!
    expect(goliath.tier).toBe('prismatic')
    const result = calculateAugmentBenefit(arenaInput, goliath, dummyTarget, 1)
    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(5)
    expect(result.currentOutcome.statsDeltaSummary).toContain('10% 额外攻击力')
    expect(result.currentOutcome.statsDeltaSummary).toContain('15% 最大生命值')
  })

  // 9. 科学狂人 (Mad Scientist)
  it('科学狂人（棱彩阶）：30% 适应之力 (AD) 与 20% HP', () => {
    const madScientist = AD_AUGMENTS_CATALOG.find((a) => a.id === 'madscientist')!
    expect(madScientist.tier).toBe('prismatic')
    const result = calculateAugmentBenefit(arenaInput, madScientist, dummyTarget, 1)
    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(25)
    expect(result.currentOutcome.statsDeltaSummary).toContain('30% 额外攻击力')
    expect(result.currentOutcome.statsDeltaSummary).toContain('20% 最大生命值')
  })

  // 10. 灵巧 (Deft)
  it('灵巧（白银阶）：Lv1 60% 攻速', () => {
    const deft = AD_AUGMENTS_CATALOG.find((a) => a.id === 'deft')!
    expect(deft.tier).toBe('silver')
    const result = calculateAugmentBenefit(arenaInput, deft, dummyTarget, 1)
    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(10)
  })

  // 11. 穿针引线 (Thread The Needle)
  it('穿针引线（金色阶）：Lv1 15% 双穿', () => {
    const thread = AD_AUGMENTS_CATALOG.find((a) => a.id === 'threadtheneedle')!
    expect(thread.tier).toBe('gold')
    const result = calculateAugmentBenefit(arenaInput, thread, dummyTarget, 1)
    expect(result.currentOutcome.dpsPercentGain).toBeGreaterThan(5)
    expect(result.currentOutcome.statsDeltaSummary).toContain('15% 护甲穿透')
  })

  // 12. 关键暴击 (It's Critical)
  it('关键暴击（金色阶）：Lv1 50% 暴击率', () => {
    const crit = AD_AUGMENTS_CATALOG.find((a) => a.id === 'itscritical')!
    expect(crit.tier).toBe('gold')
    const result = calculateAugmentBenefit(arenaInput, crit, dummyTarget, 1)
    expect(result.currentOutcome.statsDeltaSummary).toContain('50% 暴击几率')
  })

  // 13. 渴血 (Goredrink)
  it('渴血（白银阶）：Lv1 15% 全能吸血', () => {
    const gore = AD_AUGMENTS_CATALOG.find((a) => a.id === 'goredrink')!
    expect(gore.tier).toBe('silver')
    expect(gore.levels[0].stats[0].value).toBe(15)
  })

  // 14. 大力 (Blunt Force)
  it('大力（白银阶）：Lv1 10% AD', () => {
    const blunt = AD_AUGMENTS_CATALOG.find((a) => a.id === 'bluntforce')!
    expect(blunt.tier).toBe('silver')
    expect(blunt.levels[0].stats[0].value).toBe(10)
  })
})
