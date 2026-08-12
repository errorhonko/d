import { mkdir, writeFile } from 'node:fs/promises'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=')
    return [key, value.join('=') || true]
  }),
)

const apiKey = process.env.RIOT_API_KEY
const platform = String(args.region || 'kr').toLowerCase()
const regionalRoute = platform === 'kr' || platform === 'jp1' ? 'asia' : 'sea'
const targetMatches = Number(args.matches || 100)
const days = Number(args.days || 14)
const queueId = Number(args.queue || 1750)
const mapId = 30
const startTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
const outputDirectory = path.resolve(
  String(args.out || `data/sources/riot-api/${platform}/arena-${targetMatches}`),
)
const rawDirectory = path.join('.cache', 'riot-api', platform)

if (!apiKey) {
  throw new Error(
    '缺少 RIOT_API_KEY。请复制 .env.example 为 .env.local，填写密钥后重新运行。',
  )
}

if (!Number.isInteger(targetMatches) || targetMatches < 1) {
  throw new Error('--matches 必须是正整数')
}

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

async function riotRequest(host, pathname) {
  const url = new URL(pathname, `https://${host}`)
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'X-Riot-Token': apiKey },
    })

    if (response.ok) return response.json()

    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get('retry-after') || 1)
      await sleep(Math.max(1, retryAfter) * 1000)
      continue
    }

    const body = await response.text()
    throw new Error(`Riot API ${response.status}: ${body.slice(0, 300)}`)
  }

  throw new Error(`Riot API 多次重试失败：${url.pathname}`)
}

async function writeGzipJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await pipeline(
    Readable.from([JSON.stringify(value)]),
    createGzip({ level: 9 }),
    await import('node:fs').then(({ createWriteStream }) => createWriteStream(filePath)),
  )
}

async function loadInitialPuuids() {
  const configured = (process.env.RIOT_SEED_PUUIDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (configured.length > 0) return configured

  const riotIds = (process.env.RIOT_SEED_RIOT_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (riotIds.length > 0) {
    return Promise.all(
      riotIds.map(async (riotId) => {
        const separator = riotId.lastIndexOf('#')
        if (separator <= 0 || separator === riotId.length - 1) {
          throw new Error(`无效 Riot ID：${riotId}，格式应为 游戏名#标签`)
        }
        const gameName = riotId.slice(0, separator)
        const tagLine = riotId.slice(separator + 1)
        const account = await riotRequest(
          `${regionalRoute}.api.riotgames.com`,
          `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        )
        return account.puuid
      }),
    )
  }

  const league = await riotRequest(
    `${platform}.api.riotgames.com`,
    '/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5',
  )

  const puuids = league.entries.map((entry) => entry.puuid).filter(Boolean)
  if (puuids.length === 0) {
    throw new Error(
      '韩服王者列表没有返回 PUUID；请通过 RIOT_SEED_PUUIDS 提供逗号分隔的种子。',
    )
  }
  return puuids
}

function extractFrameObservations(match, timeline) {
  const champions = new Map(
    match.info.participants.map((participant) => [
      participant.participantId,
      {
        championId: participant.championId,
        championName: participant.championName,
      },
    ]),
  )

  return timeline.info.frames.flatMap((frame) =>
    Object.values(frame.participantFrames).map((participantFrame) => {
      const stats = participantFrame.championStats || {}
      const champion = champions.get(participantFrame.participantId) || {}
      return {
        matchId: match.metadata.matchId,
        timestamp: frame.timestamp,
        participantId: participantFrame.participantId,
        championId: champion.championId ?? null,
        championName: champion.championName ?? null,
        level: participantFrame.level ?? null,
        currentGold: participantFrame.currentGold ?? null,
        totalGold: participantFrame.totalGold ?? null,
        health: stats.health ?? null,
        healthMax: stats.healthMax ?? null,
        power: stats.power ?? null,
        powerMax: stats.powerMax ?? null,
        armor: stats.armor ?? null,
        magicResistance: stats.magicResist ?? null,
        attackDamage: stats.attackDamage ?? null,
        attackSpeed: stats.attackSpeed ?? null,
        physicalLethality: stats.physicalLethality ?? null,
        armorPenetrationPercent: stats.armorPenetrationPercent ?? null,
      }
    }),
  )
}

await mkdir(outputDirectory, { recursive: true })
await mkdir(rawDirectory, { recursive: true })

const seedQueue = await loadInitialPuuids()
const queuedPuuids = new Set(seedQueue)
const visitedPuuids = new Set()
const seenMatchIds = new Set()
const acceptedMatches = []
const observations = []

while (seedQueue.length > 0 && acceptedMatches.length < targetMatches) {
  const puuid = seedQueue.shift()
  if (!puuid || visitedPuuids.has(puuid)) continue
  visitedPuuids.add(puuid)

  const ids = await riotRequest(
    `${regionalRoute}.api.riotgames.com`,
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=${queueId}&startTime=${startTime}&count=100`,
  )

  for (const matchId of ids) {
    if (acceptedMatches.length >= targetMatches) break
    if (seenMatchIds.has(matchId)) continue
    seenMatchIds.add(matchId)

    const match = await riotRequest(
      `${regionalRoute}.api.riotgames.com`,
      `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
    )

    if (match.info.queueId !== queueId || match.info.mapId !== mapId) continue

    const timeline = await riotRequest(
      `${regionalRoute}.api.riotgames.com`,
      `/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`,
    )

    await writeGzipJson(path.join(rawDirectory, `${matchId}.match.json.gz`), match)
    await writeGzipJson(
      path.join(rawDirectory, `${matchId}.timeline.json.gz`),
      timeline,
    )

    acceptedMatches.push({
      matchId,
      gameVersion: match.info.gameVersion,
      gameCreation: match.info.gameCreation,
      gameDuration: match.info.gameDuration,
      participants: match.info.participants.length,
      timelineFrames: timeline.info.frames.length,
    })
    observations.push(...extractFrameObservations(match, timeline))

    for (const participantPuuid of match.metadata.participants) {
      if (!queuedPuuids.has(participantPuuid)) {
        queuedPuuids.add(participantPuuid)
        seedQueue.push(participantPuuid)
      }
    }

    process.stdout.write(
      `\r已采集 ${acceptedMatches.length}/${targetMatches} 场，帧观测 ${observations.length} 条`,
    )
  }
}

process.stdout.write('\n')

const summary = {
  collectedAt: new Date().toISOString(),
  platform,
  regionalRoute,
  queueId,
  mapId,
  requestedMatches: targetMatches,
  collectedMatches: acceptedMatches.length,
  historyStartTime: new Date(startTime * 1000).toISOString(),
  visitedPlayers: visitedPuuids.size,
  uniqueMatchesInspected: seenMatchIds.size,
  frameObservations: observations.length,
  matches: acceptedMatches,
}

await writeFile(
  path.join(outputDirectory, 'summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
)
await writeFile(
  path.join(outputDirectory, 'frame-observations.jsonl'),
  `${observations.map((value) => JSON.stringify(value)).join('\n')}\n`,
)

if (acceptedMatches.length < targetMatches) {
  throw new Error(
    `只找到 ${acceptedMatches.length}/${targetMatches} 场。可增加 --days 或配置更多 RIOT_SEED_PUUIDS。`,
  )
}

console.log(`采样完成：${outputDirectory}`)
