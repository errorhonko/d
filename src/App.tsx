import { AnvilRecommendation } from './components/AnvilRecommendation'
import { BuildEditor } from './components/BuildEditor'
import { ChampionPicker } from './components/ChampionPicker'
import { PrismaticRecommendation } from './components/PrismaticRecommendation'
import { StatPanel } from './components/StatPanel'
import { TargetSettings } from './components/TargetSettings'
import { useCalculatorState } from './hooks/useCalculatorState'
import './App.css'

function App() {
  const calculator = useCalculatorState()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">ARENA · PATCH 26.15</p>
          <h1>斗魂射手收益计算器</h1>
          <p className="app-intro">
            将英雄等级、棱彩装备、属性锻造器和目标双抗放进同一套模型，实时比较伤害与生存收益。
          </p>
        </div>
        <div className="model-status"><span className="status-dot" />数值模型已连接</div>
      </header>

      <main className="dashboard">
        <section className="section-block">
          <div className="section-heading"><span>01</span><div><h2>选择英雄与战斗环境</h2><p>目标双抗来自韩服斗魂样本，可切换英雄定位、回合和统计口径。</p></div></div>
          <ChampionPicker selectedChampion={calculator.selectedChampion} onSelectChampion={calculator.setSelectedChampion} />
          <div className="configuration-grid">
            <BuildEditor
              level={calculator.level}
              setLevel={calculator.setLevel}
              selectedPrismaticItemId={calculator.selectedPrismaticItemId}
              setSelectedPrismaticItemId={calculator.setSelectedPrismaticItemId}
              selectedPrismaticItem={calculator.selectedPrismaticItem}
              shardbladePercent={calculator.shardbladePercent}
              setShardbladePercent={calculator.setShardbladePercent}
              dragonSouls={calculator.dragonSouls}
              setDragonSouls={calculator.setDragonSouls}
              roundWins={calculator.roundWins}
              setRoundWins={calculator.setRoundWins}
              roundLosses={calculator.roundLosses}
              setRoundLosses={calculator.setRoundLosses}
              sovereignTakedowns={calculator.sovereignTakedowns}
              setSovereignTakedowns={calculator.setSovereignTakedowns}
              selectedAnvils={calculator.selectedAnvils}
              onAddAnvil={calculator.handleAddAnvil}
              onRemoveAnvil={calculator.handleRemoveAnvil}
              onClearAnvils={calculator.handleClearAnvils}
            />
            <div className="summary-column">
              <TargetSettings
                targetCategory={calculator.targetCategory}
                setTargetCategory={calculator.setTargetCategory}
                targetRound={calculator.targetRound}
                setTargetRound={calculator.setTargetRound}
                targetStatistic={calculator.targetStatistic}
                setTargetStatistic={calculator.setTargetStatistic}
                arenaTarget={calculator.arenaTarget}
              />
              <StatPanel calculationResult={calculator.calculationResult} currentDps={calculator.currentDps} />
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><span>02</span><div><h2>比较下一次锻造</h2><p>包含购买费用、过路费、DPS 与双抗有效生命收益。</p></div></div>
          <AnvilRecommendation simulation={calculator.anvilSimulation} onAdoptAnvil={calculator.handleAddAnvil} />
        </section>

        <section className="section-block">
          <div className="section-heading"><span>03</span><div><h2>装备与强化符文推荐</h2><p>按当前构建重新计算棱彩装备和 AD 强化符文的边际收益。</p></div></div>
          <PrismaticRecommendation
            prismaticRecommendations={calculator.prismaticRecommendations}
            augmentBenefits={calculator.augmentBenefits}
            onSetAugmentLevel={calculator.setAugmentLevel}
            onSetAugmentStack={calculator.setAugmentStack}
            currentPrismaticId={calculator.selectedPrismaticItemId}
            onSelectPrismatic={calculator.setSelectedPrismaticItemId}
          />
        </section>
      </main>

      <footer className="app-footer">结果是基于固定版本数据的期望值模型，不包含走位、技能循环和临场操作损失。</footer>
    </div>
  )
}

export default App
