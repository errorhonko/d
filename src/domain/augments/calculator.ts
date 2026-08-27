import type {
  RangedChampionCalculationInput,
  StatBlock,
} from '../calculation'
import { calculateRangedChampion } from '../calculation'
import { calculateRangedDps } from '../calculation'
import type { FixedDefenseTarget } from '../calculation'
import type {
  AugmentBenefitResult,
  AugmentDefinition,
  AugmentStackOutcome,
  AugmentStatModifier,
} from './model'

const STAT_LABELS_ZH: Record<string, string> = {
  attack_damage: '攻击力',
  attack_speed: '攻击速度',
  multiplicative_attack_speed: '总攻击速度',
  critical_strike_chance: '暴击几率',
  critical_strike_damage: '暴击伤害',
  armor_penetration_percent: '护甲穿透',
  lethality: '穿甲',
  ability_haste: '技能急速',
  omnivamp: '全能吸血',
  maximum_health_from_all_sources: '最大生命值',
  movement_speed: '移动速度',
  damage_multiplier: '全伤害加成',
  attack_damage_percent: '额外攻击力',
}

function formatModifiers(mods: readonly AugmentStatModifier[]): string {
  return mods
    .map((m) => {
      const name = STAT_LABELS_ZH[m.stat] ?? m.stat
      if (m.stat === 'damage_multiplier') {
        const sign = m.value >= 0 ? '+' : ''
        return `${sign}${Math.round(m.value * 100)}% ${name}`
      }
      if (
        m.stat === 'critical_strike_chance' ||
        m.stat === 'critical_strike_damage' ||
        m.stat === 'attack_speed' ||
        m.stat === 'multiplicative_attack_speed' ||
        m.stat === 'armor_penetration_percent' ||
        m.stat === 'attack_damage_percent' ||
        m.stat === 'maximum_health_from_all_sources' ||
        m.stat === 'omnivamp'
      ) {
        return `+${Math.round(m.value * 10) / 10}% ${name}`
      }
      return `+${m.value} ${name}`
    })
    .join('，')
}

type MutableStatBlock = { -readonly [K in keyof StatBlock]: StatBlock[K] }

function clampedChampionLevel(input: RangedChampionCalculationInput): number {
  return Math.min(18, Math.max(1, input.championLevel ?? 18))
}

function levelInterpolation(start: number, end: number, level: number): number {
  return start + ((end - start) * (level - 1)) / 17
}

function lethalTempoRangedAttackSpeedPerStack(level: number): number {
  return 8 + [3, 6, 9, 12].filter((breakpoint) => level >= breakpoint).length
}

