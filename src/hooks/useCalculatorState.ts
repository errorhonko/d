import { useState, useMemo } from 'react'
import {
  championCatalog,
  arenaChampionCalculationInput,
  type ChampionInitialStats,
} from '../domain/champions'
import {
  prismaticItemCatalog,
  findPrismaticItem,
  marksmanPrismaticItemModel,
  type PrismaticItem,
} from '../domain/prismatic-items'
import {
  type AnvilOption,
} from '../domain/stat-anvils'
import {
  calculateRangedChampion,
  findStatAnvilOption,
  simulateSingleStatAnvilPurchase,
  resolveArenaCategoryRoundTarget,
  calculateRangedDps,
  type ArenaChampionCategory,
  type ArenaTargetStatistic,
  type RangedChampionCalculationResult,
  type SingleStatAnvilPurchaseResult,
} from '../domain/calculation'
import {
  AD_AUGMENTS_CATALOG,
  calculateAugmentBenefit,
  type AugmentBenefitResult,
} from '../domain/augments'

export interface SelectedAnvil {
  id: string
  option: AnvilOption
  effectivenessPercent?: number
  roundsAlreadyLost?: number
  newRoundsAfterSelection?: number
}

export interface PrismaticRecommendationItem {
  item: PrismaticItem
  dps: number
  dpsPercentGain: number
  selectionProbability: number
  rankScore: number
  tier: 'S' | 'A' | 'B' | 'C'
  description: string
  tags: string[]
}

