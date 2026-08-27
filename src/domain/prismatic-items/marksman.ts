import { prismaticItemCatalog } from './catalog'
import { getPrismaticItemSelectionDistribution } from './selection'
import type {
  MarksmanPrismaticItemFilter,
  MarksmanPrismaticItemModel,
  MarksmanPrismaticItemProfile,
  MarksmanPrismaticItemTag,
  PrismaticItem,
} from './model'

function hasPositiveStat(item: PrismaticItem, stat: keyof PrismaticItem['staticStats']): boolean {
  return (item.staticStats[stat] ?? 0) > 0
}

function marksmanTags(item: PrismaticItem): readonly MarksmanPrismaticItemTag[] {
  const tags: MarksmanPrismaticItemTag[] = []

  if (
    hasPositiveStat(item, 'attack_damage') ||
    (item.adaptiveForce ?? 0) > 0 ||
    (item.attackDamagePerSovereignTakedown ?? 0) > 0
  ) {
    tags.push('attack_damage')
  }
  if (
    item.bonusAttackSpeedPercent > 0 ||
    (item.multiplicativeAttackSpeedPercent ?? 0) > 0
  ) {
    tags.push('attack_speed')
  }
  if (item.criticalStrikeChance > 0) tags.push('critical_strike')
  if (hasPositiveStat(item, 'ability_power')) tags.push('ability_power')
  if (
    (item.lethality ?? 0) > 0 ||
    hasPositiveStat(item, 'armor_penetration_percent') ||
    hasPositiveStat(item, 'magic_penetration_percent') ||
    hasPositiveStat(item, 'magic_penetration_flat')
  ) {
    tags.push('penetration')
  }
  if ((item.movementSpeedPercent ?? 0) > 0) tags.push('mobility')
  if (
    hasPositiveStat(item, 'health') ||
    hasPositiveStat(item, 'armor') ||
    hasPositiveStat(item, 'magic_resistance') ||
    (item.armorAmplificationPercent ?? 0) > 0 ||
    (item.magicResistanceAmplificationPercent ?? 0) > 0
  ) {
    tags.push('durability')
  }
  if ((item.dpsEffects?.length ?? 0) > 0) tags.push('damage_effect')
  if (item.coreStatAmplification || item.attackDamagePerSovereignTakedown) {
    tags.push('scaling')
  }

  return tags
}

const distribution = getPrismaticItemSelectionDistribution('Marksman')
const profiles = [...distribution.items]
  .sort((left, right) => right.probability - left.probability)
  .map((entry, index): MarksmanPrismaticItemProfile => ({
    item: entry.item,
    selectionRank: index + 1,
    weightedSelections: entry.weightedSelections,
    selectionProbability: entry.probability,
    tags: marksmanTags(entry.item),
    modelCoverage:
      (entry.item.dpsEffects?.length ?? 0) > 0
        ? 'damage_and_stats'
        : 'stats_only',
  }))

const profilesById = new Map(profiles.map((profile) => [profile.item.id, profile]))

export const marksmanPrismaticItemModel: MarksmanPrismaticItemModel = {
  patch: prismaticItemCatalog.patch,
  participants: distribution.participants,
  recognizedParticipants: distribution.recognizedParticipants,
  profiles,
  profilesById,
  damageModeledSelectionProbability: profiles.reduce(
    (sum, profile) =>
      sum +
      (profile.modelCoverage === 'damage_and_stats'
        ? profile.selectionProbability
        : 0),
    0,
  ),
}

export function findMarksmanPrismaticItemProfile(
  id: number,
): MarksmanPrismaticItemProfile {
  const profile = profilesById.get(id)
  if (!profile) throw new Error(`射手样本中找不到棱彩装备：${id}`)
  return profile
}

export function filterMarksmanPrismaticItemProfiles(
  filter: MarksmanPrismaticItemFilter = {},
): readonly MarksmanPrismaticItemProfile[] {
  const requiredTags = filter.tags ?? []
  return profiles.filter(
    (profile) =>
      (!filter.damageModeledOnly ||
        profile.modelCoverage === 'damage_and_stats') &&
      requiredTags.every((tag) => profile.tags.includes(tag)),
  )
}
