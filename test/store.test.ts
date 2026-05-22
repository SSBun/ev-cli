import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { loadConfig, saveConfig, loadProgress, saveProgress, ensureDataDir } from '../src/store/store.js'
import type { Config, Progress } from '../src/types.js'

let tmpDir: string
let origHome: string | undefined

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-cli-test-'))
  origHome = process.env.EV_CLI_HOME
  process.env.EV_CLI_HOME = tmpDir
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  if (origHome !== undefined) {
    process.env.EV_CLI_HOME = origHome
  } else {
    delete process.env.EV_CLI_HOME
  }
})

describe('ensureDataDir', () => {
  it('creates the data directory if missing', () => {
    ensureDataDir()
    expect(fs.existsSync(tmpDir)).toBe(true)
  })
})

describe('config', () => {
  it('returns default config when no file exists', () => {
    const config = loadConfig()
    expect(config).toEqual({
      activePack: 'cet4',
      newPerDay: 15,
      reviewLimit: 100,
    })
  })

  it('saves and loads config', () => {
    const config: Config = { activePack: 'cet6', newPerDay: 20, reviewLimit: 50 }
    saveConfig(config)
    const loaded = loadConfig()
    expect(loaded).toEqual(config)
  })

  it('handles corrupt config file gracefully', () => {
    ensureDataDir()
    fs.writeFileSync(path.join(tmpDir, 'config.json'), 'not json')
    const config = loadConfig()
    expect(config).toEqual({
      activePack: 'cet4',
      newPerDay: 15,
      reviewLimit: 100,
    })
  })
})

describe('progress', () => {
  it('returns empty progress when no file exists', () => {
    const progress = loadProgress()
    expect(progress).toEqual({ cards: [], history: [] })
  })

  it('saves and loads progress', () => {
    const progress: Progress = {
      cards: [
        { word: 'test', direction: 'en2cn', easeFactor: 2.5, interval: 1, repetitions: 1, nextReview: '2026-01-02', lastReview: '2026-01-01' },
      ],
      history: [
        { word: 'test', direction: 'en2cn', rating: 'good', timestamp: '2026-01-01T10:00:00.000Z' },
      ],
    }
    saveProgress(progress)
    const loaded = loadProgress()
    expect(loaded).toEqual(progress)
  })

  it('handles corrupt progress file gracefully', () => {
    ensureDataDir()
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), 'broken')
    const progress = loadProgress()
    expect(progress).toEqual({ cards: [], history: [] })
  })
})
