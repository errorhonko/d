import { calculateResistanceMitigation } from './defense'
import type {
  DamageTypeDps,
  RangedDamageProfile,
  RangedDpsInput,
  RangedDpsResult,
} from './dps-model'

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
  const basicAttackCanCrit = profile.basicAttackCanCrit ?? true
  const expectedCritMultiplier = basicAttackCanCrit
    ? 1 +
      (criticalStrikeChance / 100) *
        (criticalStrikeDamage / 100 - 1)
    : 1

  const physicalPerAttack =
    attackDamage * attackDamageRatio * expectedCritMultiplier +
    profileValue(profile, 'physicalOnHitPerAttack')
  const magicPerAttack = profileValue(profile, 'magicOnHitPerAttack')
  const truePerAttack = profileValue(profile, 'trueOnHitPerAttack')

  const rawPhysicalDps =
    physicalPerAttack * attacksPerSecond +
    profileValue(profile, 'additionalPhysicalDps')
  const rawMagicDps =
    magicPerAttack * attacksPerSecond +
    profileValue(profile, 'additionalMagicDps')
  const rawTrueDps =
    truePerAttack * attacksPerSecond +
    profileValue(profile, 'additionalTrueDps')

  const effectiveTargetArmor = calculateEffectiveResistance(
    finite(target.armor, 'target.armor'),
    nonNegative(
      stats.armor_penetration_percent,
      'stats.armor_penetration_percent',
    ),
    nonNegative(stats.lethality, 'stats.lethality'),
  )
  const effectiveTargetMagicResistance = calculateEffectiveResistance(
    finite(target.magicResistance, 'target.magicResistance'),
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
  }
}
