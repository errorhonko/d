import { useState, useMemo } from 'react'
import {
  prismaticItemCatalog,
  type PrismaticItem,
} from '../domain/prismatic-items'
import {
  statAnvilCatalog,
  type AnvilOption,
  type AnvilTier,
  type StatKey,
} from '../domain/stat-anvils'
import type { SelectedAnvil } from '../hooks/useCalculatorState'

interface BuildEditorProps {
  level: number
  setLevel: (lvl: number) => void
  selectedPrismaticItemId: number | null
  setSelectedPrismaticItemId: (id: number | null) => void
  selectedPrismaticItem?: PrismaticItem
  shardbladePercent: number
  setShardbladePercent: (pct: number) => void
  dragonSouls: number
  setDragonSouls: (num: number) => void
  roundWins: number
  setRoundWins: (num: number) => void
  roundLosses: number
  setRoundLosses: (num: number) => void
  sovereignTakedowns: number
  setSovereignTakedowns: (num: number) => void
  selectedAnvils: SelectedAnvil[]
  onAddAnvil: (option: AnvilOption) => void
  onRemoveAnvil: (id: string) => void
  onClearAnvils: () => void
}

const TIER_LABELS: Record<AnvilTier, string> = {
  silver: '白银',
  gold: '黄金',
  prismatic: '棱彩',
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

export function BuildEditor({
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
  onAddAnvil,
  onRemoveAnvil,
  onClearAnvils,
}: BuildEditorProps) {
  const [anvilModalOpen, setAnvilModalOpen] = useState(false)
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all')

  const allAnvilOptions = useMemo(() => {
    return Object.values(statAnvilCatalog.optionsByTier).flat()
  }, [])

  const filteredOptions = useMemo(() => {
    return allAnvilOptions.filter((opt) => {
      if (selectedTierFilter === 'all') return true
      return opt.tier === selectedTierFilter
    })
  }, [allAnvilOptions, selectedTierFilter])

  return (
    <div className="card build-editor-card">
      <div className="card-header">
        <h4>⚙️ 状态与装备配置</h4>
      </div>

      {/* 等级选择 */}
      <div className="form-group level-control">
        <div className="level-header">
          <label>英雄等级: Lv.{level}</label>
          <div className="level-quick-buttons">
            {[3, 6, 9, 11, 16, 18].map((lvl) => (
              <button
                type="button"
                key={lvl}
                className={`btn-lvl-quick ${level === lvl ? 'active' : ''}`}
                onClick={() => setLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={18}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="form-slider"
        />
      </div>

      {/* 棱彩装备选择 */}
      <div className="form-group">
        <label>当前持有的棱彩装备</label>
        <select
          value={selectedPrismaticItemId ?? ''}
          onChange={(e) =>
            setSelectedPrismaticItemId(e.target.value ? Number(e.target.value) : null)
          }
          className="form-select"
        >
          <option value="">(无棱彩装备)</option>
          {prismaticItemCatalog.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* 装备特定状态配置 */}
      {selectedPrismaticItem && (
        <div className="item-special-states">
          {selectedPrismaticItem.id === 447106 && ( // 巨龙之心
            <div className="form-group-inline">
              <label>已持有龙魂数:</label>
              <input
                type="number"
                min={0}
                max={6}
                value={dragonSouls}
                onChange={(e) => setDragonSouls(Number(e.target.value))}
                className="form-input-number"
              />
            </div>
          )}
          {selectedPrismaticItem.id === 443056 && ( // 恶魔之冠
            <div className="form-group-row">
              <div className="form-group-inline">
                <label>获胜回合:</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={roundWins}
                  onChange={(e) => setRoundWins(Number(e.target.value))}
                  className="form-input-number"
                />
              </div>
              <div className="form-group-inline">
                <label>失败回合:</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={roundLosses}
                  onChange={(e) => setRoundLosses(Number(e.target.value))}
                  className="form-input-number"
                />
              </div>
            </div>
          )}
          {selectedPrismaticItem.id === 447115 && ( // 弑君者 / 至高天
            <div className="form-group-inline">
              <label>至高天击败数:</label>
              <input
                type="number"
                min={0}
                max={20}
                value={sovereignTakedowns}
                onChange={(e) => setSovereignTakedowns(Number(e.target.value))}
                className="form-input-number"
              />
            </div>
          )}
        </div>
      )}

      {/* 碎片之刃增幅 */}
      <div className="form-group">
        <div className="label-with-tip">
          <label>碎片之刃锻造增幅: {shardbladePercent}%</label>
          <span className="tip-text">放大后续锻造属性</span>
        </div>
        <input
          type="range"
          min={100}
          max={200}
          step={5}
          value={shardbladePercent}
          onChange={(e) => setShardbladePercent(Number(e.target.value))}
          className="form-slider"
        />
      </div>

      {/* 已选属性锻造器列表 */}
      <div className="anvils-section">
        <div className="anvils-header">
          <label>已选择的锻造器 ({selectedAnvils.length})</label>
          <div className="anvils-actions">
            <button
              type="button"
              className="btn-text-action"
              onClick={onClearAnvils}
            >
              清空
            </button>
            <button
              type="button"
              className="btn-add-anvil"
              onClick={() => setAnvilModalOpen(true)}
            >
              + 手动添加
            </button>
          </div>
        </div>

        <div className="anvils-list">
          {selectedAnvils.length === 0 ? (
            <div className="empty-anvils-tip">
              暂未选择任何属性锻造器。可以在下方直接点击“采纳推荐”添加！
            </div>
          ) : (
            selectedAnvils.map((anvil, idx) => (
              <div key={anvil.id} className={`anvil-tag-item tier-${anvil.option.tier}`}>
                <span className="anvil-tier-dot" />
                <span className="anvil-tag-name">
                  #{idx + 1} [{TIER_LABELS[anvil.option.tier]}] {anvil.option.name}
                </span>
                <button
                  type="button"
                  className="btn-remove-tag"
                  onClick={() => onRemoveAnvil(anvil.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 手动添加锻造器弹窗 */}
      {anvilModalOpen && (
        <div className="modal-backdrop" onClick={() => setAnvilModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择属性锻造器</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setAnvilModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="tag-tabs">
              <button
                type="button"
                className={`tag-tab ${selectedTierFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('all')}
              >
                全部品阶
              </button>
              <button
                type="button"
                className={`tag-tab ${selectedTierFilter === 'silver' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('silver')}
              >
                白银
              </button>
              <button
                type="button"
                className={`tag-tab ${selectedTierFilter === 'gold' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('gold')}
              >
                黄金
              </button>
              <button
                type="button"
                className={`tag-tab ${selectedTierFilter === 'prismatic' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('prismatic')}
              >
                棱彩
              </button>
            </div>

            <div className="anvil-options-grid">
              {filteredOptions.map((opt) => (
                <div
                  key={`${opt.tier}-${opt.id}`}
                  className={`anvil-option-card tier-${opt.tier}`}
                  onClick={() => {
                    onAddAnvil(opt)
                    setAnvilModalOpen(false)
                  }}
                >
                  <div className="opt-tier-badge">{TIER_LABELS[opt.tier]}</div>
                  <div className="opt-name">{opt.name}</div>
                  <div className="opt-desc">{formatAnvilEffects(opt.effects)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
