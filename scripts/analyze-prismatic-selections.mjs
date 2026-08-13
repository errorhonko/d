import { readFile, readdir, writeFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import path from 'node:path'

const sampleDirectory = 'data/sources/riot-api/kr/arena-100'
const rawDirectory = '.cache/riot-api/kr'
const categoryFile = 'data/curated/arena-resistances/kr-26.15-100/champion-categories.json'
const itemFile = 'data/curated/prismatic-items/26.15.json'
const output = 'data/curated/prismatic-items/kr-26.15-100-selection-probabilities.json'

const [summary, categories, itemCatalog, rawFiles] = await Promise.all([
  readFile(path.join(sampleDirectory, 'summary.json'), 'utf8').then(JSON.parse),
  readFile(categoryFile, 'utf8').then(JSON.parse),
  readFile(itemFile, 'utf8').then(JSON.parse),
  readdir(rawDirectory),
])

const acceptedMatchIds = new Set(summary.matches.map(({ matchId }) => matchId))
const categoryByChampionId = new Map(
  categories.map(({ championId, primaryCategory }) => [championId, primaryCategory]),
)
const itemsById = new Map(itemCatalog.items.map((item) => [item.id, item]))
const matchFiles = rawFiles.filter((file) => {
  const matchId = file.replace(/\.match\.json\.gz$/, '')
  return file.endsWith('.match.json.gz') && acceptedMatchIds.has(matchId)
})

if (matchFiles.length !== summary.collectedMatches) {
  throw new Error(`原始 Match 缓存不完整：需要 ${summary.collectedMatches}，找到 ${matchFiles.length}`)
}

const byCategory = new Map()

function categoryAccumulator(category) {
  if (!byCategory.has(category)) {
    byCategory.set(category, {
      category,
      participants: 0,
      recognizedParticipants: 0,
      excludedWithoutPrismaticItem: 0,
      playersWithMultiplePrismaticItems: 0,
      weightsByItemId: new Map(),
    })
  }
  return byCategory.get(category)
}

for (const file of matchFiles) {
  const match = JSON.parse(gunzipSync(await readFile(path.join(rawDirectory, file))))
  for (const participant of match.info.participants) {
    const category = categoryByChampionId.get(participant.championId)
    if (!category) continue

    const accumulator = categoryAccumulator(category)
    accumulator.participants += 1
    const itemIds = [...new Set(
      [0, 1, 2, 3, 4, 5, 6]
        .map((slot) => participant[`item${slot}`])
        .filter((itemId) => itemsById.has(itemId)),
    )]

    if (itemIds.length === 0) {
      accumulator.excludedWithoutPrismaticItem += 1
      continue
    }

    accumulator.recognizedParticipants += 1
    if (itemIds.length > 1) accumulator.playersWithMultiplePrismaticItems += 1
    const playerWeight = 1 / itemIds.length
    for (const itemId of itemIds) {
      accumulator.weightsByItemId.set(
        itemId,
        (accumulator.weightsByItemId.get(itemId) ?? 0) + playerWeight,
      )
    }
  }
}

const round = (value) => Number(value.toFixed(8))
const distributions = [...byCategory.values()]
  .sort((left, right) => left.category.localeCompare(right.category))
  .map((group) => ({
    category: group.category,
    participants: group.participants,
    recognizedParticipants: group.recognizedParticipants,
    excludedWithoutPrismaticItem: group.excludedWithoutPrismaticItem,
    playersWithMultiplePrismaticItems: group.playersWithMultiplePrismaticItems,
    items: [...group.weightsByItemId]
      .map(([itemId, weightedSelections]) => ({
        itemId,
        name: itemsById.get(itemId).name,
        weightedSelections: round(weightedSelections),
        probability: round(weightedSelections / group.recognizedParticipants),
      }))
      .sort((left, right) =>
        right.probability - left.probability || left.itemId - right.itemId,
      ),
  }))

await writeFile(
  output,
  `${JSON.stringify({
    schemaVersion: 1,
    patch: '26.15',
    sample: {
      platform: summary.platform,
      matches: summary.collectedMatches,
      collectedAt: summary.collectedAt,
    },
    methodology: {
      population: 'players grouped by champion primary category',
      observation: 'unique prismatic items retained in each participant final inventory',
      weighting: 'each recognized participant contributes total weight 1, divided equally across retained prismatic items',
      limitation: 'Riot timeline does not expose direct anvil-grant order; probabilities are player-normalized retained-item frequencies, not official offer or second-round first-pick rates',
    },
    distributions,
  }, null, 2)}\n`,
)

const marksman = distributions.find(({ category }) => category === 'Marksman')
console.log(`已生成射手棱彩装备分布：${marksman.recognizedParticipants}/${marksman.participants} 名玩家可识别`)
console.log(path.resolve(output))
