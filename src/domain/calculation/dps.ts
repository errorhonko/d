import { calculateResistanceMitigation } from './defense'
import type {
  DamageTypeDps,
  PrismaticItemDpsContext,
  RangedCombatScenario,
  RangedDamageProfile,
  RangedDpsInput,
  RangedDpsResult,
} from './dps-model'

const DEFAULT_COMBAT_SCENARIO: RangedCombatScenario = {
  durationSeconds: 10,
  targetMaxHealth: 3000,
  targetCurrentHealthPercent: 100,
  activeUses: 1,
  energizedProcs: 1,
  targetDistance: 550,
  spellbladeProcs: 0,
  dashProcs: 0,
  weakpointProcs: 0,
  resistanceShredStacks: 0,
  uniqueBurnSources: 1,
  persistentAreaUptimePercent: 0,
}

function clean(value: number): number {
  const rounded = Math.round(value * 1_000_000_000_000) / 1_000_000_000_000
  return Object.is(rounded, -0) ? 0 : rounded
}

function finite(value: number, path: string): number {
  if (!Number.isFinite(value)) throw new Error(`${path} 必须是有限数字`)
  return value
}

function nonNegative(value: number, path: string): number {
  finite(value, path)
  if (value < 0) throw new Error(`${path} 不能小于 0`)
  return value
}

function profileValue(
  profile: RangedDamageProfile,
  key: keyof RangedDamageProfile,
): number {
  const value = profile[key] ?? 0
  if (typeof value !== 'number') throw new Error(`profile.${key} 必须是数字`)
  return nonNegative(value, `profile.${key}`)
}

export function calculateEffectiveResistance(
  resistance: number,
  percentPenetration: number,
  flatPenetration: number,
): number {
  finite(resistance, 'resistance')
  nonNegative(percentPenetration, 'percentPenetration')
  nonNegative(flatPenetration, 'flatPenetration')

  if (resistance <= 0) return resistance

  const percent = Math.min(percentPenetration, 100) / 100
  return clean(Math.max(0, resistance * (1 - percent) - flatPenetration))
}

function damageTypeDps(raw: number, resistance: number): DamageTypeDps {
  const mitigation = calculateResistanceMitigation(resistance)
  return {
    raw: clean(raw),
    damageMultiplier: mitigation.damageMultiplier,
    afterMitigation: clean(raw * mitigation.damageMultiplier),
  }
}

function levelValue(level1: number, level18: number, level: number): number {
  const clampedLevel = Math.min(Math.max(level, 1), 18)
  return level1 + ((level18 - level1) * (clampedLevel - 1)) / 17
}

function combatScenario(
  context: PrismaticItemDpsContext,
): RangedCombatScenario {
  const scenario = { ...DEFAULT_COMBAT_SCENARIO, ...context.scenario }
  nonNegative(scenario.durationSeconds, 'scenario.durationSeconds')
  if (scenario.durationSeconds === 0) {
    throw new Error('scenario.durationSeconds 必须大于 0')
  }
  nonNegative(scenario.targetMaxHealth, 'scenario.targetMaxHealth')
  nonNegative(
    scenario.targetCurrentHealthPercent,
    'scenario.targetCurrentHealthPercent',
  )
  nonNegative(scenario.activeUses, 'scenario.activeUses')
  nonNegative(scenario.energizedProcs, 'scenario.energizedProcs')
  nonNegative(scenario.targetDistance, 'scenario.targetDistance')
  nonNegative(scenario.spellbladeProcs, 'scenario.spellbladeProcs')
  nonNegative(scenario.dashProcs, 'scenario.dashProcs')
  nonNegative(scenario.weakpointProcs, 'scenario.weakpointProcs')
  nonNegative(
    scenario.resistanceShredStacks,
    'scenario.resistanceShredStacks',
  )
  nonNegative(scenario.uniqueBurnSources, 'scenario.uniqueBurnSources')
  nonNegative(
    scenario.persistentAreaUptimePercent,
    'scenario.persistentAreaUptimePercent',
  )
  return {
    ...scenario,
    targetCurrentHealthPercent: Math.min(
      scenario.targetCurrentHealthPercent,
      100,
    ),
    persistentAreaUptimePercent: Math.min(
      scenario.persistentAreaUptimePercent,
      100,
    ),
  }
}

