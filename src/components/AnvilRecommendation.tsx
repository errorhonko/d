import { useState, useMemo } from 'react'
import type {
  SingleStatAnvilPurchaseResult,
  RangedAnvilBenefitResult,
} from '../domain/calculation'
import type { AnvilOption, AnvilTier, StatKey } from '../domain/stat-anvils'

interface AnvilRecommendationProps {
  simulation: SingleStatAnvilPurchaseResult
  onAdoptAnvil: (option: AnvilOption) => void
}

type SortMetric = 'dps' | 'survival' | 'gold'
type TierTab = 'all' | 'silver' | 'gold' | 'prismatic'

const TIER_LABELS: Record<AnvilTier, string> = {
  silver: '白银锻造器',
  gold: '黄金锻造器',
  prismatic: '棱彩锻造器',
}

const STAT_NAMES_ZH: Record<StatKey, string> = {
  ability_haste: '技能急速',
  ability_power: '法术强度',
  armor: '护甲',
  armor_penetration_percent: '护甲穿透',
  attack_damage: '攻击力',
  attack_speed: '攻击速度',
  critical_strike_chance: '暴击几率',
  critical_strike_damage: '暴击伤害',
  heal_and_shield_power: '治疗与护盾强度',
  health: '生命值',
  lethality: '穿甲',
  magic_penetration_flat: '法术穿透',
  magic_penetration_percent: '百分比法术穿透',
  magic_resistance: '魔法抗性',
  maximum_health_from_all_sources: '全来源最大生命值',
  movement_speed: '移动速度',
  omnivamp: '全能吸血',
  size: '体型',
  tenacity: '韧性',
}

function formatAnvilEffects(effects: AnvilOption['effects']): string {
  return effects
    .map((eff) => {
      if (eff.kind === 'stat') {
        const name = STAT_NAMES_ZH[eff.stat] ?? eff.stat
        const isPercent =
          eff.unit === 'percent' ||
          eff.unit === 'percentage_points' ||
          eff.unit === 'bonus_percent' ||
          eff.unit === 'additional_percent' ||
          eff.unit === 'bonus_percentage_points' ||
          eff.stat === 'attack_speed' ||
          eff.stat === 'critical_strike_chance' ||
          eff.stat === 'armor_penetration_percent' ||
          eff.stat === 'magic_penetration_percent' ||
          eff.stat === 'omnivamp' ||
          eff.stat === 'tenacity'
        return `+${eff.value}${isPercent ? '%' : ''} ${name}`
      }
      if (eff.kind === 'economy') {
        const triggerMap: Record<string, string> = {
          immediate: '立即获得',
          each_new_round: '每轮开始时',
          per_round_already_lost: '每败场/轮',
        }
        return `+${eff.value} 金币 (${triggerMap[eff.trigger] ?? eff.trigger})`
      }
      if (eff.kind === 'conditional-stat') {
        return `全能吸血 (远程 +${eff.values.ranged}%)`
      }
      return ''
    })
    .filter(Boolean)
    .join('，')
}

