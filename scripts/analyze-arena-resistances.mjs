import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'

const inputDirectory = path.resolve('data/sources/riot-api/kr/arena-100')
const outputDirectory = path.resolve('data/curated/arena-resistances/kr-26.15-100')
const championDataUrl =
  'https://ddragon.leagueoflegends.com/cdn/16.15.1/data/zh_CN/champion.json'
const maximumLevelSignalRound = 12

const categoryNames = {
  Assassin: '刺客',
  Fighter: '战士',
  Mage: '法师',
  Marksman: '射手',
  Support: '辅助',
  Tank: '坦克',
  Unknown: '未分类',
}

function quantile(sortedValues, probability) {
  if (sortedValues.length === 0) return null
  const index = (sortedValues.length - 1) * probability
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedValues[lower]
  const weight = index - lower
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const sum = sorted.reduce((total, value) => total + value, 0)
  return {
    mean: sorted.length === 0 ? null : sum / sorted.length,
    p25: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    min: sorted[0] ?? null,
    max: sorted.at(-1) ?? null,
  }
}

function roundNumber(value, decimals = 2) {
  if (value === null) return null
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function csvCell(value) {
  const string = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string
}

async function fetchJsonWithRetry(url) {
  let lastError
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    } catch (error) {
      lastError = error
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
      }
    }
  }
  throw lastError
}

const [summary, observationsText, championResponse] = await Promise.all([
  readFile(path.join(inputDirectory, 'summary.json'), 'utf8').then(JSON.parse),
  readFile(path.join(inputDirectory, 'frame-observations.jsonl'), 'utf8'),
  fetchJsonWithRetry(championDataUrl),
])

const championById = new Map(
  Object.values(championResponse.data).map((champion) => [
    Number(champion.key),
    {
      championNameZh: champion.name,
      primaryCategory: champion.tags[0] || 'Unknown',
      categories: champion.tags,
    },
  ]),
)

const observations = observationsText
  .trim()
  .split(/\r?\n/)
  .map(JSON.parse)
  .filter((observation) => observation.timestamp >= 0)

const observationsByMatch = Map.groupBy(
  observations,
  (observation) => observation.matchId,
)
const representativeFrames = new Map()
const detectedRoundsByMatch = new Map()
const boundaryEvidenceByMatch = new Map()

const teamByMatchAndParticipant = new Map()
await Promise.all(
  [...observationsByMatch.keys()].map(async (matchId) => {
    const [compressedMatch, compressedTimeline] = await Promise.all([
      readFile(path.resolve('.cache/riot-api/kr', `${matchId}.match.json.gz`)),
      readFile(path.resolve('.cache/riot-api/kr', `${matchId}.timeline.json.gz`)),
    ])
    const match = JSON.parse(gunzipSync(compressedMatch))
    const timeline = JSON.parse(gunzipSync(compressedTimeline))
    for (const participant of match.info.participants) {
      teamByMatchAndParticipant.set(
        `${matchId}|${participant.participantId}`,
        participant.playerSubteamId,
      )
    }

    const observationsByTimestampAndParticipant = new Map(
      observationsByMatch
        .get(matchId)
        .map((observation) => [
          `${observation.timestamp}|${observation.participantId}`,
          observation,
        ]),
    )
    for (const frame of timeline.info.frames) {
      for (const participantFrame of Object.values(frame.participantFrames)) {
        const observation = observationsByTimestampAndParticipant.get(
          `${frame.timestamp}|${participantFrame.participantId}`,
        )
        if (observation) {
          observation.championStats = participantFrame.championStats
          observation.currentGold = participantFrame.currentGold
          observation.totalGold = participantFrame.totalGold
        }
      }
    }
  }),
)

