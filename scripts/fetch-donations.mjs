import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TOKEN = process.env.DARAMET_TOKEN
if (!TOKEN) {
  console.error('DARAMET_TOKEN env var is required')
  process.exit(1)
}

const AMOUNT_KEY_RE = /amount|price|mablagh/i
const DATE_KEY_RE = /date|time|created/i
const DONOR_KEY_RE = /donator_?id|donor_?id|user_?id|username|email/i

function pick(item, re) {
  if (!item || typeof item !== 'object') return undefined
  const key = Object.keys(item).find(k => re.test(k))
  return key ? item[key] : undefined
}

function donorKey(item) {
  const nested = item?.donator_data || item?.donor || item
  const key = pick(nested, DONOR_KEY_RE)
  return key === undefined || key === null || key === '' ? null : String(key)
}

const res = await fetch('https://daramet.com/api/Donates/Messages', {
  headers: { Authorization: TOKEN },
})

if (!res.ok) {
  console.error(`Daramet API request failed: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const data = await res.json()
// The API returns literal `null` (not `[]`) when there are no donations yet — that's a valid empty state.
const list = Array.isArray(data) ? data : (data && (data.data || data.result || data.Donates)) || []

if (!Array.isArray(list)) {
  console.error('Unexpected Daramet API response shape:', JSON.stringify(data).slice(0, 500))
  process.exit(1)
}

// Only keep amount + date — never publish donor name, message, phone, or tracking code.
const normalized = list
  .map((item, index) => ({
    amount: Number(pick(item, AMOUNT_KEY_RE)),
    date: pick(item, DATE_KEY_RE) ?? null,
    donorKey: donorKey(item) || `donation:${index}`,
    hasDonorKey: donorKey(item) !== null,
  }))
  .filter(d => Number.isFinite(d.amount) && d.amount > 0)

const donations = normalized.slice(0, 15).map(({ amount, date }) => ({ amount, date }))
const totalAmount = normalized.reduce((sum, donation) => sum + donation.amount, 0)
const donorKeys = new Set(normalized.map(donation => donation.donorKey))
const hasCompleteDonorKeys = normalized.length > 0 && normalized.every(donation => donation.hasDonorKey)

const output = {
  project: 'FontWoW',
  updatedAt: new Date().toISOString(),
  donationCount: normalized.length,
  totalAmount,
  supporterCount: donorKeys.size,
  supporterCountMode: hasCompleteDonorKeys ? 'unique-donors' : 'donations',
  donations,
}

const targetPath = path.join(__dirname, '../public/donations.json')
fs.writeFileSync(targetPath, JSON.stringify(output, null, 2))
console.log(`Wrote ${donations.length} donations to ${targetPath}`)