export function calculateAugmentStackOutcome(
  baseInput: RangedChampionCalculationInput,
  augment: AugmentDefinition,
  target: FixedDefenseTarget,
  level: number,
  stacks: number,
): AugmentStackOutcome {
  // 1. 基准无此符文时的 DPS
  const baseCalc = calculateRangedChampion(baseInput)
  const baseDps = calculateRangedDps({
    stats: baseCalc.finalStats,
    target,
    prismaticItem: baseInput.prismaticItemDps,
  }).totalDps

  // 2. 收集此等级下的配置与基础属性
  const appliedModifiers: AugmentStatModifier[] = []
  const currentLevelConfig = augment.levels.find((l) => l.level === level) ?? augment.levels[0]!
  if (currentLevelConfig.stats) {
    appliedModifiers.push(...currentLevelConfig.stats)
  }

  // 3. 确定叠层配置（优先当前等级的 stacking）
  const activeStacking = currentLevelConfig.stacking ?? augment.stacking
  let appliedStacks = 0
  if (activeStacking) {
    const nonNegativeStacks = Math.max(0, Math.floor(stacks))
    appliedStacks =
      activeStacking.maxStacks === undefined
        ? nonNegativeStacks
        : Math.min(nonNegativeStacks, activeStacking.maxStacks)
    if (activeStacking.perStackStats && appliedStacks > 0) {
      for (const mod of activeStacking.perStackStats) {
        appliedModifiers.push({
          stat: mod.stat,
          value: mod.value * appliedStacks,
        })
      }
    }
    if (
      activeStacking.maxStacks !== undefined &&
      appliedStacks === activeStacking.maxStacks &&
      activeStacking.fullStackStats
    ) {
      appliedModifiers.push(...activeStacking.fullStackStats)
    }
  }

  // 4. 特殊机制处理：亮出你的剑 (基于攻击距离 500~650 获得额外 0%~30% 放大)
  let drawYourSwordRangeMod = 0
  if (augment.id === 'drawyoursword') {
    const originalRange = baseInput.attackRange ?? 550
    drawYourSwordRangeMod = Math.min(0.30, Math.max(0, ((originalRange - 500) / 150) * 0.30))
  }

  // 应用到计算面板（通过克隆并修改属性）
  const modifiedStats: MutableStatBlock = { ...baseCalc.finalStats }
  let extraDamageMultiplier = 1

  for (const mod of appliedModifiers) {
    let effectiveValue = mod.value
    if (augment.id === 'drawyoursword' && drawYourSwordRangeMod > 0) {
      effectiveValue = mod.value * (1 + drawYourSwordRangeMod)
    }

    if (mod.stat === 'damage_multiplier') {
      extraDamageMultiplier *= 1 + effectiveValue
    } else if (mod.stat === 'attack_damage_percent') {
      modifiedStats.attack_damage *= 1 + effectiveValue / 100
    } else if (mod.stat === 'multiplicative_attack_speed') {
      // 总攻击速度乘数：直接乘算放大当前总攻速
      modifiedStats.attack_speed *= 1 + effectiveValue / 100
    } else if (mod.stat === 'attack_speed') {
      // 额外攻速加成应用英雄攻速收益系数
      const ratio = baseInput.attackSpeedRatio ?? (baseInput.initialStats.attack_speed ?? 0.658)
      modifiedStats.attack_speed += ratio * (effectiveValue / 100)
    } else if (mod.stat === 'critical_strike_chance') {
      modifiedStats.critical_strike_chance = (modifiedStats.critical_strike_chance ?? 0) + effectiveValue
    } else if (mod.stat === 'critical_strike_damage') {
      modifiedStats.critical_strike_damage = (modifiedStats.critical_strike_damage ?? 75) + effectiveValue
    } else if (mod.stat === 'armor_penetration_percent') {
      const currentPen = modifiedStats.armor_penetration_percent ?? 0
      modifiedStats.armor_penetration_percent = 100 * (1 - (1 - currentPen / 100) * (1 - effectiveValue / 100))
    } else if (mod.stat === 'lethality') {
      modifiedStats.lethality = (modifiedStats.lethality ?? 0) + effectiveValue
    } else if (mod.stat === 'attack_damage') {
      modifiedStats.attack_damage += effectiveValue
    } else if (mod.stat === 'health') {
      modifiedStats.health += effectiveValue
    } else if (mod.stat === 'maximum_health_from_all_sources') {
      modifiedStats.health *= 1 + effectiveValue / 100
    }
  }

  const attackSpeedRatio =
    baseInput.attackSpeedRatio ?? (baseInput.initialStats.attack_speed ?? 0.658)
  const championLevel = clampedChampionLevel(baseInput)
  let lethalTempoStacks = 0
  let conquerorStacks = 0
  let tapDancerMovementSpeed = 0
  let tapDancerAttackSpeedPercent = 0

  if (augment.id === 'tapdancer') {
    const movementSpeedPerHit = level >= 2 ? 10 : 6
    tapDancerMovementSpeed = movementSpeedPerHit * appliedStacks
    modifiedStats.movement_speed += tapDancerMovementSpeed
    tapDancerAttackSpeedPercent = modifiedStats.movement_speed * 0.1
    modifiedStats.attack_speed +=
      attackSpeedRatio * (tapDancerAttackSpeedPercent / 100)
  }

  if (augment.id === 'symphonyofwar') {
    lethalTempoStacks = Math.min(appliedStacks, 6)
    conquerorStacks = Math.min(appliedStacks, 12)
    const attackSpeedPerStack =
      lethalTempoRangedAttackSpeedPerStack(championLevel)
    const adaptiveForcePerStack = levelInterpolation(
      3,
      5.5,
      championLevel,
    )
    modifiedStats.attack_speed +=
      attackSpeedRatio *
      ((attackSpeedPerStack * lethalTempoStacks) / 100)
    modifiedStats.attack_damage +=
      adaptiveForcePerStack * 0.6 * conquerorStacks
  }

  // 特殊机制：瞄准脑袋 (Aim For The Head)
  // 暴击几率封顶 50%，超出部分按比例转化为暴击伤害 (Lv1: 40%, Lv2: 60%)
  if (augment.id === 'aimforthehead') {
    const totalCrit = modifiedStats.critical_strike_chance ?? 0
    if (totalCrit > 50) {
      const overflow = totalCrit - 50
      const ratio = level >= 2 ? 0.6 : 0.4
      modifiedStats.critical_strike_chance = 50
      modifiedStats.critical_strike_damage = (modifiedStats.critical_strike_damage ?? 75) + overflow * ratio
    }
  } else {
    // 正常暴击率上限封顶 100%
    if (modifiedStats.critical_strike_chance !== undefined) {
      modifiedStats.critical_strike_chance = Math.min(100, modifiedStats.critical_strike_chance)
    }
  }

  // 特殊机制：双刀流 (Dual Wield)
  // 主普攻打 100% 满额伤害，额外发射一发次级攻击（额外一击），造成 40% (Lv1) / 50% (Lv2) / 60% (Lv3) 伤害
  let attackDamageRatio = 1
  if (augment.id === 'dualwield') {
    const extraRatio = level === 1 ? 0.40 : level === 2 ? 0.50 : 0.60
    attackDamageRatio = 1 + extraRatio
  }

  // 特殊机制：重量级打击手 (Heavy Hitter)
  // 每次普通攻击附带 3.5% (Lv1) / 5% (Lv2) 当前最大生命值的额外物理伤害
  let physicalOnHitPerAttack = 0
  if (augment.id === 'heavyhitter') {
    const hpRatio = level === 1 ? 0.035 : 0.05
    physicalOnHitPerAttack = (modifiedStats.health ?? 0) * hpRatio
  }
  if (augment.id === 'symphonyofwar' && lethalTempoStacks === 6) {
    const bonusAttackSpeedRatio = Math.max(
      0,
      modifiedStats.attack_speed / attackSpeedRatio - 1,
    )
    physicalOnHitPerAttack +=
      levelInterpolation(9, 30, championLevel) *
      (1 + bonusAttackSpeedRatio) *
      0.8
  }

  // 特殊机制：闪电打击 (Lightning Strikes)
  // 达到 3.5 攻速时，普攻附带 40 魔法伤害特效
  let magicOnHitPerAttack = 0
  if (augment.id === 'lightningstrikes' && (modifiedStats.attack_speed ?? 0) >= 3.5) {
    magicOnHitPerAttack = 40
  }

  // 5. 计算强化后的实际 DPS
  const newDpsResult = calculateRangedDps({
    stats: modifiedStats,
    target,
    profile: {
      attackDamageRatio,
      onHitEffectiveness: attackDamageRatio, // 对于双刀流，特效总效能正好也是 1 + extraRatio
      physicalOnHitPerAttack,
      magicOnHitPerAttack,
    },
    prismaticItem: baseInput.prismaticItemDps,
  })

  const finalDps = newDpsResult.totalDps * extraDamageMultiplier
  const dpsGain = finalDps - baseDps
  const dpsPercentGain = baseDps > 0 ? (dpsGain / baseDps) * 100 : 0

  let statsSummary = formatModifiers(appliedModifiers)
  if (augment.id === 'dualwield') {
    const extraPct = level === 1 ? '40%' : level === 2 ? '50%' : '60%'
    const totalPct = level === 1 ? '140%' : level === 2 ? '150%' : '160%'
    statsSummary = `额外发射一击（次级攻击造成 +${extraPct} 伤害，单次普攻共 ${totalPct} 伤害），${statsSummary}`
  } else if (augment.id === 'heavyhitter') {
    const hpRatioStr = level === 1 ? '3.5%' : '5%'
    statsSummary = `普攻附带 +${Math.round(physicalOnHitPerAttack)} 物理伤害 (${hpRatioStr} 最大生命值)`
  } else if (augment.id === 'drawyoursword' && drawYourSwordRangeMod > 0) {
    const bonusPctStr = Math.round(drawYourSwordRangeMod * 1000) / 10
    statsSummary = `${statsSummary} (基于舍弃射程额外放大 +${bonusPctStr}%)`
  } else if (augment.id === 'tapdancer') {
    statsSummary =
      `无限叠加：${appliedStacks} 次普攻提供 +${tapDancerMovementSpeed} 移动速度，` +
      `总移动速度转化 +${tapDancerAttackSpeedPercent.toFixed(1)}% 攻击速度`
  } else if (augment.id === 'symphonyofwar') {
    const attackSpeedPerStack =
      lethalTempoRangedAttackSpeedPerStack(championLevel)
    const adaptiveForcePerStack = levelInterpolation(3, 5.5, championLevel)
    const attackDamage = adaptiveForcePerStack * 0.6 * conquerorStacks
    statsSummary =
      `致命节奏 ${lethalTempoStacks}/6 层：+${(attackSpeedPerStack * lethalTempoStacks).toFixed(1)}% 攻击速度` +
      `${lethalTempoStacks === 6 ? `，满层弩箭每次攻击 +${physicalOnHitPerAttack.toFixed(1)} 原始物理伤害` : ''}；` +
      `征服者 ${conquerorStacks}/12 层：+${attackDamage.toFixed(1)} 攻击力` +
      `${conquerorStacks === 12 ? '，满层远程伤害转治疗 8%' : ''}`
  }

  return {
    level,
    stacks,
    dps: finalDps,
    dpsAbsoluteGain: dpsGain,
    dpsPercentGain,
    statsDeltaSummary: statsSummary || '无额外属性变更',
  }
}