for (const [matchId, matchObservations] of observationsByMatch) {
  const frames = [...Map.groupBy(matchObservations, (value) => value.timestamp)]
    .sort(([left], [right]) => left - right)
    .map(([timestamp, participants]) => ({ timestamp, participants }))

  const firstPlayableFrameIndex = frames.findIndex((frame) => frame.timestamp >= 50_000)
  if (firstPlayableFrameIndex < 0) continue

  let round = 1
  const firstPlayableFrame = frames[firstPlayableFrameIndex]
  const boundaryEvidence = [
    { round, timestamp: firstPlayableFrame.timestamp, signal: 'initial' },
  ]
  for (const participant of firstPlayableFrame.participants) {
    const key = `${matchId}|${participant.participantId}|${round}`
    representativeFrames.set(key, { ...participant, round })
  }

  for (let index = firstPlayableFrameIndex + 1; index < frames.length; index += 1) {
    const previousLevels = new Map(
      frames[index - 1].participants.map((participant) => [
        participant.participantId,
        participant.level,
      ]),
    )
    const upgradedParticipants = frames[index].participants.filter(
      (participant) =>
        participant.level > (previousLevels.get(participant.participantId) ?? Infinity),
    )

    const previousByParticipant = new Map(
      frames[index - 1].participants.map((participant) => [
        participant.participantId,
        participant,
      ]),
    )
    const stateResetParticipants = frames[index].participants.filter((participant) => {
      const previous = previousByParticipant.get(participant.participantId)
      if (!previous) return false
      const currentStats = participant.championStats
      const previousStats = previous.championStats
      const healthReset =
        previousStats.health < previousStats.healthMax * 0.98 &&
        currentStats.health >= currentStats.healthMax * 0.999
      const resourceFull =
        currentStats.powerMax <= 0 ||
        currentStats.power >= currentStats.powerMax * 0.999
      return healthReset && resourceFull
    })
    const rewardParticipants = frames[index].participants.filter((participant) => {
      const previous = previousByParticipant.get(participant.participantId)
      return previous && participant.totalGold - previous.totalGold >= 1_000
    })

    const levelBoundary = upgradedParticipants.length >= 3
    const stateBoundary =
      round >= maximumLevelSignalRound && stateResetParticipants.length >= 3
    const stateWithRewardBoundary =
      round >= maximumLevelSignalRound &&
      stateResetParticipants.length >= 2 &&
      rewardParticipants.length >= 3
    if (!levelBoundary && !stateBoundary && !stateWithRewardBoundary) continue

    round += 1
    const signal = levelBoundary
      ? 'level'
      : stateBoundary
        ? 'state-reset'
        : 'state-reset+reward'

    let participantsToRecord = upgradedParticipants
    if (round > maximumLevelSignalRound) {
      const rewardCountsByTeam = new Map()
      for (const participant of rewardParticipants) {
        const team = teamByMatchAndParticipant.get(
          `${matchId}|${participant.participantId}`,
        )
        if (team !== undefined) {
          rewardCountsByTeam.set(team, (rewardCountsByTeam.get(team) || 0) + 1)
        }
      }

      const activeTeams = new Set(
        [...upgradedParticipants, ...stateResetParticipants]
          .map((participant) =>
            teamByMatchAndParticipant.get(`${matchId}|${participant.participantId}`),
          )
          .filter((team) => team !== undefined),
      )
      for (const [team, count] of rewardCountsByTeam) {
        if (count >= 2) activeTeams.add(team)
      }
      participantsToRecord = frames[index].participants.filter((participant) =>
        activeTeams.has(
          teamByMatchAndParticipant.get(`${matchId}|${participant.participantId}`),
        ),
      )
    }

    for (const participant of participantsToRecord) {
      const key = `${matchId}|${participant.participantId}|${round}`
      representativeFrames.set(key, { ...participant, round, boundarySignal: signal })
    }
    boundaryEvidence.push({
      round,
      timestamp: frames[index].timestamp,
      signal,
      upgradedPlayers: upgradedParticipants.length,
      stateResetPlayers: stateResetParticipants.length,
      rewardedPlayers: rewardParticipants.length,
      recordedPlayers: participantsToRecord.length,
    })
  }

  detectedRoundsByMatch.set(matchId, round)
  boundaryEvidenceByMatch.set(matchId, boundaryEvidence)
}

