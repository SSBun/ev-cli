import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WordEntry, WordPack } from '../types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../data')

const PACK_META: Record<string, string> = {
  junior: '初中',
  senior: '高中',
  cet4: '四级 (CET-4)',
  cet6: '六级 (CET-6)',
  postgrad: '考研',
  toefl: '托福 (TOEFL)',
  sat: 'SAT',
}

export function loadPack(id: string): WordPack {
  const name = PACK_META[id]
  if (!name) throw new Error(`Unknown pack: ${id}`)

  const filePath = path.join(DATA_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) throw new Error(`Pack file not found: ${filePath}`)

  const words: WordEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return { id, name, words }
}

export function listPacks(): { id: string; name: string; count: number }[] {
  return Object.entries(PACK_META).map(([id, name]) => {
    const filePath = path.join(DATA_DIR, `${id}.json`)
    let count = 0
    if (fs.existsSync(filePath)) {
      const words: WordEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      count = words.length
    }
    return { id, name, count }
  })
}
