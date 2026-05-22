import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { Config, Progress, WordEntry } from '../types.js'

const DEFAULT_CONFIG: Config = {
  activePack: 'cet4',
  newPerDay: 15,
  reviewLimit: 100,
}

function dataDir(): string {
  return process.env.EV_CLI_HOME || path.join(os.homedir(), '.ev-cli')
}

function configPath(): string {
  return path.join(dataDir(), 'config.json')
}

function progressPath(): string {
  return path.join(dataDir(), 'progress.json')
}

function customPackPath(): string {
  return path.join(dataDir(), 'custom.json')
}

export function ensureDataDir(): void {
  fs.mkdirSync(dataDir(), { recursive: true })
}

export function loadConfig(): Config {
  try {
    const raw = fs.readFileSync(configPath(), 'utf-8')
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: Config): void {
  ensureDataDir()
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n')
}

export function loadProgress(): Progress {
  try {
    const raw = fs.readFileSync(progressPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { cards: [], history: [] }
  }
}

export function saveProgress(progress: Progress): void {
  ensureDataDir()
  progress.lastModified = new Date().toISOString()
  fs.writeFileSync(progressPath(), JSON.stringify(progress, null, 2) + '\n')
}

export function loadCustomWords(): WordEntry[] {
  try {
    return JSON.parse(fs.readFileSync(customPackPath(), 'utf-8'))
  } catch {
    return []
  }
}

export function saveCustomWords(words: WordEntry[]): void {
  ensureDataDir()
  fs.writeFileSync(customPackPath(), JSON.stringify(words, null, 2) + '\n')
}

export function getSyncFiles(): { name: string; local: string }[] {
  return [
    { name: 'progress.json', local: progressPath() },
    { name: 'config.json', local: configPath() },
    { name: 'custom.json', local: customPackPath() },
  ]
}

export function getBackupDir(config: Config): string | undefined {
  return config.backupDir ? path.join(config.backupDir, 'ev-cli') : undefined
}

export type SyncStatus = 'local_newer' | 'backup_newer' | 'same' | 'local_only' | 'backup_only' | 'neither'

export function compareFileSync(name: string, localPath: string, backupPath: string): SyncStatus {
  const localExists = fs.existsSync(localPath)
  const backupExists = fs.existsSync(backupPath)
  if (!localExists && !backupExists) return 'neither'
  if (localExists && !backupExists) return 'local_only'
  if (!localExists && backupExists) return 'backup_only'
  const localMtime = fs.statSync(localPath).mtimeMs
  const backupMtime = fs.statSync(backupPath).mtimeMs
  if (Math.abs(localMtime - backupMtime) < 1000) return 'same'
  return localMtime > backupMtime ? 'local_newer' : 'backup_newer'
}

export function syncBackup(config: Config): void {
  if (!config.backupDir) return

  const backupDir = path.join(config.backupDir, 'ev-cli')
  const files = [
    { src: progressPath(), name: 'progress.json' },
    { src: configPath(), name: 'config.json' },
    { src: customPackPath(), name: 'custom.json' },
  ]

  try {
    fs.mkdirSync(backupDir, { recursive: true })
    for (const { src, name } of files) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(backupDir, name))
      }
    }
  } catch (e) {
    console.warn(`⚠️ 备份失败: ${(e as Error).message}`)
  }
}