const groups = new Map()
const championRoundGroups = new Map()
const unknownChampionIds = new Set()
for (const frame of representativeFrames.values()) {
  const champion = championById.get(frame.championId)
  if (!champion) unknownChampionIds.add(frame.championId)
  const category = champion?.primaryCategory || 'Unknown'
  const key = `${category}|${frame.round}`
  const group = groups.get(key) || {
    category,
    round: frame.round,
    armor: [],
    magicResistance: [],
    matchIds: new Set(),
    championIds: new Set(),
    boundarySignals: new Map(),
  }
  group.armor.push(frame.armor)
  group.magicResistance.push(frame.magicResistance)
  group.matchIds.add(frame.matchId)
  group.championIds.add(frame.championId)
  const boundarySignal = frame.boundarySignal || 'level-or-initial'
  group.boundarySignals.set(
    boundarySignal,
    (group.boundarySignals.get(boundarySignal) || 0) + 1,
  )
  groups.set(key, group)

  const championRoundKey = `${frame.championId}|${frame.round}`
  const championRoundGroup = championRoundGroups.get(championRoundKey) || {
    championId: frame.championId,
    championName: frame.championName,
    championNameZh: champion?.championNameZh || frame.championName,
    primaryCategory: category,
    primaryCategoryZh: categoryNames[category] || category,
    round: frame.round,
    armor: [],
    magicResistance: [],
    matchIds: new Set(),
    boundarySignals: new Map(),
  }
  championRoundGroup.armor.push(frame.armor)
  championRoundGroup.magicResistance.push(frame.magicResistance)
  championRoundGroup.matchIds.add(frame.matchId)
  championRoundGroup.boundarySignals.set(
    boundarySignal,
    (championRoundGroup.boundarySignals.get(boundarySignal) || 0) + 1,
  )
  championRoundGroups.set(championRoundKey, championRoundGroup)
}

const rows = [...groups.values()]
  .map((group) => {
    const armor = summarize(group.armor)
    const magicResistance = summarize(group.magicResistance)
    return {
      category: group.category,
      categoryZh: categoryNames[group.category] || group.category,
      round: group.round,
      confidence:
        group.round <= maximumLevelSignalRound
          ? 'high'
          : group.round === maximumLevelSignalRound + 1
            ? 'medium'
            : 'low',
      observations: group.armor.length,
      matches: group.matchIds.size,
      champions: group.championIds.size,
      boundarySignals: Object.fromEntries(group.boundarySignals),
      armor: Object.fromEntries(
        Object.entries(armor).map(([key, value]) => [key, roundNumber(value)]),
      ),
      magicResistance: Object.fromEntries(
        Object.entries(magicResistance).map(([key, value]) => [key, roundNumber(value)]),
      ),
    }
  })
  .sort((a, b) => a.round - b.round || a.category.localeCompare(b.category))

const championCategories = [...championById.entries()]
  .filter(([championId]) =>
    observations.some((observation) => observation.championId === championId),
  )
  .map(([championId, champion]) => ({ championId, ...champion }))
  .sort((a, b) => a.championId - b.championId)