export function useCalculatorState() {
  // 1. 基础配置
  const defaultChampion = championCatalog.championsByKey.get('Ashe') ?? championCatalog.champions[0]!
  const [selectedChampion, setSelectedChampion] = useState<ChampionInitialStats>(defaultChampion)
  const [level, setLevel] = useState<number>(11)

  // 2. 装备与状态配置
  const [selectedPrismaticItemId, setSelectedPrismaticItemId] = useState<number | null>(443069) // 默认断筋者 (Hamstringer)
  const [shardbladePercent, setShardbladePercent] = useState<number>(100)
  const [dragonSouls, setDragonSouls] = useState<number>(0)
  const [roundWins, setRoundWins] = useState<number>(0)
  const [roundLosses, setRoundLosses] = useState<number>(0)
  const [sovereignTakedowns, setSovereignTakedowns] = useState<number>(0)

  // 3. 强化符文自定义等级 (Level 1~3) 与自定义层数状态管理
  const [augmentLevels, setAugmentLevels] = useState<Record<string, number>>({})
  const [augmentStacks, setAugmentStacks] = useState<Record<string, number>>({})

  // 4. 已选锻造器
  const [selectedAnvils, setSelectedAnvils] = useState<SelectedAnvil[]>([
    {
      id: 'default-1',
      option: findStatAnvilOption('gold', 'attack_damage'),
    },
    {
      id: 'default-2',
      option: findStatAnvilOption('gold', 'attack_speed'),
    },
  ])

  // 5. 对战假人目标配置
  const [targetCategory, setTargetCategory] = useState<ArenaChampionCategory>('Fighter')
  const [targetRound, setTargetRound] = useState<number>(9)
  const [targetStatistic, setTargetStatistic] = useState<ArenaTargetStatistic>('median')

  const selectedPrismaticItem = useMemo(() => {
    return selectedPrismaticItemId ? findPrismaticItem(selectedPrismaticItemId) : undefined
  }, [selectedPrismaticItemId])

  // 目标抗性计算
  const arenaTarget = useMemo(() => {
    try {
      return resolveArenaCategoryRoundTarget(targetCategory, targetRound, targetStatistic)
    } catch {
      return resolveArenaCategoryRoundTarget('Fighter', 1, 'median')
    }
  }, [targetCategory, targetRound, targetStatistic])

  // 构建当前输入参数
  const currentCalculationInput = useMemo(() => {
    return arenaChampionCalculationInput({
      champion: selectedChampion,
      level,
      prismaticItem: selectedPrismaticItem,
      prismaticItemState: {
        dragonSouls: dragonSouls > 0 ? dragonSouls : undefined,
        roundWins: roundWins > 0 ? roundWins : undefined,
        roundLosses: roundLosses > 0 ? roundLosses : undefined,
        sovereignTakedowns: sovereignTakedowns > 0 ? sovereignTakedowns : undefined,
      },
      statAnvils: selectedAnvils.map((a) => ({
        option: a.option,
        effectivenessPercent: a.effectivenessPercent,
        roundsAlreadyLost: a.roundsAlreadyLost,
        newRoundsAfterSelection: a.newRoundsAfterSelection,
      })),
      shardbladeEffectivenessPercent: shardbladePercent >= 100 ? shardbladePercent : undefined,
    })
  }, [
    selectedChampion,
    level,
    selectedPrismaticItem,
    dragonSouls,
    roundWins,
    roundLosses,
    sovereignTakedowns,
    selectedAnvils,
    shardbladePercent,
  ])

  // 当前属性与收益计算
  const calculationResult: RangedChampionCalculationResult = useMemo(() => {
    return calculateRangedChampion(currentCalculationInput)
  }, [currentCalculationInput])

  // 当前 DPS
  const currentDps = useMemo(() => {
    return calculateRangedDps({
      stats: calculationResult.finalStats,
      target: {
        armor: arenaTarget.armor,
        magicResistance: arenaTarget.magicResistance,
      },
      prismaticItem: currentCalculationInput.prismaticItemDps,
    })
  }, [calculationResult, arenaTarget, currentCalculationInput.prismaticItemDps])

  // 模拟下一轮所有锻造器的购买收益（白银、黄金、棱彩）
  const anvilSimulation: SingleStatAnvilPurchaseResult = useMemo(() => {
    return simulateSingleStatAnvilPurchase({
      champion: currentCalculationInput,
      target: {
        armor: arenaTarget.armor,
        magicResistance: arenaTarget.magicResistance,
      },
      roundsAlreadyLost: roundLosses,
      newRoundsAfterSelection: 4,
    })
  }, [currentCalculationInput, arenaTarget, roundLosses])

  // 棱彩装备推荐列表计算
  const prismaticRecommendations: PrismaticRecommendationItem[] = useMemo(() => {
    const baseInput = arenaChampionCalculationInput({
      champion: selectedChampion,
      level,
      statAnvils: selectedAnvils.map((a) => ({ option: a.option })),
      shardbladeEffectivenessPercent: shardbladePercent >= 100 ? shardbladePercent : undefined,
    })
    const baseCalculation = calculateRangedChampion(baseInput)
    const baseDps = calculateRangedDps({
      stats: baseCalculation.finalStats,
      target: {
        armor: arenaTarget.armor,
        magicResistance: arenaTarget.magicResistance,
      },
    }).totalDps

    return prismaticItemCatalog.items.map((item) => {
      const testInput = arenaChampionCalculationInput({
        champion: selectedChampion,
        level,
        prismaticItem: item,
        prismaticItemState: {
          dragonSouls: dragonSouls > 0 ? dragonSouls : undefined,
          roundWins: roundWins > 0 ? roundWins : undefined,
          roundLosses: roundLosses > 0 ? roundLosses : undefined,
          sovereignTakedowns: sovereignTakedowns > 0 ? sovereignTakedowns : undefined,
        },
        statAnvils: selectedAnvils.map((a) => ({ option: a.option })),
        shardbladeEffectivenessPercent: shardbladePercent >= 100 ? shardbladePercent : undefined,
      })
      const testCalc = calculateRangedChampion(testInput)
      const dpsResult = calculateRangedDps({
        stats: testCalc.finalStats,
        target: {
          armor: arenaTarget.armor,
          magicResistance: arenaTarget.magicResistance,
        },
        prismaticItem: testInput.prismaticItemDps,
      })

      const dpsGain = dpsResult.totalDps - baseDps
      const dpsPercent = baseDps > 0 ? (dpsGain / baseDps) * 100 : 0

      const tags: string[] = []
      if ((item.staticStats.attack_damage ?? 0) > 0) tags.push('攻击力')
      if (item.bonusAttackSpeedPercent > 0) tags.push('攻击速度')
      if (item.criticalStrikeChance > 0) tags.push('暴击几率')
      if ((item.staticStats.armor_penetration_percent ?? 0) > 0 || (item.lethality ?? 0) > 0) tags.push('穿甲与破甲')
      if ((item.staticStats.ability_power ?? 0) > 0) tags.push('法术强度')
      if ((item.staticStats.health ?? 0) > 0 || (item.staticStats.armor ?? 0) > 0) tags.push('生存坦度')

      let tier: 'S' | 'A' | 'B' | 'C' = 'C'
      if (dpsPercent > 25) tier = 'S'
      else if (dpsPercent > 15) tier = 'A'
      else if (dpsPercent > 5) tier = 'B'

      const descParts: string[] = []
      if ((item.staticStats.attack_damage ?? 0) > 0) descParts.push(`+${item.staticStats.attack_damage} 攻击力`)
      if (item.bonusAttackSpeedPercent > 0) descParts.push(`+${item.bonusAttackSpeedPercent}% 攻击速度`)
      if (item.criticalStrikeChance > 0) descParts.push(`+${Math.round(item.criticalStrikeChance)}% 暴击几率`)
      if ((item.staticStats.armor ?? 0) > 0) descParts.push(`+${item.staticStats.armor} 护甲`)
      if ((item.staticStats.magic_resistance ?? 0) > 0) descParts.push(`+${item.staticStats.magic_resistance} 魔法抗性`)
      if ((item.staticStats.health ?? 0) > 0) descParts.push(`+${item.staticStats.health} 生命值`)

      return {
        item,
        dps: dpsResult.totalDps,
        dpsPercentGain: dpsPercent,
        selectionProbability:
          marksmanPrismaticItemModel.profilesById.get(item.id)
            ?.selectionProbability ?? 0,
        rankScore: dpsPercent,
        tier,
        description: descParts.join('，') || '附带专属棱彩特效与属性增幅',
        tags,
      }
    }).sort((a, b) => b.dpsPercentGain - a.dpsPercentGain)
  }, [
    selectedChampion,
    level,
    selectedAnvils,
    shardbladePercent,
    arenaTarget,
    dragonSouls,
    roundWins,
    roundLosses,
    sovereignTakedowns,
  ])

  // AD 强化符文收益与分等级/分层计算 (保持稳定排序，避免调节层数/等级时卡片跳动)
  const augmentBenefits: AugmentBenefitResult[] = useMemo(() => {
    const tierPriority: Record<string, number> = { silver: 1, gold: 2, prismatic: 3 }
    return AD_AUGMENTS_CATALOG.map((augment) => {
      const customLevel = augmentLevels[augment.id] ?? 1
      const customStack = augmentStacks[augment.id]
      return calculateAugmentBenefit(
        currentCalculationInput,
        augment,
        {
          armor: arenaTarget.armor,
          magicResistance: arenaTarget.magicResistance,
        },
        customLevel,
        customStack,
      )
    }).sort((a, b) => (tierPriority[a.augment.tier] ?? 0) - (tierPriority[b.augment.tier] ?? 0))
  }, [currentCalculationInput, arenaTarget, augmentLevels, augmentStacks])

  const setAugmentLevel = (augmentId: string, levelNum: number) => {
    setAugmentLevels((prev) => ({
      ...prev,
      [augmentId]: levelNum,
    }))
  }

  const setAugmentStack = (augmentId: string, stacks: number) => {
    setAugmentStacks((prev) => ({
      ...prev,
      [augmentId]: stacks,
    }))
  }

  // 添加锻造器
  const handleAddAnvil = (option: AnvilOption) => {
    setSelectedAnvils((prev) => [
      ...prev,
      {
        id: `${option.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        option,
        effectivenessPercent: shardbladePercent > 100 ? shardbladePercent : undefined,
      },
    ])
  }

  // 删除锻造器
  const handleRemoveAnvil = (id: string) => {
    setSelectedAnvils((prev) => prev.filter((a) => a.id !== id))
  }

  // 清空锻造器
  const handleClearAnvils = () => {
    setSelectedAnvils([])
  }

  return {
    selectedChampion,
    setSelectedChampion,
    level,
    setLevel,
    selectedPrismaticItemId,
    setSelectedPrismaticItemId,
    selectedPrismaticItem,
    shardbladePercent,
    setShardbladePercent,
    dragonSouls,
    setDragonSouls,
    roundWins,
    setRoundWins,
    roundLosses,
    setRoundLosses,
    sovereignTakedowns,
    setSovereignTakedowns,
    selectedAnvils,
    handleAddAnvil,
    handleRemoveAnvil,
    handleClearAnvils,
    targetCategory,
    setTargetCategory,
    targetRound,
    setTargetRound,
    targetStatistic,
    setTargetStatistic,
    arenaTarget,
    calculationResult,
    currentDps,
    anvilSimulation,
    prismaticRecommendations,
    augmentBenefits,
    setAugmentLevel,
    setAugmentStack,
  }
}
