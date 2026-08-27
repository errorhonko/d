import { useState, useMemo } from 'react'
import type {
  PrismaticRecommendationItem,
} from '../hooks/useCalculatorState'
import type { AugmentBenefitResult, AugmentTier } from '../domain/augments'

interface PrismaticRecommendationProps {
  prismaticRecommendations: PrismaticRecommendationItem[]
  augmentBenefits: AugmentBenefitResult[]
  onSetAugmentLevel: (augmentId: string, level: number) => void
  onSetAugmentStack: (augmentId: string, stacks: number) => void
  currentPrismaticId: number | null
  onSelectPrismatic: (id: number) => void
}

type AugmentTierFilter = 'all' | AugmentTier

const AUGMENT_TIER_LABELS: Record<AugmentTier, string> = {
  silver: '白银',
  gold: '金色',
  prismatic: '棱彩',
}

export function PrismaticRecommendation({
  prismaticRecommendations,
  augmentBenefits,
  onSetAugmentLevel,
  onSetAugmentStack,
  currentPrismaticId,
  onSelectPrismatic,
}: PrismaticRecommendationProps) {
  const [subTab, setSubTab] = useState<'items' | 'augments'>('items')
  const [augmentTierFilter, setAugmentTierFilter] = useState<AugmentTierFilter>('all')

  const filteredAugmentBenefits = useMemo(() => {
    return augmentBenefits.filter((item) => {
      if (augmentTierFilter === 'all') return true
      return item.augment.tier === augmentTierFilter
    })
  }, [augmentBenefits, augmentTierFilter])

  return (
    <div className="card recommendation-card">
      <div className="card-header">
        <div className="header-title-group">
          <h3>🏆 装备与强化符文智能推荐</h3>
          <span className="subtitle">综合英雄特性、属性成长及对战环境的流派搭配与收益计算</span>
        </div>

        <div className="rec-sub-tabs">
          <button
            type="button"
            className={`sub-tab-btn ${subTab === 'items' ? 'active' : ''}`}
            onClick={() => setSubTab('items')}
          >
            💎 棱彩装备推荐 ({prismaticRecommendations.length})
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${subTab === 'augments' ? 'active' : ''}`}
            onClick={() => setSubTab('augments')}
          >
            🔮 AD 强化符文收益 ({augmentBenefits.length})
          </button>
        </div>
      </div>

      {subTab === 'items' && (
        <div className="prismatic-rec-list">
          <div className="prismatic-grid">
            {prismaticRecommendations.map((rec, idx) => {
              const isCurrent = currentPrismaticId === rec.item.id
              return (
                <div
                  key={rec.item.id}
                  className={`prismatic-card tier-${rec.tier} ${isCurrent ? 'is-current' : ''}`}
                >
                  <div className="card-top">
                    <div className="tier-rank-badge">
                      <span className="tier-letter">{rec.tier} 级</span>
                      <span className="rank-num">#{idx + 1}</span>
                    </div>
                    {isCurrent && <span className="current-badge">当前已装备</span>}
                  </div>

                  <div className="item-name-zh">{rec.item.name}</div>

                  <div className="item-tags-wrap">
                    {rec.tags.map((tag) => (
                      <span key={tag} className="item-tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="item-dps-gain-box">
                    <span className="gain-label">模拟 DPS 增益</span>
                    <span className="gain-val">+{rec.dpsPercentGain.toFixed(1)}%</span>
                  </div>

                  <div className="item-desc-text">{rec.description}</div>

                  <button
                    type="button"
                    className={`btn-select-prismatic ${isCurrent ? 'disabled' : ''}`}
                    onClick={() => onSelectPrismatic(rec.item.id)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? '当前正穿戴' : '选择并装配'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {subTab === 'augments' && (
        <div className="augments-rec-container">
          {/* 品阶过滤栏 */}
          <div className="augment-filter-bar">
            <div className="tier-nav-pills">
              <button
                type="button"
                className={`tier-pill ${augmentTierFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAugmentTierFilter('all')}
              >
                全部品阶 ({augmentBenefits.length})
              </button>
              <button
                type="button"
                className={`tier-pill silver ${augmentTierFilter === 'silver' ? 'active' : ''}`}
                onClick={() => setAugmentTierFilter('silver')}
              >
                白银阶
              </button>
              <button
                type="button"
                className={`tier-pill gold ${augmentTierFilter === 'gold' ? 'active' : ''}`}
                onClick={() => setAugmentTierFilter('gold')}
              >
                金色阶
              </button>
              <button
                type="button"
                className={`tier-pill prismatic ${augmentTierFilter === 'prismatic' ? 'active' : ''}`}
                onClick={() => setAugmentTierFilter('prismatic')}
              >
                棱彩阶
              </button>
            </div>
            <div className="augment-tip-text">
              支持切换符文升级等级 (Lv.1~3) 与叠层实时测算收益
            </div>
          </div>

          <div className="augments-grid">
            {filteredAugmentBenefits.map((item) => {
              const { augment, currentLevel, currentStacks, currentOutcome, stackLadder } = item
              const currentLevelConfig = augment.levels.find((l) => l.level === currentLevel) ?? augment.levels[0]!
              const activeStacking = currentLevelConfig.stacking ?? augment.stacking
              const isStacking = activeStacking !== undefined
              const dpsGain = currentOutcome.dpsPercentGain

              return (
                <div
                  key={augment.id}
                  className={`augment-card tier-${augment.tier}`}
                >
                  <div className="aug-header">
                    <div className="aug-title-group">
                      <span className={`aug-tier-tag tier-bg-${augment.tier}`}>
                        {AUGMENT_TIER_LABELS[augment.tier]}
                      </span>
                      <span className="aug-name">{augment.name}</span>
                    </div>

                    {/* 符文等级切换器 (Lv.1 ~ Lv.3) */}
                    <div className="aug-level-controls">
                      {augment.levels.map((lvl) => (
                        <button
                          type="button"
                          key={lvl.level}
                          className={`btn-aug-level ${currentLevel === lvl.level ? 'active' : ''}`}
                          onClick={() => onSetAugmentLevel(augment.id, lvl.level)}
                          title={`切换至 ${lvl.level} 级属性`}
                        >
                          Lv.{lvl.level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="aug-desc">{currentLevelConfig.description}</div>

                  {/* 核心收益指标 */}
                  <div className="aug-dps-box">
                    <div className="dps-row">
                      <span className="dps-label">
                        当前收益 (Lv.{currentLevel}{isStacking && activeStacking ? ` · ${currentStacks} ${activeStacking.stepName}` : ''}):
                      </span>
                      <span className="dps-value highlight-text">
                        +{dpsGain.toFixed(2)}%
                      </span>
                    </div>
                    <div className="dps-sub-detail">
                      秒伤提升: +{Math.round(currentOutcome.dpsAbsoluteGain)}/s
                    </div>
                  </div>

                  {/* 属性变化摘要 */}
                  <div className="aug-delta-box">
                    <span className="delta-label">属性增量:</span>
                    <span className="delta-val">{currentOutcome.statsDeltaSummary}</span>
                  </div>

                  {/* 叠层型符文控制器（暴击律动、致命节奏、热身动作等） */}
                  {isStacking && activeStacking && (
                    <div className="stacking-control-section">
                      <div className="stack-ladder-header">
                        <span className="ladder-title">阶梯层数快速预览:</span>
                      </div>
                      <div className="stack-buttons-row">
                        {stackLadder.map((step) => (
                          <button
                            type="button"
                            key={step.stacks}
                            className={`btn-stack-step ${currentStacks === step.stacks ? 'active' : ''}`}
                            onClick={() => onSetAugmentStack(augment.id, step.stacks)}
                          >
                            {step.stacks === 0
                              ? '0层'
                              : step.stacks === activeStacking.maxStacks
                              ? `满层 (${step.stacks})`
                              : `${step.stacks}层`}
                            <span className="step-gain">+{step.dpsPercentGain.toFixed(1)}%</span>
                          </button>
                        ))}
                      </div>

                      <div className="stack-slider-wrap">
                        <div className="slider-label-row">
                          <span>微调层数: {currentStacks} / {activeStacking.maxStacks} {activeStacking.stepName}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={activeStacking.maxStacks}
                          value={currentStacks}
                          onChange={(e) => onSetAugmentStack(augment.id, Number(e.target.value))}
                          className="form-slider"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
