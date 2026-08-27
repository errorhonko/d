import type {
  RangedChampionCalculationResult,
  RangedDpsResult,
} from '../domain/calculation'

interface StatPanelProps {
  calculationResult: RangedChampionCalculationResult
  currentDps: RangedDpsResult
}

export function StatPanel({
  calculationResult,
  currentDps,
}: StatPanelProps) {
  const { finalStats, finalDefense, goldGained } = calculationResult

  return (
    <div className="card stat-panel-card">
      <div className="card-header">
        <h4>📊 当前综合面板</h4>
        <span className="gold-badge">💰 累计经济: +{Math.round(goldGained)} G</span>
      </div>

      <div className="dps-banner">
        <div className="dps-main">
          <span className="dps-label">对目标实际秒伤 (DPS)</span>
          <span className="dps-number">{Math.round(currentDps.totalDps)}</span>
        </div>
        <div className="dps-breakdown">
          <div className="dps-sub-item">
            <span className="dps-sub-label">物理 DPS:</span>
            <span className="dps-sub-val ad-text">{Math.round(currentDps.physical.afterMitigation)}</span>
          </div>
          <div className="dps-sub-item">
            <span className="dps-sub-label">魔法 DPS:</span>
            <span className="dps-sub-val ap-text">{Math.round(currentDps.magic.afterMitigation)}</span>
          </div>
          <div className="dps-sub-item">
            <span className="dps-sub-label">真实 DPS:</span>
            <span className="dps-sub-val true-text">{Math.round(currentDps.true.afterMitigation)}</span>
          </div>
        </div>
      </div>

      <div className="stats-matrix">
        <div className="stat-box">
          <span className="stat-title">生命值</span>
          <span className="stat-val hp-text">{Math.round(finalStats.health)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">攻击力 (AD)</span>
          <span className="stat-val ad-text">{Math.round(finalStats.attack_damage)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">攻击速度 (AS)</span>
          <span className="stat-val as-text">{finalStats.attack_speed.toFixed(2)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">暴击几率</span>
          <span className="stat-val crit-text">
            {Math.round(finalStats.critical_strike_chance ?? 0)}%
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-title">护甲</span>
          <span className="stat-val armor-text">{Math.round(finalStats.armor)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">魔法抗性</span>
          <span className="stat-val mr-text">{Math.round(finalStats.magic_resistance)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">护甲穿透</span>
          <span className="stat-val pen-text">
            {Math.round(finalStats.armor_penetration_percent ?? 0)}% + {Math.round(finalStats.lethality ?? 0)} 穿甲
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-title">法术强度 (AP)</span>
          <span className="stat-val ap-text">{Math.round(finalStats.ability_power ?? 0)}</span>
        </div>
      </div>

      <div className="defense-summary-row">
        <div className="defense-pill">
          <span className="def-label">物理有效生命 (EHP):</span>
          <span className="def-val">{Math.round(finalDefense.physicalEffectiveHealth)}</span>
        </div>
        <div className="defense-pill">
          <span className="def-label">魔法有效生命 (EHP):</span>
          <span className="def-val">{Math.round(finalDefense.magicEffectiveHealth)}</span>
        </div>
      </div>
    </div>
  )
}