function itemCriticalStrikeDamageBonus(
  context: PrismaticItemDpsContext | undefined,
  criticalStrikeChance: number,
): number {
  const effect = context?.item.dpsEffects?.find(
    (candidate) => candidate.kind === 'sword_of_the_divine',
  )
  if (effect?.kind !== 'sword_of_the_divine') return 0

  const benefitingChance = Math.min(
    criticalStrikeChance,
    effect.benefitingCritChanceCap,
  )
  // 被动在 0 到最大额外暴伤间均匀随机，期望值为最大值的一半。
  return (
    benefitingChance *
    effect.critChanceToMaximumBonusCritDamage *
    0.5
  )
}

function prismaticItemDps(
  context: PrismaticItemDpsContext | undefined,
  input: {
    readonly stats: RangedDpsInput['stats']
    readonly attacksPerSecond: number
    readonly attackDamageRatio: number
    readonly criticalStrikeChance: number
    readonly criticalStrikeDamage: number
  },
): {
  physicalRawDps: number
  magicRawDps: number
  trueDps: number
  basicAttackDamageMultiplier: number
  armorReduction: number
  magicResistanceReduction: number
} {
  if (context === undefined) {
    return {
      physicalRawDps: 0,
      magicRawDps: 0,
      trueDps: 0,
      basicAttackDamageMultiplier: 1,
      armorReduction: 0,
      magicResistanceReduction: 0,
    }
  }

  const scenario = combatScenario(context)
  const duration = scenario.durationSeconds
  let physicalRawDps = 0
  let magicRawDps = 0
  let trueDps = 0
  let basicAttackDamageMultiplier = 1
  let armorReduction = 0
  let magicResistanceReduction = 0
  const bonusAttackDamage = Math.max(
    0,
    input.stats.attack_damage - context.baseAttackDamage,
  )
  const bonusArmor = Math.max(0, input.stats.armor - context.baseArmor)
  const bonusHealth = Math.max(0, input.stats.health - context.baseHealth)

  for (const effect of context.item.dpsEffects ?? []) {
    switch (effect.kind) {
      case 'hamstringer_bleed': {
        const criticalAttackDamage =
          input.stats.attack_damage *
          input.attackDamageRatio *
          (input.criticalStrikeDamage / 100)
        const bleedPerCriticalStrike =
          levelValue(
            effect.level1Damage,
            effect.level18Damage,
            context.championLevel,
          ) +
          criticalAttackDamage * effect.triggeringDamageRatio
        physicalRawDps +=
          bleedPerCriticalStrike *
          input.attacksPerSecond *
          (input.criticalStrikeChance / 100)
        break
      }
      case 'galeforce_active': {
        const levelDamage =
          context.championLevel < 9
            ? effect.level1Damage
            : effect.level9Damage +
              effect.damagePerLevelAfter9 * (context.championLevel - 9)
        const missingHealthPercent = 100 - scenario.targetCurrentHealthPercent
        const ampSpan = 100 - effect.maximumAmpAtTargetHealthPercent
        const missingHealthAmp =
          ampSpan === 0
            ? effect.maximumMissingHealthAmp
            : Math.min(missingHealthPercent / ampSpan, 1) *
              effect.maximumMissingHealthAmp
        physicalRawDps +=
          ((levelDamage + bonusAttackDamage * effect.bonusAttackDamageRatio) *
            (1 + missingHealthAmp) *
            scenario.activeUses) /
          duration
        break
      }
      case 'reapers_toll': {
        const expectedHits = input.attacksPerSecond * duration
        const averagePriorHits = Math.max(0, (expectedHits - 1) / 2)
        const averageRatio =
          effect.rangedMaxHealthRatio +
          effect.ratioIncreasePerHit * averagePriorHits
        trueDps +=
          scenario.targetMaxHealth * averageRatio * input.attacksPerSecond
        break
      }
      case 'sword_of_the_divine':
        break
      case 'fulmination':
        magicRawDps +=
          (scenario.targetMaxHealth *
            (scenario.targetCurrentHealthPercent / 100) *
            effect.targetCurrentHealthRatio *
            scenario.energizedProcs) /
          duration
        break
      case 'hexbolt_companion': {
        const periodicCasts = duration / effect.cooldownSeconds
        const totalCasts = periodicCasts + scenario.energizedProcs
        physicalRawDps +=
          (levelValue(
            effect.level1Damage,
            effect.level18Damage,
            context.championLevel,
          ) *
            totalCasts) /
          duration
        break
      }
      case 'distance_attack_amp': {
        const progress = Math.min(
          Math.max(
            (scenario.targetDistance - effect.minimumDistance) /
              (effect.maximumDistance - effect.minimumDistance),
            0,
          ),
          1,
        )
        basicAttackDamageMultiplier *= 1 + effect.maximumDamageAmp * progress
        break
      }
      case 'spellblade': {
        const damagePerProc = Math.max(
          context.baseAttackDamage * effect.baseAttackDamageRatio,
          scenario.targetMaxHealth * effect.rangedTargetMaxHealthRatio,
        )
        physicalRawDps +=
          (damagePerProc * scenario.spellbladeProcs) / duration
        break
      }
      case 'true_on_hit_armor_scaling':
        trueDps +=
          (levelValue(
            effect.level1Damage,
            effect.level18Damage,
            context.championLevel,
          ) +
            bonusArmor * effect.bonusArmorRatio) *
          input.attacksPerSecond
        break
      case 'magic_on_hit_bonus_health_scaling':
        magicRawDps +=
          (effect.baseDamage + bonusHealth * effect.bonusHealthRatio) *
          input.attacksPerSecond
        break
      case 'lightning_rod': {
        const casts = duration / effect.cooldownSeconds
        magicRawDps +=
          ((levelValue(
            effect.level1Damage,
            effect.level18Damage,
            context.championLevel,
          ) +
            input.stats.ability_power * effect.abilityPowerRatio +
            bonusAttackDamage * effect.bonusAttackDamageRatio) *
            casts) /
          duration
        break
      }
      case 'prowlers_claw':
        physicalRawDps +=
          (scenario.targetMaxHealth *
            (effect.targetMaxHealthRatio +
              bonusAttackDamage * effect.ratioPerBonusAttackDamage) *
            scenario.dashProcs) /
          duration
        break
      case 'flat_resistance_shred': {
        const reduction =
          effect.amountPerStack *
          Math.min(scenario.resistanceShredStacks, effect.maximumStacks)
        armorReduction += reduction
        magicResistanceReduction += reduction
        break
      }
      case 'runecarver': {
        const procs = scenario.energizedProcs
        const runeHits = (procs * (procs + 1)) / 2
        const damagePerRune =
          levelValue(
            effect.level1Damage,
            effect.level18Damage,
            context.championLevel,
          ) +
          bonusAttackDamage * effect.bonusAttackDamageRatio +
          input.stats.ability_power * effect.abilityPowerRatio +
          bonusHealth * effect.bonusHealthRatio
        magicRawDps += (damagePerRune * runeHits) / duration
        break
      }
      case 'weakpoint':
        trueDps +=
          (scenario.targetMaxHealth *
            (effect.baseTargetMaxHealthRatio +
              input.stats.attack_damage * effect.ratioPerAttackDamage +
              input.stats.ability_power * effect.ratioPerAbilityPower) *
            scenario.weakpointProcs) /
          duration
        break
      case 'goredrinker_active':
        physicalRawDps +=
          (context.baseAttackDamage *
            effect.baseAttackDamageRatio *
            scenario.activeUses) /
          duration
        break
      case 'pyromancers_cloak': {
        const burnProcs = Math.ceil(duration / effect.cooldownSeconds)
        magicRawDps +=
          (levelValue(
            effect.level1BurnDamage,
            effect.level18BurnDamage,
            context.championLevel,
          ) *
            burnProcs) /
          duration
        const areaDps =
          effect.baseAreaDamagePerSecond +
          effect.areaDamagePerAdditionalBurnSource *
            Math.max(0, scenario.uniqueBurnSources - 1)
        magicRawDps +=
          areaDps * (scenario.persistentAreaUptimePercent / 100)
        break
      }
      case 'everfrost_active':
        magicRawDps +=
          ((effect.baseDamage +
            input.stats.ability_power * effect.abilityPowerRatio) *
            scenario.activeUses) /
          duration
        break
      case 'black_hole_active': {
        const activeDuration =
          effect.baseDurationSeconds +
          bonusHealth * effect.durationPerBonusHealth
        const dpsPerSecond =
          levelValue(
            effect.level1DamagePerSecond,
            effect.level18DamagePerSecond,
            context.championLevel,
          ) +
          input.stats.health * effect.maximumHealthRatioPerSecond
        magicRawDps +=
          (dpsPerSecond * activeDuration * scenario.activeUses) / duration
        break
      }
      case 'reality_fracture': {
        const casts = Math.ceil(duration / effect.cooldownSeconds)
        const damagePerGrub =
          effect.grubBaseDamage +
          bonusAttackDamage * effect.bonusAttackDamageRatio +
          input.stats.ability_power * effect.abilityPowerRatio
        magicRawDps +=
          (casts * effect.grubCount * damagePerGrub) / duration
        break
      }
    }
  }

  return {
    physicalRawDps: clean(physicalRawDps),
    magicRawDps: clean(magicRawDps),
    trueDps: clean(trueDps),
    basicAttackDamageMultiplier: clean(basicAttackDamageMultiplier),
    armorReduction: clean(armorReduction),
    magicResistanceReduction: clean(magicResistanceReduction),
  }
}

