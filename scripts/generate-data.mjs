/**
 * ops/clients/_index.yaml → public/data.json に変換するスクリプト
 * GitHub Actions または手動で実行
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// YAMLの簡易パーサー（外部依存なし）
function parseIndexYaml(content) {
  const clients = []
  let current = null

  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\r$/, '')

    // コメント行・空行スキップ
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue

    // 新しいエントリ開始
    if (/^- id:/.test(line)) {
      if (current) clients.push(current)
      current = { id: val(line) }
      continue
    }

    if (!current) continue

    // トップレベルフィールド
    if (/^  \w/.test(line) && !/^    /.test(line)) {
      const [key, ...rest] = line.trim().split(':')
      const v = rest.join(':').trim()
      if (v && !['contact', 'project', 'billing', 'drive'].includes(key.trim())) {
        current[key.trim()] = cleanVal(v)
      }
    }

    // ネストフィールド（contact, project, billing, drive）
    const nested = line.match(/^    (\w+):\s*(.*)$/)
    if (nested) {
      const parent = detectParent(content, rawLine, line)
      if (parent && nested[2]) {
        if (!current[parent]) current[parent] = {}
        current[parent][nested[1]] = cleanVal(nested[2])
      }
    }
  }
  if (current) clients.push(current)
  return clients
}

function detectParent(content, rawLine, line) {
  const lines = content.split('\n')
  const idx = lines.indexOf(rawLine)
  // 上方向にさかのぼって親を見つける
  for (let i = idx - 1; i >= 0; i--) {
    const m = lines[i].match(/^  (\w+):/)
    if (m && ['contact', 'project', 'billing', 'drive'].includes(m[1])) {
      return m[1]
    }
    if (/^- id:/.test(lines[i])) break
  }
  return null
}

function val(line) {
  return line.split(':').slice(1).join(':').trim()
}

function cleanVal(v) {
  // コメント除去、数値変換
  const cleaned = v.replace(/#.*$/, '').trim()
  if (!cleaned) return ''
  if (/^\d+$/.test(cleaned)) return Number(cleaned)
  return cleaned
}

// メイン
const opsPath = process.env.OPS_PATH || resolve(__dirname, '../../../../ops')
const yamlPath = resolve(opsPath, 'clients/_index.yaml')
const outPath = resolve(__dirname, '../public/data.json')

console.log(`Reading: ${yamlPath}`)
const yaml = readFileSync(yamlPath, 'utf-8')
const clients = parseIndexYaml(yaml)

const data = {
  generated: new Date().toISOString(),
  clients,
}

writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8')
console.log(`Generated: ${outPath} (${clients.length} clients)`)