const championRoundRows = [...championRoundGroups.values()]
  .map((group) => {
    const armor = summarize(group.armor)
    const magicResistance = summarize(group.magicResistance)
    return {
      championId: group.championId,
      championName: group.championName,
      championNameZh: group.championNameZh,
      primaryCategory: group.primaryCategory,
      primaryCategoryZh: group.primaryCategoryZh,
      round: group.round,
      confidence:
        group.round <= maximumLevelSignalRound
          ? 'high'
          : group.round === maximumLevelSignalRound + 1
            ? 'medium'
            : 'low',
      observations: group.armor.length,
      matches: group.matchIds.size,
      boundarySignals: Object.fromEntries(group.boundarySignals),
      armor: Object.fromEntries(
        Object.entries(armor).map(([key, value]) => [key, roundNumber(value)]),
      ),
      magicResistance: Object.fromEntries(
        Object.entries(magicResistance).map(([key, value]) => [key, roundNumber(value)]),
      ),
    }
  })
  .sort(
    (a, b) =>
      a.round - b.round ||
      a.championNameZh.localeCompare(b.championNameZh, 'zh-CN'),
  )

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    platform: summary.platform,
    queueId: summary.queueId,
    mapId: summary.mapId,
    matches: summary.collectedMatches,
    gameVersions: [...new Set(summary.matches.map((match) => match.gameVersion))],
    championData: championDataUrl,
  },
  methodology: {
    categoryRule: 'Data Dragon tags[0]（主标签，互斥分类）',
    maximumObservedTimelineLevel: Math.max(
      ...observations.map((observation) => observation.level),
    ),
    maximumLevelSignalRound,
    roundRule:
      '第 1～12 回合使用至少 3 人同步升级；达到标准 18 级上限后，至少 3 人生命从非满恢复且当前资源已满时进入下一回合。若仅 2 人满足状态重置，则还要求至少 3 人同步获得不低于 1000 总金币。后期按触发信号所在队伍补齐队员。',
    fallbackSignals:
      '金币只辅助确认状态重置，绝不单独触发回合；超过 18 级的升级仍可作为强信号，但不会只统计升级者，而会按其队伍补齐。',
    detectedRoundsPerMatch: Object.fromEntries(
      [...detectedRoundsByMatch.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    boundaryEvidenceByMatch: Object.fromEntries(
      [...boundaryEvidenceByMatch.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    caveat:
      'Timeline 没有 ROUND_START 事件。满级后的状态重置信号经前 12 回合反向校准，仍可能漏掉取样前后均为满状态的回合；第 13 回合以后应视为较低置信度。分钟级帧也可能包含临时增减益。',
  },
  unknownChampionIds: [...unknownChampionIds].sort((a, b) => a - b),
  rows,
}

const csvHeaders = [
  'round',
  'confidence',
  'category',
  'category_zh',
  'observations',
  'matches',
  'champions',
  'armor_mean',
  'armor_p25',
  'armor_median',
  'armor_p75',
  'mr_mean',
  'mr_p25',
  'mr_median',
  'mr_p75',
]
const csvRows = rows.map((row) => [
  row.round,
  row.confidence,
  row.category,
  row.categoryZh,
  row.observations,
  row.matches,
  row.champions,
  row.armor.mean,
  row.armor.p25,
  row.armor.median,
  row.armor.p75,
  row.magicResistance.mean,
  row.magicResistance.p25,
  row.magicResistance.median,
  row.magicResistance.p75,
])

const championRoundCsvHeaders = [
  'round',
  'confidence',
  'champion_id',
  'champion_name',
  'champion_name_zh',
  'primary_category',
  'primary_category_zh',
  'observations',
  'matches',
  'armor_mean',
  'armor_p25',
  'armor_median',
  'armor_p75',
  'mr_mean',
  'mr_p25',
  'mr_median',
  'mr_p75',
]
const championRoundCsvRows = championRoundRows.map((row) => [
  row.round,
  row.confidence,
  row.championId,
  row.championName,
  row.championNameZh,
  row.primaryCategory,
  row.primaryCategoryZh,
  row.observations,
  row.matches,
  row.armor.mean,
  row.armor.p25,
  row.armor.median,
  row.armor.p75,
  row.magicResistance.mean,
  row.magicResistance.p25,
  row.magicResistance.median,
  row.magicResistance.p75,
])

await mkdir(outputDirectory, { recursive: true })
await Promise.all([
  writeFile(
    path.join(outputDirectory, 'resistances-by-category-and-round.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  ),
  writeFile(
    path.join(outputDirectory, 'resistances-by-category-and-round.csv'),
    `${[csvHeaders, ...csvRows].map((row) => row.map(csvCell).join(',')).join('\n')}\n`,
  ),
  writeFile(
    path.join(outputDirectory, 'champion-categories.json'),
    `${JSON.stringify(championCategories, null, 2)}\n`,
  ),
  writeFile(
    path.join(outputDirectory, 'category-round-targets.json'),
    `${JSON.stringify(
      {
        patch: '26.15',
        platform: summary.platform,
        matches: summary.collectedMatches,
        rows: rows.map((row) => ({
          category: row.category,
          categoryZh: row.categoryZh,
          round: row.round,
          confidence: row.confidence,
          observations: row.observations,
          matches: row.matches,
          armor: row.armor,
          magicResistance: row.magicResistance,
        })),
      },
      null,
      2,
    )}\n`,
  ),
  writeFile(
    path.join(outputDirectory, 'resistances-by-champion-and-round.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: result.generatedAt,
        source: result.source,
        methodology: result.methodology,
        rows: championRoundRows,
      },
      null,
      2,
    )}\n`,
  ),
  writeFile(
    path.join(outputDirectory, 'resistances-by-champion-and-round.csv'),
    `${[championRoundCsvHeaders, ...championRoundCsvRows]
      .map((row) => row.map(csvCell).join(','))
      .join('\n')}\n`,
  ),
])

console.log(
  JSON.stringify(
    {
      outputDirectory,
      representativeFrames: representativeFrames.size,
      rows: rows.length,
      championRoundRows: championRoundRows.length,
      rounds: Math.max(...rows.map((row) => row.round)),
      unknownChampionIds: result.unknownChampionIds,
    },
    null,
    2,
  ),
)
