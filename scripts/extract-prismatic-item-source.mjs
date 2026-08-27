import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const input = process.argv[2]
if (!input) {
  throw new Error('用法：node scripts/extract-prismatic-item-source.mjs <items.cdtb.bin.json>')
}

const patch = '26.15'
const communityDragonVersion = '16.15'
const output = `data/sources/communitydragon/items/${communityDragonVersion}-prismatic-items.json`
const catalog = JSON.parse(
  await readFile(`data/curated/prismatic-items/${patch}.json`, 'utf8'),
)
const source = JSON.parse(await readFile(input, 'utf8'))

const numericFieldNames = [
  'mAbilityHasteMod',
  'mFlatArmorMod',
  'mFlatAttackRangeMod',
  'mFlatCritChanceMod',
  'mFlatHPPoolMod',
  'mFlatMagicDamageMod',
  'mFlatMagicPenetrationMod',
  'mFlatPhysicalDamageMod',
  'mFlatSpellBlockMod',
  'mPercentAttackSpeedMod',
  'mPercentHealingAmountMod',
  'mPercentMovementSpeedMod',
  'mPercentMultiplicativeAttackSpeedMod',
  'mPercentTenacityItemMod',
  'PercentOmnivampMod',
  'PhysicalLethality',
  'flatMPPoolMod',
  'percentBaseMPRegenMod',
]

const items = catalog.items.map(({ id, name }) => {
  const item = source[`Items/${id}`]
  if (!item) throw new Error(`CommunityDragon 中找不到装备：${id} ${name}`)

  return {
    id,
    name,
    numericFields: Object.fromEntries(
      numericFieldNames.flatMap((field) =>
        typeof item[field] === 'number' ? [[field, item[field]]] : [],
      ),
    ),
    dataValues: Object.fromEntries(
      (item.mDataValues ?? []).flatMap((entry) =>
        typeof entry.mValue === 'number' ? [[entry.mName, entry.mValue]] : [],
      ),
    ),
    calculations: item.mItemCalculations ?? {},
  }
})

await mkdir(path.dirname(output), { recursive: true })
await writeFile(
  output,
  `${JSON.stringify({
    schemaVersion: 1,
    patch,
    communityDragonVersion,
    source: `https://raw.communitydragon.org/${communityDragonVersion}/game/items.cdtb.bin.json`,
    items,
  }, null, 2)}\n`,
)

console.log(`已提取 ${items.length} 件棱彩装备客户端参数：${path.resolve(output)}`)
