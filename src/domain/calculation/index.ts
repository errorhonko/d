export { calculateRangedChampion, findStatAnvilOption } from './calculator'
export {
  calculateRangedAnvilBenefit,
  compareAllRangedAnvilBenefits,
  compareRangedAnvilBenefits,
  simulateSingleStatAnvilPurchase,
} from './benefit'
export {
  ARENA_CHAMPION_CATEGORIES,
  calculateCategoryRoundAnvilBenefits,
  resolveArenaCategoryRoundTarget,
} from './arena-targets'
export { calculateDefensiveSummary, calculateResistanceMitigation } from './defense'
export { calculateEffectiveResistance, calculateRangedDps } from './dps'
export type {
  AppliedEffect,
  CalculationStep,
  DefensiveSummary,
  InitialStatBlock,
  RangedChampionCalculationInput,
  RangedChampionCalculationResult,
  RangedChampionSelection,
  ResistanceMitigation,
  StatBlock,
} from './model'
export type {
  DamageTypeDps,
  FixedDefenseTarget,
  RangedDamageProfile,
  RangedDpsInput,
  RangedDpsResult,
} from './dps-model'
export type {
  MetricGain,
  RangedAnvilBenefitInput,
  RangedAnvilBenefitResult,
  SingleStatAnvilPurchaseResult,
  SingleStatAnvilTierOutcomes,
} from './benefit-model'
export type {
  ArenaCategoryRoundTarget,
  ArenaChampionCategory,
  ArenaTargetConfidence,
  ArenaTargetStatistic,
  CategoryRoundAnvilBenefitInput,
  CategoryRoundAnvilBenefitResult,
} from './arena-targets'
