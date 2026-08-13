import rawProbabilities from '../../../data/curated/prismatic-items/kr-26.15-100-selection-probabilities.json'
import type { ArenaChampionCategory } from '../calculation'
import { findPrismaticItem } from './catalog'
import type {
  PrismaticItemSelectionDistribution,
  SampledPrismaticItem,
} from './model'

const distributions = new Map<ArenaChampionCategory, PrismaticItemSelectionDistribution>(
  rawProbabilities.distributions.map((raw) => {
    const category = raw.category as ArenaChampionCategory
    return [
      category,
      {
        category,
        participants: raw.participants,
        recognizedParticipants: raw.recognizedParticipants,
        excludedWithoutPrismaticItem: raw.excludedWithoutPrismaticItem,
        playersWithMultiplePrismaticItems: raw.playersWithMultiplePrismaticItems,
        items: raw.items.map((entry) => ({
          item: findPrismaticItem(entry.itemId),
          weightedSelections: entry.weightedSelections,
          probability: entry.probability,
        })),
      },
    ]
  }),
)

export function getPrismaticItemSelectionDistribution(
  category: ArenaChampionCategory,
): PrismaticItemSelectionDistribution {
  const distribution = distributions.get(category)
  if (!distribution) throw new Error(`找不到英雄类别的棱彩装备分布：${category}`)
  return distribution
}

/**
 * 按韩服 100 场样本中同类英雄最终保留装备的玩家归一化频率抽取一件棱彩装备。
 * random 必须返回 [0, 1)；可注入固定随机数用于可复现示例与测试。
 */
export function samplePrismaticItemForCategory(
  category: ArenaChampionCategory,
  random: () => number = Math.random,
): SampledPrismaticItem {
  const draw = random()
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) {
    throw new Error('random 必须返回 [0, 1) 范围内的有限数字')
  }

  const distribution = getPrismaticItemSelectionDistribution(category)
  let cumulative = 0
  for (const entry of distribution.items) {
    cumulative += entry.probability
    if (draw < cumulative) {
      return { item: entry.item, probability: entry.probability, distribution }
    }
  }

  const fallback = distribution.items.at(-1)
  if (!fallback) throw new Error(`英雄类别没有可抽取的棱彩装备：${category}`)
  return { item: fallback.item, probability: fallback.probability, distribution }
}

export function sampleMarksmanPrismaticItem(
  random: () => number = Math.random,
): SampledPrismaticItem {
  return samplePrismaticItemForCategory('Marksman', random)
}
