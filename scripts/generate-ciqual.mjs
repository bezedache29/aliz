#!/usr/bin/env node
/**
 * Generate assets/data/ciqual.json from CIQUAL 2025 XML files.
 * Uses only Node.js built-in modules — no npm install needed.
 *
 * Usage: node scripts/generate-ciqual.mjs
 */

import { createWriteStream, createReadStream, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import https from 'node:https'
import http from 'node:http'
import { createInterface } from 'node:readline'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ALIM_URL =
  'https://entrepot.recherche.data.gouv.fr/api/access/datafile/' +
  ':persistentId?persistentId=doi:10.57745/OH8KXC'
const COMPO_URL =
  'https://entrepot.recherche.data.gouv.fr/api/access/datafile/' +
  ':persistentId?persistentId=doi:10.57745/O73GDX'

// Codes constituants CIQUAL 2025
const CONST_CODES = {
  '328':   'kcal',
  '25000': 'proteines',
  '31000': 'glucides',
  '40000': 'lipides',
  '34100': 'fibres',
  '10004': 'sel',
}

const OUTPUT_PATH = join(__dirname, '..', 'assets', 'data', 'ciqual.json')
const TMP_ALIM  = '/tmp/ciqual_alim.xml'
const TMP_COMPO = '/tmp/ciqual_compo.xml'

// ── helpers ────────────────────────────────────────────────────────────────

function parseTeneur(v = '-') {
  const s = (v || '').trim()
  if (!s || s === '-') return null
  if (s.toLowerCase().startsWith('trace')) return 0
  if (s.startsWith('<')) return 0
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? null : n
}

/** Extract text content from <tagName>value</tagName> on a single line */
function extractTag(line, tagName) {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([^<]*)<\\/${tagName}>`)
  const m = re.exec(line)
  return m ? m[1].trim() : null
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    function request(currentUrl, hops = 0) {
      if (hops > 8) return reject(new Error('Too many redirects'))
      const mod = currentUrl.startsWith('https') ? https : http
      mod.get(currentUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if ([301, 302, 303].includes(res.statusCode)) {
          res.resume()
          return request(res.headers.location, hops + 1)
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        const file = createWriteStream(dest)
        let bytes = 0
        res.on('data', (chunk) => {
          bytes += chunk.length
          process.stdout.write(`\r  ${(bytes / 1024 / 1024).toFixed(1)} MB...`)
        })
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          const kb = Math.round(statSync(dest).size / 1024)
          console.log(`\r  ${kb} KB — done            `)
          resolve()
        })
        file.on('error', reject)
      }).on('error', reject)
    }
    request(url)
  })
}

/**
 * XML format:
 *   <ALIM>
 *     <alim_code> 1000 </alim_code>
 *     <alim_nom_fr> Pastis </alim_nom_fr>
 *     ...
 *   </ALIM>
 */
async function parseAlim(path) {
  const foods = {}
  let inBlock = false
  let code = null
  let nom = null

  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of rl) {
    const t = line.trim()
    if (t === '<ALIM>') { inBlock = true; code = null; nom = null; continue }
    if (t === '</ALIM>') {
      if (code && nom) foods[code] = nom
      inBlock = false; continue
    }
    if (!inBlock) continue
    if (!code) code = extractTag(t, 'alim_code')
    if (!nom)  nom  = extractTag(t, 'alim_nom_fr')
  }
  return foods
}

/**
 * XML format:
 *   <COMPO>
 *     <alim_code> 1000 </alim_code>
 *     <const_code> 328 </const_code>
 *     <teneur> 274 </teneur>
 *     ...
 *   </COMPO>
 */
async function parseCompo(path) {
  const data = {}
  const target = new Set(Object.keys(CONST_CODES))
  let inBlock = false
  let alimCode = null
  let constCode = null
  let teneur = null
  let count = 0

  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of rl) {
    const t = line.trim()
    if (t === '<COMPO>') { inBlock = true; alimCode = null; constCode = null; teneur = null; continue }
    if (t === '</COMPO>') {
      if (alimCode && constCode && target.has(constCode)) {
        const val = parseTeneur(teneur)
        if (val !== null) {
          data[alimCode] ??= {}
          data[alimCode][CONST_CODES[constCode]] = Math.round(val * 10) / 10
        }
        if (++count % 10000 === 0) process.stdout.write(`\r  ${count} entries...`)
      }
      inBlock = false; continue
    }
    if (!inBlock) continue
    if (!alimCode)  alimCode  = extractTag(t, 'alim_code')
    if (!constCode) constCode = extractTag(t, 'const_code')
    if (!teneur)    teneur    = extractTag(t, 'teneur')
  }
  console.log(`\r  ${count} relevant entries parsed       `)
  return data
}

// ── main ────────────────────────────────────────────────────────────────────

console.log('=== CIQUAL 2025 JSON generator ===\n')
mkdirSync(dirname(OUTPUT_PATH), { recursive: true })

console.log('1/4 — alim.xml')
if (existsSync(TMP_ALIM)) console.log(`  Using cached ${TMP_ALIM}`)
else await download(ALIM_URL, TMP_ALIM)

console.log('2/4 — compo.xml (~67 MB, quelques minutes)')
if (existsSync(TMP_COMPO)) console.log(`  Using cached ${TMP_COMPO}`)
else await download(COMPO_URL, TMP_COMPO)

console.log('3/4 — Parsing aliments...')
const foods = await parseAlim(TMP_ALIM)
console.log(`  ${Object.keys(foods).length} aliments trouvés`)

console.log('4/4 — Parsing compositions...')
const compo = await parseCompo(TMP_COMPO)

const result = Object.entries(foods)
  .reduce((acc, [id, nom]) => {
    const n = compo[id] ?? {}
    if (n.kcal == null) return acc
    acc.push({
      id,
      nom,
      kcal:      n.kcal,
      proteines: n.proteines ?? 0,
      glucides:  n.glucides  ?? 0,
      lipides:   n.lipides   ?? 0,
      fibres:    n.fibres    ?? null,
      sel:       n.sel       ?? null,
    })
    return acc
  }, [])
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

writeFileSync(OUTPUT_PATH, JSON.stringify(result), 'utf8')
const kb = Math.round(statSync(OUTPUT_PATH).size / 1024)
console.log(`\n✓ ${OUTPUT_PATH}`)
console.log(`  ${result.length} aliments — ${kb} KB`)
console.log('\nRedémarre Expo pour prendre en compte le fichier.')
