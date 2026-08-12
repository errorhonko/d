import type {
  DefensiveSummary,
  ResistanceMitigation,
  StatBlock,
} from './model'

function clean(value: number): number {
  const rounded = Math.round(value * 1_000_000_000_000) / 1_000_000_000_000
  return Object.is(rounded, -0) ? 0 : rounded
}

export function calculateResistanceMitigation(
  resistance: number,
): ResistanceMitigation {
  if (!Number.isFinite(resistance)) throw new Error('抗性必须是有限数字')

  const damageMultiplier =
    resistance >= 0
      ? 100 / (100 + resistance)
      : 2 - 100 / (100 - resistance)

  return {
    resistance,
    damageMultiplier: clean(damageMultiplier),
    damageReductionPercent: clean((1 - damageMultiplier) * 100),
    damageTakenPer100Raw: clean(damageMultiplier * 100),
  }
}

export function calculateDefensiveSummary(stats: StatBlock): DefensiveSummary {
  const armor = calculateResistanceMitigation(stats.armor)
  const magicResistance = calculateResistanceMitigation(stats.magic_resistance)
  const effectiveHealth = (
    health: number,
    resistance: number,
    damageMultiplier: number,
  ): number =>
    clean(
      resistance >= 0
        ? health * (1 + resistance / 100)
        : health / damageMultiplier,
    )

  return {
    armor,
    magicResistance,
    physicalEffectiveHealth: effectiveHealth(
      stats.health,
      stats.armor,
      armor.damageMultiplier,
    ),
    magicEffectiveHealth: effectiveHealth(
      stats.health,
      stats.magic_resistance,
      magicResistance.damageMultiplier,
    ),
  }
}
