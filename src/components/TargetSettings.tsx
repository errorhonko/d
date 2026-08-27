import type {
  ArenaCategoryRoundTarget,
  ArenaChampionCategory,
  ArenaTargetStatistic,
} from '../domain/calculation'
import { ARENA_CHAMPION_CATEGORIES } from '../domain/calculation'

interface TargetSettingsProps {
  targetCategory: ArenaChampionCategory
  setTargetCategory: (category: ArenaChampionCategory) => void
  targetRound: number
  setTargetRound: (round: number) => void
  targetStatistic: ArenaTargetStatistic
  setTargetStatistic: (stat: ArenaTargetStatistic) => void
  arenaTarget: ArenaCategoryRoundTarget
}

const CATEGORY_NAMES_ZH: Record<ArenaChampionCategory, string> = {
  Marksman: '射手',
  Fighter: '战士',
  Mage: '法师',
  Assassin: '刺客',
  Tank: '坦克',
  Support: '辅助',
}

const STATISTIC_LABELS: Record<ArenaTargetStatistic, string> = {
  median: '中位数 (标准)',
  mean: '均值',
  p25: 'P25 (脆皮/低抗)',
  p75: 'P75 (高抗/肉装)',
}

export function TargetSettings({
  targetCategory,
  setTargetCategory,
  targetRound,
  setTargetRound,
  targetStatistic,
  setTargetStatistic,
  arenaTarget,
}: TargetSettingsProps) {
  return (
    <div className="card target-settings-card">
      <div className="card-header">
        <h4>🎯 对战目标环境 (假想敌)</h4>
        <span className="sample-badge">
          基于韩服 26.15 样本 ({arenaTarget.observations} 组数据)
        </span>
      </div>

      <div className="target-grid">
        <div className="form-group">
          <label>目标定位</label>
          <select
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value as ArenaChampionCategory)}
            className="form-select"
          >
            {ARENA_CHAMPION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_NAMES_ZH[cat]} ({cat})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>当前回合: 第 {targetRound} 轮</label>
          <input
            type="range"
            min={1}
            max={15}
            value={targetRound}
            onChange={(e) => setTargetRound(Number(e.target.value))}
            className="form-slider"
          />
        </div>

        <div className="form-group">
          <label>抗性采样口径</label>
          <select
            value={targetStatistic}
            onChange={(e) => setTargetStatistic(e.target.value as ArenaTargetStatistic)}
            className="form-select"
          >
            {Object.entries(STATISTIC_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="target-stat-pills">
        <div className="stat-pill">
          <span className="pill-label">目标护甲</span>
          <span className="pill-value armor-text">{Math.round(arenaTarget.armor)}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">目标魔抗</span>
          <span className="pill-value mr-text">{Math.round(arenaTarget.magicResistance)}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">样本置信度</span>
          <span className={`pill-value confidence-${arenaTarget.confidence}`}>
            {arenaTarget.confidence === 'high' ? '高' : arenaTarget.confidence === 'medium' ? '中' : '低'}
          </span>
        </div>
      </div>
    </div>
  )
}
