import type { InitialStatBlock } from '../calculation'
import type { ChampionInitialStats } from './model'

/**
 * 将 Data Dragon 的 1 级英雄属性转换为锻体计算器的输入格式。
 *
 * Data Dragon 不提供独立的攻击速度比率，因此这里只返回属性块；调用方应在
 * 有可靠数据时单独向 `calculateRangedChampion` 传入 `attackSpeedRatio`。
 */
export function championInitialStatBlock(
  champion: ChampionInitialStats,
): InitialStatBlock {
  return {
    health: champion.base.health,
    attack_damage: champion.base.attackDamage,
    attack_speed: champion.base.attackSpeed,
    armor: champion.base.armor,
    magic_resistance: champion.base.magicResistance,
    movement_speed: champion.base.movementSpeed,
    critical_strike_chance: champion.base.criticalStrikeChance,
    critical_strike_damage: 175,
    size: 100,
  }
}