export function AnvilRecommendation({
  simulation,
  onAdoptAnvil,
}: AnvilRecommendationProps) {
  const [activeTier, setActiveTier] = useState<TierTab>('all')
  const [sortMetric, setSortMetric] = useState<SortMetric>('dps')

  // 将所有结果打平或按品阶筛选
  const allOutcomes = useMemo(() => {
    return simulation.tiers.flatMap((group) => group.outcomes)
  }, [simulation])

  const filteredOutcomes = useMemo(() => {
    let list =
      activeTier === 'all'
        ? allOutcomes
        : simulation.tiers.find((g) => g.tier === activeTier)?.outcomes ?? []

    return [...list].sort((a, b) => {
      if (sortMetric === 'dps') {
        return (b.totalDps.percent ?? 0) - (a.totalDps.percent ?? 0)
      }
      if (sortMetric === 'survival') {
        const aEhpGain = (a.physicalEffectiveHealth.absolute + a.magicEffectiveHealth.absolute) / 2
        const bEhpGain = (b.physicalEffectiveHealth.absolute + b.magicEffectiveHealth.absolute) / 2
        return bEhpGain - aEhpGain
      }
      if (sortMetric === 'gold') {
        return b.gold.absolute - a.gold.absolute
      }
      return 0
    })
  }, [simulation, activeTier, sortMetric, allOutcomes])

  const topPick = filteredOutcomes[0]

  return (
    <div className="card recommendation-card">
      <div className="card-header">
        <div className="header-title-group">
          <h3>⚡ 下一轮属性锻造器智能推荐</h3>
          <span className="subtitle">基于当前状态与敌方假人抗性的实时收益模拟</span>
        </div>
        <div className="price-tag">购买费用: {simulation.price} G</div>
      </div>

      {/* 筛选与排序控制 */}
      <div className="rec-control-bar">
        <div className="tier-nav-pills">
          <button
            type="button"
            className={`tier-pill ${activeTier === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTier('all')}
          >
            全部品阶 ({allOutcomes.length})
          </button>
          <button
            type="button"
            className={`tier-pill silver ${activeTier === 'silver' ? 'active' : ''}`}
            onClick={() => setActiveTier('silver')}
          >
            白银
          </button>
          <button
            type="button"
            className={`tier-pill gold ${activeTier === 'gold' ? 'active' : ''}`}
            onClick={() => setActiveTier('gold')}
          >
            黄金
          </button>
          <button
            type="button"
            className={`tier-pill prismatic ${activeTier === 'prismatic' ? 'active' : ''}`}
            onClick={() => setActiveTier('prismatic')}
          >
            棱彩
          </button>
        </div>

        <div className="sort-buttons">
          <span className="sort-label">排序指标:</span>
          <button
            type="button"
            className={`btn-sort ${sortMetric === 'dps' ? 'active' : ''}`}
            onClick={() => setSortMetric('dps')}
          >
            🔥 DPS 提升
          </button>
          <button
            type="button"
            className={`btn-sort ${sortMetric === 'survival' ? 'active' : ''}`}
            onClick={() => setSortMetric('survival')}
          >
            🛡️ 生存有效生命
          </button>
          <button
            type="button"
            className={`btn-sort ${sortMetric === 'gold' ? 'active' : ''}`}
            onClick={() => setSortMetric('gold')}
          >
            💰 经济收益
          </button>
        </div>
      </div>

      {/* 最佳推荐高亮横幅 */}
      {topPick && (
        <div className={`top-recommendation-banner tier-${topPick.option.tier}`}>
          <div className="top-badge">👑 当前最优推荐 (No.1)</div>
          <div className="top-content">
            <div className="top-name">
              [{TIER_LABELS[topPick.option.tier]}] {topPick.option.name}
            </div>
            <div className="top-reason">
              {sortMetric === 'dps' && (
                <>
                  预计带来 <strong className="highlight-text">+{topPick.totalDps.percent?.toFixed(2)}%</strong> 的 DPS 增幅 (秒伤 +{Math.round(topPick.totalDps.absolute)})
                </>
              )}
              {sortMetric === 'survival' && (
                <>
                  物理有效生命 +{Math.round(topPick.physicalEffectiveHealth.absolute)}，魔法有效生命 +{Math.round(topPick.magicEffectiveHealth.absolute)}
                </>
              )}
              {sortMetric === 'gold' && (
                <>
                  提供 <strong className="gold-text">+{Math.round(topPick.gold.absolute)} G</strong> 经济收益
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-adopt-top"
            onClick={() => onAdoptAnvil(topPick.option)}
          >
            + 立即采纳并加入构建
          </button>
        </div>
      )}

      {/* 推荐选项列表 */}
      <div className="recommendation-list">
        {filteredOutcomes.map((benefit: RangedAnvilBenefitResult, rank: number) => {
          const dpsGain = benefit.totalDps.percent ?? 0
          const isTop3 = rank < 3

          return (
            <div
              key={`${benefit.option.tier}-${benefit.option.id}`}
              className={`rec-item-row tier-${benefit.option.tier} ${isTop3 ? 'top-row' : ''}`}
            >
              <div className="rank-indicator">
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
              </div>

              <div className="rec-info-col">
                <div className="rec-name-row">
                  <span className={`rec-tier-badge tier-bg-${benefit.option.tier}`}>
                    {benefit.option.tier === 'silver' ? '白银' : benefit.option.tier === 'gold' ? '黄金' : '棱彩'}
                  </span>
                  <span className="rec-option-name">{benefit.option.name}</span>
                </div>
                <div className="rec-option-desc">{formatAnvilEffects(benefit.option.effects)}</div>
              </div>

              <div className="rec-gain-col">
                <div className="gain-metric-box">
                  <span className="metric-label">DPS 增益</span>
                  <span className={`metric-val ${dpsGain > 0 ? 'dps-positive' : ''}`}>
                    {dpsGain > 0 ? `+${dpsGain.toFixed(2)}%` : '0%'}
                  </span>
                  <span className="metric-sub-val">
                    (+{Math.round(benefit.totalDps.absolute)}/s)
                  </span>
                </div>

                <div className="gain-metric-box">
                  <span className="metric-label">物理/魔法 EHP</span>
                  <span className="metric-val ehp-val">
                    +{Math.round(benefit.physicalEffectiveHealth.absolute)} / +{Math.round(benefit.magicEffectiveHealth.absolute)}
                  </span>
                </div>

                {benefit.gold.absolute > 0 && (
                  <div className="gain-metric-box">
                    <span className="metric-label">金币收益</span>
                    <span className="metric-val gold-val">+{Math.round(benefit.gold.absolute)} G</span>
                  </div>
                )}
              </div>

              <div className="rec-action-col">
                <button
                  type="button"
                  className="btn-adopt-item"
                  onClick={() => onAdoptAnvil(benefit.option)}
                >
                  采纳选择
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