export function calculateAugmentBenefit(
  baseInput: RangedChampionCalculationInput,
  augment: AugmentDefinition,
  target: FixedDefenseTarget,
  specifiedLevel?: number,
  specifiedStacks?: number,
): AugmentBenefitResult {
  const level = specifiedLevel ?? 1
  const currentLevelConfig = augment.levels.find((l) => l.level === level) ?? augment.levels[0]!
  const activeStacking = currentLevelConfig.stacking ?? augment.stacking
  const previewStacks = activeStacking?.previewStacks ?? []
  const fallbackStacks =
    activeStacking?.maxStacks ?? previewStacks.at(-1) ?? 0
  const defaultStacks =
    specifiedStacks !== undefined
      ? specifiedStacks
      : (activeStacking?.defaultStacks ?? fallbackStacks)

  // 生成阶梯（0层、半层、满层）
  const stackLadder: AugmentStackOutcome[] = []
  if (activeStacking) {
    const ladderLevels =
      previewStacks.length > 0
        ? [...previewStacks]
        : [
            0,
            Math.round((activeStacking.maxStacks ?? 0) / 2),
            activeStacking.maxStacks ?? 0,
          ]
    const uniqueLadderLevels = Array.from(new Set(ladderLevels)).sort(
      (a, b) => a - b,
    )
    for (const lvl of uniqueLadderLevels) {
      stackLadder.push(calculateAugmentStackOutcome(baseInput, augment, target, level, lvl))
    }
  } else {
    stackLadder.push(calculateAugmentStackOutcome(baseInput, augment, target, level, 0))
  }

  const currentOutcome = calculateAugmentStackOutcome(baseInput, augment, target, level, defaultStacks)

  return {
    augment,
    currentLevel: level,
    currentStacks: defaultStacks,
    currentOutcome,
    stackLadder,
  }
}
