import { readFile, writeFile } from 'node:fs/promises'

const sourcePath =
  'data/sources/riot-data-dragon/16.15.1/zh_CN/champion.json'
const outputPath = 'data/curated/champions/26.15.json'

const source = JSON.parse(await readFile(sourcePath, 'utf8'))

const champions = Object.values(source.data)
  .filter((champion) => !champion.id.startsWith('Jade_'))
  .map((champion) => {
    const stats = champion.stats

    return {
      id: Number(champion.key),
      key: champion.id,
      name: champion.name,
      title: champion.title,
      tags: champion.tags,
      base: {
        health: stats.hp,
        resource: stats.mp,
        healthRegen: stats.hpregen,
        resourceRegen: stats.mpregen,
        attackDamage: stats.attackdamage,
        attackSpeed: stats.attackspeed,
        armor: stats.armor,
        magicResistance: stats.spellblock,
        movementSpeed: stats.movespeed,
        attackRange: stats.attackrange,
        criticalStrikeChance: stats.crit,
      },
      growth: {
        health: stats.hpperlevel,
        resource: stats.mpperlevel,
        healthRegen: stats.hpregenperlevel,
        resourceRegen: stats.mpregenperlevel,
        attackDamage: stats.attackdamageperlevel,
        attackSpeedPercent: stats.attackspeedperlevel,
        armor: stats.armorperlevel,
        magicResistance: stats.spellblockperlevel,
        criticalStrikeChance: stats.critperlevel,
      },
    }
  })
  .sort((left, right) => left.id - right.id)

const catalog = {
  schemaVersion: 1,
  patch: '26.15',
  dataDragonVersion: source.version,
  locale: 'zh_CN',
  updatedAt: '2026-08-13',
  championCount: champions.length,
  source:
    'https://ddragon.leagueoflegends.com/cdn/16.15.1/data/zh_CN/champion.json',
  notes: [
    '仅保留召唤师峡谷英雄；已排除 Data Dragon 中以 Jade_ 开头的模式单位。',
    'base 为 1 级基础属性，growth 为每级成长字段；实际等级属性需按游戏的非线性成长公式计算。',
    'Data Dragon 不提供独立的攻击速度收益系数，attackSpeed 仅表示 1 级基础攻速。',
  ],
  champions,
}

await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`已写入 ${champions.length} 位英雄：${outputPath}`)
