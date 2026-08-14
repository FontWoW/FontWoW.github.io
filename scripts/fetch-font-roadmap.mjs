import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FONT_GOALS } from '../src/goals.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_PATH = path.join(ROOT, 'public/font-roadmap.json')
const COUNTER_QUERY_ENDPOINT = 'https://counter.dev/query'

const user = process.env.COUNTER_USER
const token = process.env.COUNTER_TOKEN
const site = process.env.COUNTER_SITE || 'fontwow.github.io'
const days = Math.max(1, Number(process.env.FONT_ROADMAP_DAYS) || 90)

if (!user || !token) {
  console.log('Font roadmap snapshot skipped: COUNTER_USER or COUNTER_TOKEN is not configured.')
  process.exit(0)
}

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function countFontPages(data, prefix, missingValue = null) {
  const pageCounts = data?.[site]?.page
  if (!pageCounts || typeof pageCounts !== 'object') {
    throw new Error(`No page data was returned for Counter site: ${site}`)
  }

  return Object.fromEntries(FONT_GOALS.map((goal) => {
    const count = Number(pageCounts[`${prefix}${goal.id}`])
    return [goal.id, Number.isFinite(count) && count >= 0 ? Math.round(count) : missingValue]
  }))
}

const to = new Date()
const from = new Date(to)
from.setUTCDate(from.getUTCDate() - days)
const query = new URLSearchParams({
  user,
  token,
  from: isoDate(from),
  to: isoDate(to),
})
const response = await fetch(`${COUNTER_QUERY_ENDPOINT}?${query}`, {
  headers: { Origin: `https://${site}` },
})
if (!response.ok) {
  throw new Error(`Counter query failed: ${response.status} ${response.statusText}`)
}

const data = await response.json()
const inAppUsage = countFontPages(data, '/font/', null)
const communityLikes = countFontPages(data, '/font-like/', 0)
const existing = JSON.parse(await fs.readFile(OUTPUT_PATH, 'utf8'))
const fonts = Object.fromEntries(FONT_GOALS.map((goal) => {
  const previous = existing.fonts?.[goal.id] || {}
  return [goal.id, {
    inAppUsageCount: inAppUsage[goal.id],
    publicPopularityScore: previous.publicPopularityScore ?? null,
    coverageGapScore: previous.coverageGapScore ?? null,
    communityLikeCount: communityLikes[goal.id],
  }]
}))

const output = {
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  period: { from: isoDate(from), to: isoDate(to) },
  source: existing.source,
  fonts,
}

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote FontWoW font usage snapshot for ${site}: ${OUTPUT_PATH}`)
