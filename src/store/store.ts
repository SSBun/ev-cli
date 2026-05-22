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
