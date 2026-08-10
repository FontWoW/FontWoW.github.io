// One-off script: downloads local woff2 copies of every font referenced in src/shared/fonts.js
// and generates src/fonts-local.css with @font-face rules pointing at /fonts/*.woff2.
// Run with: node scripts/fetch-fonts.mjs
import { FONTS } from '../src/shared/fonts.js'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = path.resolve('public/fonts')
const CSS_OUT = path.resolve('src/fonts-local.css')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

await mkdir(OUT_DIR, { recursive: true })

let cssOut = ''
let count = 0

for (const font of FONTS) {
  const url = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) {
    console.error(`FAILED css fetch for ${font.id}: ${res.status}`)
    continue
  }
  const css = await res.text()
  const blocks = css.match(/@font-face\s*{[^}]+}/g) || []
  for (const block of blocks) {
    const familyMatch = block.match(/font-family:\s*'([^']+)'/)
    const weightMatch = block.match(/font-weight:\s*(\d+)/)
    const urlMatch = block.match(/url\(([^)]+\.woff2)\)/)
    if (!familyMatch || !urlMatch) continue
    const family = familyMatch[1]
    const weight = weightMatch ? weightMatch[1] : '400'
    const fontUrl = urlMatch[1]
    const safeName = family.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const fileName = `${safeName}-${weight}-${count++}.woff2`
    const fileRes = await fetch(fontUrl)
    if (!fileRes.ok) {
      console.error(`FAILED font fetch for ${family} ${weight}: ${fileRes.status}`)
      continue
    }
    const buf = Buffer.from(await fileRes.arrayBuffer())
    await writeFile(path.join(OUT_DIR, fileName), buf)
    const newBlock = block.replace(urlMatch[0], `url(/fonts/${fileName})`)
    cssOut += newBlock + '\n'
    console.log(`OK ${family} ${weight}`)
  }
}

await writeFile(CSS_OUT, cssOut)
console.log(`Done. Wrote ${CSS_OUT}`)
