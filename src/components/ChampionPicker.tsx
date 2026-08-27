import { useState, useMemo } from 'react'
import { championCatalog, type ChampionInitialStats } from '../domain/champions'

interface ChampionPickerProps {
  selectedChampion: ChampionInitialStats
  onSelectChampion: (champion: ChampionInitialStats) => void
}

const TAG_LABELS: Record<string, string> = {
  ALL: '全部',
  Marksman: '射手',
  Fighter: '战士',
  Mage: '法师',
  Assassin: '刺客',
  Tank: '坦克',
  Support: '辅助',
}

export function ChampionPicker({
  selectedChampion,
  onSelectChampion,
}: ChampionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('ALL')

  const filteredChampions = useMemo(() => {
    return championCatalog.champions.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.key.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase())

      const matchTag = activeTag === 'ALL' || c.tags.includes(activeTag)

      return matchSearch && matchTag
    })
  }, [search, activeTag])

  return (
    <div className="champion-picker-container">
      <div className="selected-champion-trigger" onClick={() => setIsOpen(true)}>
        <div className="champion-avatar-box">
          <span className="champion-key-tag">{selectedChampion.key.slice(0, 3)}</span>
        </div>
        <div className="champion-info-text">
          <div className="champion-name-row">
            <span className="champion-name-zh">{selectedChampion.name}</span>
            <span className="champion-title-zh">{selectedChampion.title}</span>
          </div>
          <div className="champion-tags-row">
            {selectedChampion.tags.map((t) => (
              <span key={t} className="tag-badge">
                {TAG_LABELS[t] ?? t}
              </span>
            ))}
            <span className="tag-ratio">
              攻速收益: {selectedChampion.base.attackSpeedRatio.toFixed(3)}
            </span>
          </div>
        </div>
        <button type="button" className="btn-change-champion">
          切换英雄 ▾
        </button>
      </div>

      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择英雄 ({championCatalog.champions.length})</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="filter-controls">
              <input
                type="text"
                className="search-input"
                placeholder="搜索英雄名称、称号或英文名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />

              <div className="tag-tabs">
                {Object.entries(TAG_LABELS).map(([tagKey, label]) => (
                  <button
                    type="button"
                    key={tagKey}
                    className={`tag-tab ${activeTag === tagKey ? 'active' : ''}`}
                    onClick={() => setActiveTag(tagKey)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="champion-grid">
              {filteredChampions.map((champion) => {
                const isSelected = champion.key === selectedChampion.key
                return (
                  <div
                    key={champion.key}
                    className={`champion-grid-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectChampion(champion)
                      setIsOpen(false)
                    }}
                  >
                    <div className="grid-avatar-placeholder">
                      {champion.key.slice(0, 2)}
                    </div>
                    <div className="grid-info">
                      <span className="grid-name">{champion.name}</span>
                      <span className="grid-title">{champion.title}</span>
                    </div>
                  </div>
                )
              })}
              {filteredChampions.length === 0 && (
                <div className="empty-tip">未找到匹配的英雄</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
