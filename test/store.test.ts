import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { loadConfig, saveConfig, loadProgress, saveProgress, ensureDataDir, syncBackup } from '../src/store/store.js'
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

  it('saves and loads progress with lastModified', () => {
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
    expect(loaded.cards).toEqual(progress.cards)
    expect(loaded.history).toEqual(progress.history)
    expect(loaded.lastModified).toBeTruthy()
    expect(loaded.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('handles corrupt progress file gracefully', () => {
    ensureDataDir()
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), 'broken')
    const progress = loadProgress()
    expect(progress).toEqual({ cards: [], history: [] })
  })
})

describe('syncBackup', () => {
  it('does nothing when no backupDir configured', () => {
    const config = { activePack: 'cet4', newPerDay: 15, reviewLimit: 100 }
    syncBackup(config)
  })

  it('copies files to backup directory', () => {
    const config: Config = { activePack: 'cet4', newPerDay: 15, reviewLimit: 100 }
    saveConfig(config)
    saveProgress({ cards: [], history: [] })

    const backupRoot = path.join(tmpDir, 'backup')
    config.backupDir = backupRoot
    saveConfig(config)
    syncBackup(config)

    const backupDir = path.join(backupRoot, 'ev-cli')
    expect(fs.existsSync(path.join(backupDir, 'progress.json'))).toBe(true)
    expect(fs.existsSync(path.join(backupDir, 'config.json'))).toBe(true)
  })

  it('warns on unreachable backup directory', () => {
    const config: Config = { activePack: 'cet4', newPerDay: 15, reviewLimit: 100, backupDir: '/nonexistent/deep/path' }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    syncBackup(config)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
