import { calculateRangedChampion } from './calculator'
import { calculateRangedDps } from './dps'
import type {
  MetricGain,
  RangedAnvilBenefitInput,
  RangedAnvilBenefitResult,
} from './benefit-model'

function clean(value: number): number {
  const rounded = Math.round(value * 1_000_000_000_000) / 1_000_000_000_000
  return Object.is(rounded, -0) ? 0 : rounded
}

function gain(before: number, after: number): MetricGain {
  const absolute = clean(after - before)
  return {
    before,
    after,
    absolute,
    percent: before === 0 ? null : clean((absolute / before) * 100),
  }
}

export function calculateRangedAnvilBenefit(
  input: RangedAnvilBenefitInput,
): RangedAnvilBenefitResult {
  const beforeCalculation = calculateRangedChampion(input.champion)
  const afterCalculation = calculateRangedChampion({
    ...input.champion,
    selections: [...input.champion.selections, input.candidate],
  })
  const beforeDps = calculateRangedDps({
    stats: beforeCalculation.finalStats,
    target: input.target,
    ...(input.profile === undefined ? {} : { profile: input.profile }),
  })
  const afterDps = calculateRangedDps({
    stats: afterCalculation.finalStats,
    target: input.target,
    ...(input.profile === undefined ? {} : { profile: input.profile }),
  })
  const beforeDefense = beforeCalculation.finalDefense
  const afterDefense = afterCalculation.finalDefense
  const candidateStep = afterCalculation.steps.at(-1)

  if (candidateStep === undefined) {
    throw new Error('候选锻体没有生成计算步骤')
  }

  return {
    option: input.candidate.option,
    effectivenessPercent: input.candidate.effectivenessPercent ?? 100,
    statDelta: candidateStep.delta,
    totalDps: gain(beforeDps.totalDps, afterDps.totalDps),
    physicalDps: gain(
      beforeDps.physical.afterMitigation,
      afterDps.physical.afterMitigation,
    ),
    magicDps: gain(
      beforeDps.magic.afterMitigation,
      afterDps.magic.afterMitigation,
    ),
    trueDps: gain(
      beforeDps.true.afterMitigation,
      afterDps.true.afterMitigation,
    ),
    physicalEffectiveHealth: gain(
      beforeDefense.physicalEffectiveHealth,
      afterDefense.physicalEffectiveHealth,
    ),
    magicEffectiveHealth: gain(
      beforeDefense.magicEffectiveHealth,
      afterDefense.magicEffectiveHealth,
    ),
    gold: gain(beforeCalculation.goldGained, afterCalculation.goldGained),
    beforeCalculation,
    afterCalculation,
    beforeDps,
    afterDps,
    beforeDefense,
    afterDefense,
  }
}

export function compareRangedAnvilBenefits(
  input: Omit<RangedAnvilBenefitInput, 'candidate'> & {
    readonly candidates: readonly RangedAnvilBenefitInput['candidate'][]
  },
): readonly RangedAnvilBenefitResult[] {
  return input.candidates.map((candidate) =>
    calculateRangedAnvilBenefit({
      champion: input.champion,
      target: input.target,
      ...(input.profile === undefined ? {} : { profile: input.profile }),
      candidate,
    }),
  )
}
