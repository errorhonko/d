# 斗魂锻体计算器

一个用于《英雄联盟》斗魂竞技场“斗魂锻体”玩法的网页计算器。当前仓库已完成前端工程初始化，业务功能将按 [PLAN.md](./PLAN.md) 逐步实现。

## 技术栈

- React 19 + TypeScript
- Vite 8
- pnpm 11
- Oxlint

## 环境要求

- Node.js 24 或更高版本
- pnpm 11 或更高版本

项目根目录提供了 `.nvmrc`。使用 nvm-windows 时可先执行 `nvm use 24`；未安装 pnpm 时可执行 `corepack enable`。

## 本地开发

```bash
pnpm install
pnpm dev
```

默认访问地址为 `http://localhost:5173`。

## 工程检查

```bash
pnpm lint
pnpm build
pnpm preview
```

`pnpm-lock.yaml` 应提交到版本库，以保证团队和部署环境使用一致的依赖版本。

## 英雄初始属性

`championCatalog` 保存 26.15 版本的 173 位英雄，包括简体中文名称、1 级基础属性和每级成长字段：

```ts
import {
  championCatalog,
  championCalculationBase,
  championInitialStatBlock,
} from './src/domain/champions'

const ashe = championCatalog.championsByKey.get('Ashe')
console.log(ashe?.base.attackDamage)
console.log(ashe?.growth.attackSpeedPercent)

if (ashe) {
  const initialStats = championInitialStatBlock(ashe)
  console.log(initialStats.health)
  console.log(championCalculationBase(ashe).attackSpeedRatio)
}
```

`championInitialStatBlock` 可以把英雄数据转换为属性块；`championCalculationBase` 会同时带入英雄独立的攻速收益系数，可直接展开到锻体计算输入。基础数据来自版本化的 Riot Data Dragon 快照，攻击力成长与攻速收益系数由固定版本的 League Wiki 加工快照补充。运行 `pnpm data:champions:curate` 可重复生成业务数据；详情见 [`data/curated/champions/README.md`](./data/curated/champions/README.md)。

### 斗魂锻体属性来源

`arenaChampionCalculationInput` 按模式规则分开组合英雄等级属性、第二回合棱彩装备的静态属性、历次属性锻造器和最终碎片之刃增幅。符文、英雄特殊机制和装备被动不会被偷偷混入初始属性，需由调用方在对应的伤害或特殊机制模型中显式提供。

```ts
const input = arenaChampionCalculationInput({
  champion: ashe,
  level: 18,
  prismaticItemStats: { attack_damage: 70, health: 500 },
  statAnvils: selections,
  shardbladeEffectivenessPercent: 120,
})
```

## 射手英雄计算核心

计算器目前提供远程英雄版本的纯函数接口：

```ts
import {
  calculateRangedChampion,
  findStatAnvilOption,
} from './src/domain/calculation'

const result = calculateRangedChampion({
  initialStats: {
    health: 2000,
    attack_damage: 100,
    attack_speed: 0.7,
    movement_speed: 350,
  },
  attackSpeedRatio: 0.65,
  selections: [
    { option: findStatAnvilOption('silver', 'attack_damage') },
    { option: findStatAnvilOption('gold', 'attack_speed') },
  ],
})

console.log(result.finalStats)
console.log(result.steps)
```

百分比属性使用百分数口径，例如 `25` 表示 `25%`。`steps` 包含每次选择前后的完整属性、属性增量和金币变化，可直接用于后续界面的逐轮明细。

### 护甲与魔抗

计算结果的 `initialDefense` 和 `finalDefense` 会分别给出物理、魔法伤害倍率、减伤百分比和有效生命值。正抗性的伤害倍率为 `100 / (100 + resistance)`；负抗性使用 `2 - 100 / (100 - resistance)`。

```ts
console.log(result.finalDefense.armor.damageReductionPercent)
console.log(result.finalDefense.physicalEffectiveHealth)
```

当前防御摘要使用英雄自身最终双抗，尚未代入攻击者的抗性削减、百分比穿透和固定穿透。

## 射手秒伤模型

`calculateRangedDps` 使用射手的最终属性，对固定护甲、魔抗目标计算期望秒伤：

```ts
import { calculateRangedDps } from './src/domain/calculation'

const dps = calculateRangedDps({
  stats: result.finalStats,
  target: { armor: 100, magicResistance: 80 },
  profile: {
    magicOnHitPerAttack: 30,
    additionalPhysicalDps: 50,
  },
})

console.log(dps.physical.afterMitigation)
console.log(dps.magic.afterMitigation)
console.log(dps.totalDps)
```

普攻 AD 部分的暴击期望倍率为 `1 + 暴击率 × (暴击伤害倍率 - 1)`。原始物理、魔法和真实秒伤分别结算；百分比穿透先于固定穿透，真实伤害不受双抗影响。

首版暂不处理技能施放循环、攻击前后摇、走位损失、攻速上限、动态减抗和目标防御随时间变化。

## 锻造器收益

`calculateRangedAnvilBenefit` 会在当前全部锻体选择之后追加一个候选碎片，分别重算前后 DPS、防御有效生命和金币：

```ts
import {
  calculateRangedAnvilBenefit,
  findStatAnvilOption,
} from './src/domain/calculation'

const benefit = calculateRangedAnvilBenefit({
  champion: calculationInput,
  target: { armor: 100, magicResistance: 80 },
  candidate: {
    option: findStatAnvilOption('gold', 'attack_speed'),
  },
})

console.log(benefit.totalDps.absolute)
console.log(benefit.totalDps.percent)
```

候选收益使用 `候选后数值 - 当前数值`；百分比收益使用 `(候选后数值 / 当前数值 - 1) × 100%`。攻击属性主要比较 DPS，生命和双抗分别比较物理/魔法有效生命，经济碎片比较金币。基准值为 0 时，百分比收益返回 `null`。

调用 `simulateSingleStatAnvilPurchase` 可以模拟购买一次 750 金币的属性锻造器：结果按照本次随机到的白银、黄金、棱彩品质分组，分别列出 13、13、10 种属性结果。每项结果同时包含属性增量、DPS、物理/魔法有效生命和金币收益；应按碎片影响的指标展示，而不是把所有碎片只按 DPS 排序。当前规则数据没有公布三个品质的出现概率，因此接口不会编造跨品质期望收益，`tierProbabilities` 返回 `null`。

### 按敌方大类和回合计算收益

韩服 26.15 的 100 场斗魂样本已经加工为“敌方英雄主类别 × 回合”双抗。默认使用双抗
中位数，并一次比较指定品质的全部锻体选项：

```ts
import { calculateCategoryRoundAnvilBenefits } from './src/domain/calculation'

const comparison = calculateCategoryRoundAnvilBenefits({
  champion: calculationInput,
  targetCategory: 'Marksman',
  round: 10,
  tier: 'gold',
})

console.log(comparison.target.armor)
console.log(comparison.target.magicResistance)
console.log(comparison.benefits)
```

目标类别支持 `Marksman`、`Fighter`、`Mage`、`Assassin`、`Tank` 和 `Support`。
`statistic` 可选 `median`（默认）、`mean`、`p25` 或 `p75`。第 13 回合置信度为中等，
第 14 回合以后为低；界面应同时展示 `observations` 和 `confidence`。
