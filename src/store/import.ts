import fs from 'node:fs'
import path from 'node:path'
import type { WordEntry } from '../types.js'

export function parseImportFile(filePath: string): WordEntry[] {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.json') return parseJson(filePath)
  if (ext === '.csv') return parseCsv(filePath)
  throw new Error(`Unsupported file format: ${ext}. Use .json or .csv`)
}

function parseJson(filePath: string): WordEntry[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  if (!Array.isArray(raw)) throw new Error('JSON file must contain an array of words')
  return raw.map(validateWord)
}

function parseCsv(filePath: string): WordEntry[] {
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return validateWord(obj)
  })
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function validateWord(raw: Record<string, unknown>): WordEntry {
  if (!raw.word || typeof raw.word !== 'string') throw new Error('Each word entry must have a "word" field')
  if (!raw.definition || typeof raw.definition !== 'string') throw new Error(`Missing "definition" for word: ${raw.word}`)
  return {
    word: raw.word,
    definition: raw.definition,
    pos: (raw.pos as string) || '',
    example: raw.example as string | undefined,
    ipa: raw.ipa as string | undefined,
  }
}
