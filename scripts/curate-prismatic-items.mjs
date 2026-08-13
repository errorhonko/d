import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const patch = '26.15'
const dataDragonVersion = '16.15.1'
const source = `data/sources/riot-data-dragon/${dataDragonVersion}/zh_CN/item.json`
const output = `data/curated/prismatic-items/${patch}.json`

const dataDragon = JSON.parse(await readFile(source, 'utf8'))

// Data Dragon 保留静态面板，但会把部分动态 tooltip 参数裁成 0。
// 以下数值来自同版本 CommunityDragon Items/*.cdtb.bin.json。
const arenaCombatOverrides = new Map([
  [443069, {
    dpsEffects: [{
      kind: 'hamstringer_bleed',
      level1Damage: 20,
      level18Damage: 80,
      triggeringDamageRatio: 0.25,
    }],
  }],
  [446671, {
    dpsEffects: [{
      kind: 'galeforce_active',
      level1Damage: 150,
      level9Damage: 170,
      damagePerLevelAfter9: 20,
      bonusAttackDamageRatio: 0.8,
      maximumMissingHealthAmp: 0.5,
      maximumAmpAtTargetHealthPercent: 25,
    }],
  }],
  [443090, {
    adaptiveForce: 40,
    multiplicativeAttackSpeedPercent: 15,
    dpsEffects: [{
      kind: 'reapers_toll',
      rangedMaxHealthRatio: 0.005,
      ratioIncreasePerHit: 0.001,
    }],
  }],
  [443060, {
    adaptiveForce: 110,
    dpsEffects: [{
      kind: 'sword_of_the_divine',
      critChanceToMaximumBonusCritDamage: 0.5,
      benefitingCritChanceCap: 50,
    }],
  }],
  [443055, {
    dpsEffects: [{
      kind: 'fulmination',
      targetCurrentHealthRatio: 0.13,
    }],
  }],
  [443081, {
    dpsEffects: [{
      kind: 'hexbolt_companion',
      cooldownSeconds: 10,
      level1Damage: 50,
      level18Damage: 100,
    }],
  }],
])

const statFields = [
  ['FlatHPPoolMod', 'health'],
  ['FlatPhysicalDamageMod', 'attack_damage'],
  ['FlatMagicDamageMod', 'ability_power'],
  ['FlatArmorMod', 'armor'],
  ['FlatSpellBlockMod', 'magic_resistance'],
]

const items = Object.entries(dataDragon.data)
  .filter(([, item]) =>
    item.maps?.['30'] === true &&
    item.gold?.purchasable === true &&
    item.gold?.base === 2750,
  )
  .map(([id, item]) => {
    const numericId = Number(id)
    return {
      id: numericId,
      name: item.name,
      staticStats: Object.fromEntries(
        statFields.flatMap(([sourceKey, targetKey]) => {
          const value = item.stats?.[sourceKey]
          return typeof value === 'number' && value !== 0 ? [[targetKey, value]] : []
        }),
      ),
      bonusAttackSpeedPercent: (item.stats?.PercentAttackSpeedMod ?? 0) * 100,
      criticalStrikeChance: (item.stats?.FlatCritChanceMod ?? 0) * 100,
      movementSpeedPercent: (item.stats?.PercentMovementSpeedMod ?? 0) * 100,
      ...arenaCombatOverrides.get(numericId),
    }
  })
  .sort((left, right) => left.id - right.id)

if (items.length !== 48) {
  throw new Error(`预期 48 件棱彩装备，实际得到 ${items.length} 件`)
}

await writeFile(
  output,
  `${JSON.stringify({
    schemaVersion: 1,
    patch,
    dataDragonVersion,
    locale: 'zh_CN',
    source,
    classificationSource: {
      type: 'Riot Data Dragon Arena item metadata',
      rule: 'maps[30] = true, purchasable = true, gold.base = 2750',
      verifiedAt: '2026-08-13',
    },
    combatEffectSource: {
      type: 'CommunityDragon item game data',
      path: 'game/items.cdtb.bin.json',
      verifiedAt: '2026-08-13',
      modeledItemIds: [...arenaCombatOverrides.keys()],
    },
    items,
  }, null, 2)}\n`,
)

console.log(`已生成 ${items.length} 件棱彩装备：${path.resolve(output)}`)
