import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { parseImportFile } from '../src/store/import.js'

describe('parseImportFile', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-import-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('parses JSON import file', () => {
    const filePath = path.join(tmpDir, 'words.json')
    fs.writeFileSync(filePath, JSON.stringify([
      { word: 'ephemeral', definition: '短暂的', pos: 'adj', example: 'Ephemeral beauty', ipa: '/ɪˈfemərəl/' },
    ]))
    const words = parseImportFile(filePath)
    expect(words).toHaveLength(1)
    expect(words[0].word).toBe('ephemeral')
    expect(words[0].definition).toBe('短暂的')
  })

  it('parses CSV import file', () => {
    const filePath = path.join(tmpDir, 'words.csv')
    fs.writeFileSync(filePath, 'word,definition,pos,example,ipa\nephemeral,短暂的,adj,"Ephemeral beauty",/ɪˈfemərəl/\n')
    const words = parseImportFile(filePath)
    expect(words).toHaveLength(1)
    expect(words[0].word).toBe('ephemeral')
  })

  it('throws on unsupported file extension', () => {
    const filePath = path.join(tmpDir, 'words.txt')
    fs.writeFileSync(filePath, 'stuff')
    expect(() => parseImportFile(filePath)).toThrow('Unsupported file format')
  })

  it('throws on missing required fields', () => {
    const filePath = path.join(tmpDir, 'words.json')
    fs.writeFileSync(filePath, JSON.stringify([{ word: 'test' }]))
    expect(() => parseImportFile(filePath)).toThrow()
  })
})
