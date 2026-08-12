import {
  STAT_KEYS,
  statAnvilCatalog,
  type AnvilEffect,
  type AnvilOption,
  type AnvilTier,
  type EconomyEffect,
  type StatKey,
} from '../stat-anvils'
import type {
  AppliedEffect,
  InitialStatBlock,
  RangedChampionCalculationInput,
  RangedChampionCalculationResult,
  RangedChampionSelection,
  StatBlock,
} from './model'
import { calculateDefensiveSummary } from './defense'

type MutableStatBlock = Record<StatKey, number>

interface CalculationState {
  readonly initial: MutableStatBlock
  readonly current: MutableStatBlock
  readonly attackSpeedRatio: number
  attackSpeedBonusPercent: number
  movementSpeedBonusPercent: number
  healthFlatBonus: number
  maximumHealthAdditionalPercent: number
  gold: number
}

const PERCENT_PENETRATION_STATS = new Set<StatKey>([
  'armor_penetration_percent',
  'magic_penetration_percent',
])

function clean(value: number): number {
  const rounded = Math.round(value * 1_000_000_000_000) / 1_000_000_000_000
  return Object.is(rounded, -0) ? 0 : rounded
}

function assertFinite(value: number, path: string): number {
  if (!Number.isFinite(value)) throw new Error(`${path} 必须是有限数字`)
  return value
}

function assertNonNegative(value: number, path: string): number {
  assertFinite(value, path)
  if (value < 0) throw new Error(`${path} 不能小于 0`)
  return value
}

function createStatBlock(input: InitialStatBlock = {}): MutableStatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [
      stat,
      clean(assertFinite(input[stat] ?? 0, `initialStats.${stat}`)),
    ]),
  ) as MutableStatBlock
}

function cloneStats(stats: MutableStatBlock): MutableStatBlock {
  return { ...stats }
}

function subtractStats(after: StatBlock, before: StatBlock): MutableStatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [stat, clean(after[stat] - before[stat])]),
  ) as MutableStatBlock
}

function combinePenetration(current: number, added: number): number {
  return clean(100 * (1 - (1 - current / 100) * (1 - added / 100)))
}

function refreshDerivedStats(state: CalculationState): void {
  state.current.attack_speed = clean(
    state.initial.attack_speed +
      state.attackSpeedRatio * (state.attackSpeedBonusPercent / 100),
  )
  state.current.movement_speed = clean(
    state.initial.movement_speed * (1 + state.movementSpeedBonusPercent / 100),
  )
  state.current.maximum_health_from_all_sources = clean(
    state.initial.maximum_health_from_all_sources +
      state.maximumHealthAdditionalPercent,
  )
  state.current.health = clean(
    (state.initial.health + state.healthFlatBonus) *
      (1 + state.maximumHealthAdditionalPercent / 100),
  )
}

function applyStatEffect(
  state: CalculationState,
  effect: Extract<AnvilEffect, { kind: 'stat' }>,
  scale: number,
): void {
  const value = clean(effect.value * scale)

  if (effect.unit === 'bonus_percent' && effect.stat === 'attack_speed') {
    state.attackSpeedBonusPercent += value
    refreshDerivedStats(state)
    return
  }

  if (effect.unit === 'bonus_percent' && effect.stat === 'movement_speed') {
    state.movementSpeedBonusPercent += value
    refreshDerivedStats(state)
    return
  }

  if (
    effect.unit === 'additional_percent' &&
    effect.stat === 'maximum_health_from_all_sources'
  ) {
    state.maximumHealthAdditionalPercent += value
    refreshDerivedStats(state)
    return
  }

  if (effect.unit === 'bonus_flat' && effect.stat === 'health') {
    state.healthFlatBonus += value
    refreshDerivedStats(state)
    return
  }

  if (
    effect.stacking ===
      'multiplicative_with_other_percent_penetration_shards' &&
    PERCENT_PENETRATION_STATS.has(effect.stat)
  ) {
    state.current[effect.stat] = combinePenetration(
      state.current[effect.stat],
      value,
    )
    return
  }

  state.current[effect.stat] = clean(state.current[effect.stat] + value)
}

function economyGold(effect: EconomyEffect, selection: RangedChampionSelection): number {
  switch (effect.trigger) {
    case 'immediate':
      return effect.value
    case 'each_new_round':
      return effect.value * (selection.newRoundsAfterSelection ?? 0)
    case 'per_round_already_lost':
      return effect.value * (selection.roundsAlreadyLost ?? 0)
  }
}

function applyEffect(
  state: CalculationState,
  effect: AnvilEffect,
  scale: number,
  selection: RangedChampionSelection,
): AppliedEffect {
  if (effect.kind === 'economy') {
    const goldGained = clean(economyGold(effect, selection))
    state.gold = clean(state.gold + goldGained)
    return { effect, scale: 1, goldGained }
  }

  if (effect.kind === 'conditional-stat') {
    state.current[effect.stat] = clean(
      state.current[effect.stat] + effect.values.ranged * scale,
    )
    return { effect, scale, goldGained: 0 }
  }

  applyStatEffect(state, effect, scale)
  return { effect, scale, goldGained: 0 }
}

export function findStatAnvilOption(tier: AnvilTier, id: string): AnvilOption {
  const option = statAnvilCatalog.optionsByTier[tier].find(
    (candidate) => candidate.id === id,
  )
  if (option === undefined) throw new Error(`找不到 ${tier} 属性锻体选项：${id}`)
  return option
}

export function calculateRangedChampion(
  input: RangedChampionCalculationInput,
): RangedChampionCalculationResult {
  const initial = createStatBlock(input.initialStats)
  const attackSpeedRatio = assertNonNegative(
    input.attackSpeedRatio ?? initial.attack_speed,
    'attackSpeedRatio',
  )
  const state: CalculationState = {
    initial,
    current: cloneStats(initial),
    attackSpeedRatio,
    attackSpeedBonusPercent: 0,
    movementSpeedBonusPercent: 0,
    healthFlatBonus: 0,
    maximumHealthAdditionalPercent: 0,
    gold: 0,
  }

  const steps = input.selections.map((selection, index) => {
    const effectivenessPercent = assertNonNegative(
      selection.effectivenessPercent ?? 100,
      `selections[${index}].effectivenessPercent`,
    )
    const scale = effectivenessPercent / 100
    const before = cloneStats(state.current)
    const goldBefore = state.gold
    const appliedEffects = selection.option.effects.map((effect) =>
      applyEffect(state, effect, scale, selection),
    )
    const after = cloneStats(state.current)

    return {
      index,
      option: selection.option,
      effectivenessPercent,
      before,
      after,
      delta: subtractStats(after, before),
      goldGained: clean(state.gold - goldBefore),
      appliedEffects,
    }
  })

  const finalStats = cloneStats(state.current)
  return {
    attackType: 'ranged',
    initialStats: cloneStats(initial),
    finalStats,
    totalDelta: subtractStats(finalStats, initial),
    initialDefense: calculateDefensiveSummary(initial),
    finalDefense: calculateDefensiveSummary(finalStats),
    goldGained: state.gold,
    steps,
  }
}