export function calculateRangedDps(input: RangedDpsInput): RangedDpsResult {
  const { stats, target } = input
  const profile = input.profile ?? {}
  const attacksPerSecond = nonNegative(stats.attack_speed, 'stats.attack_speed')
  const attackDamage = nonNegative(stats.attack_damage, 'stats.attack_damage')
  const attackDamageRatio = nonNegative(
    profile.attackDamageRatio ?? 1,
    'profile.attackDamageRatio',
  )
  const criticalStrikeChance = Math.min(
    nonNegative(stats.critical_strike_chance, 'stats.critical_strike_chance'),
    100,
  )
  const criticalStrikeDamage = nonNegative(
    stats.critical_strike_damage,
    'stats.critical_strike_damage',
  )
  const effectiveCriticalStrikeDamage =
    criticalStrikeDamage +
    itemCriticalStrikeDamageBonus(
      input.prismaticItem,
      criticalStrikeChance,
    )
  const basicAttackCanCrit = profile.basicAttackCanCrit ?? true
  const expectedCritMultiplier = basicAttackCanCrit
    ? 1 +
      (criticalStrikeChance / 100) *
        (effectiveCriticalStrikeDamage / 100 - 1)
    : 1

  const itemDps = prismaticItemDps(input.prismaticItem, {
    stats,
    attacksPerSecond,
    attackDamageRatio,
    criticalStrikeChance,
    criticalStrikeDamage: effectiveCriticalStrikeDamage,
  })

  const physicalPerAttack =
    attackDamage *
      attackDamageRatio *
      expectedCritMultiplier *
      itemDps.basicAttackDamageMultiplier +
    profileValue(profile, 'physicalOnHitPerAttack')
  const magicPerAttack = profileValue(profile, 'magicOnHitPerAttack')
  const truePerAttack = profileValue(profile, 'trueOnHitPerAttack')

  const rawPhysicalDps =
    physicalPerAttack * attacksPerSecond +
    profileValue(profile, 'additionalPhysicalDps') +
    itemDps.physicalRawDps
  const rawMagicDps =
    magicPerAttack * attacksPerSecond +
    profileValue(profile, 'additionalMagicDps') +
    itemDps.magicRawDps
  const rawTrueDps =
    truePerAttack * attacksPerSecond +
    profileValue(profile, 'additionalTrueDps') +
    itemDps.trueDps

  const effectiveTargetArmor = calculateEffectiveResistance(
    finite(target.armor, 'target.armor') - itemDps.armorReduction,
    nonNegative(
      stats.armor_penetration_percent,
      'stats.armor_penetration_percent',
    ),
    nonNegative(stats.lethality, 'stats.lethality'),
  )
  const effectiveTargetMagicResistance = calculateEffectiveResistance(
    finite(target.magicResistance, 'target.magicResistance') -
      itemDps.magicResistanceReduction,
    nonNegative(
      stats.magic_penetration_percent,
      'stats.magic_penetration_percent',
    ),
    nonNegative(
      stats.magic_penetration_flat,
      'stats.magic_penetration_flat',
    ),
  )

  const physical = damageTypeDps(rawPhysicalDps, effectiveTargetArmor)
  const magic = damageTypeDps(rawMagicDps, effectiveTargetMagicResistance)
  const trueDamage: DamageTypeDps = {
    raw: clean(rawTrueDps),
    damageMultiplier: 1,
    afterMitigation: clean(rawTrueDps),
  }

  return {
    attacksPerSecond,
    expectedCritMultiplier: clean(expectedCritMultiplier),
    effectiveCriticalStrikeDamage: clean(effectiveCriticalStrikeDamage),
    effectiveTargetArmor,
    effectiveTargetMagicResistance,
    physical,
    magic,
    true: trueDamage,
    totalRawDps: clean(rawPhysicalDps + rawMagicDps + rawTrueDps),
    totalDps: clean(
      physical.afterMitigation +
        magic.afterMitigation +
      trueDamage.afterMitigation,
    ),
    prismaticItemContribution: itemDps,
  }
}
