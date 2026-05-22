import { Command } from 'commander'
import * as clack from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig, saveConfig, loadProgress, saveProgress, loadCustomWords, saveCustomWords, syncBackup, getSyncFiles, getBackupDir, compareFileSync } from '../store/store.js'
import { loadPack, listPacks } from '../store/packs.js'
import { parseImportFile } from '../store/import.js'
import { runLearnSession } from '../prompts/review.js'
import { runQuizSession } from '../prompts/quiz.js'
import { formatStats } from '../utils/format.js'
import type { WordEntry } from '../types.js'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('ev-cli')
    .description('English vocabulary CLI — learn words with spaced repetition')
    .version('0.1.0')

  program
    .command('config')
    .description('View or set preferences')
    .option('--pack <id>', 'Set active word pack')
    .option('--new-per-day <n>', 'Set new words per day', parseInt)
    .option('--review-limit <n>', 'Set max reviews per session', parseInt)
    .option('--backup-dir <path>', 'Set backup directory')
    .action((opts) => {
      const config = loadConfig()
      if (opts.pack || opts.newPerDay || opts.reviewLimit || opts.backupDir) {
        if (opts.pack) config.activePack = opts.pack
        if (opts.newPerDay) config.newPerDay = opts.newPerDay
        if (opts.reviewLimit) config.reviewLimit = opts.reviewLimit
        if (opts.backupDir) config.backupDir = opts.backupDir
        saveConfig(config)
        console.log('✅ 配置已更新')
      }
      console.log(`当前配置:`)
      console.log(`  词库: ${config.activePack}`)
      console.log(`  每日新词: ${config.newPerDay}`)
      console.log(`  复习上限: ${config.reviewLimit}`)
      console.log(`  备份目录: ${config.backupDir || '未设置'}`)
    })

  program
    .command('list')
    .description('List available word packs')
    .option('--pack <id>', 'List words in a specific pack')
    .action((opts) => {
      if (opts.pack) {
        const pack = loadPack(opts.pack)
        pack.words.forEach(w => {
          console.log(`  ${w.word.padEnd(20)} ${w.definition}`)
        })
        console.log(`\n共 ${pack.words.length} 词`)
      } else {
        const packs = listPacks()
        packs.forEach(p => {
          console.log(`  ${p.id.padEnd(12)} ${p.name.padEnd(16)} ${p.count} 词`)
        })
      }
    })

  program
    .command('add')
    .description('Add a custom word')
    .action(async () => {
      clack.intro('📝 添加新词')
      const word = await clack.text({ message: '英文单词:' })
      if (clack.isCancel(word)) { clack.cancel('已取消'); return }
      const definition = await clack.text({ message: '中文释义:' })
      if (clack.isCancel(definition)) { clack.cancel('已取消'); return }
      const pos = await clack.text({ message: '词性 (n/v/adj/adv):' })
      if (clack.isCancel(pos)) { clack.cancel('已取消'); return }
      const example = await clack.text({ message: '例句 (可选):' })
      if (clack.isCancel(example)) { clack.cancel('已取消'); return }
      const ipa = await clack.text({ message: '音标 (可选):' })
      if (clack.isCancel(ipa)) { clack.cancel('已取消'); return }

      const entry: WordEntry = {
        word: word as string,
        definition: definition as string,
        pos: pos as string,
        example: (example as string) || undefined,
        ipa: (ipa as string) || undefined,
      }

      const words = loadCustomWords()
      words.push(entry)
      saveCustomWords(words)
      clack.outro(`✅ 已添加: ${entry.word}`)
    })

  program
    .command('import <file>')
    .description('Import words from CSV or JSON file')
    .action((file: string) => {
      const newWords = parseImportFile(file)
      const existing = loadCustomWords()
      const existingSet = new Set(existing.map(w => w.word))
      const unique = newWords.filter(w => !existingSet.has(w.word))
      saveCustomWords([...existing, ...unique])
      console.log(`✅ 导入完成: ${unique.length} 新词 (跳过 ${newWords.length - unique.length} 个重复)`)
    })

  program
    .command('learn')
    .description('Start review session')
    .action(async () => {
      const config = loadConfig()
      const progress = loadProgress()
      const pack = loadPack(config.activePack)
      const custom = loadCustomWords()
      const allWords = [...pack.words, ...custom]

      const { progress: updated, reviewed, correct } = await runLearnSession(
        allWords, progress, config.newPerDay, config.reviewLimit,
      )
      saveProgress(updated)
      syncBackup(config)
    })

  program
    .command('quiz')
    .description('Start multiple choice quiz')
    .option('-n, --count <n>', 'Number of questions', '10')
    .action(async (opts) => {
      const config = loadConfig()
      const pack = loadPack(config.activePack)
      const custom = loadCustomWords()
      const allWords = [...pack.words, ...custom]
      await runQuizSession(allWords, parseInt(opts.count))
    })

  program
    .command('stats')
    .description('Show learning progress')
    .action(() => {
      const progress = loadProgress()
      const today = new Date().toISOString().slice(0, 10)

      const reviewedToday = progress.history.filter(h => h.timestamp.startsWith(today)).length
      const totalWords = new Set(progress.cards.map(c => c.word)).size
      const matureWords = new Set(
        progress.cards.filter(c => c.interval > 21).map(c => c.word),
      ).size

      let streak = 0
      const dateSet = new Set(progress.history.map(h => h.timestamp.slice(0, 10)))
      const d = new Date()
      while (dateSet.has(d.toISOString().slice(0, 10))) {
        streak++
        d.setDate(d.getDate() - 1)
      }

      const recent = progress.history.slice(-100)
      const retentionRate = recent.length > 0
        ? (recent.filter(h => h.rating !== 'again').length / recent.length) * 100
        : 0

      console.log(formatStats({ reviewedToday, streak, retentionRate, totalWords, matureWords }))
    })

  program
    .command('sync')
    .description('Sync data files with backup directory')
    .action(async () => {
      const config = loadConfig()
      if (!config.backupDir) {
        console.log('⚠️ 备份目录未设置，请先运行: ev-cli config --backup-dir <path>')
        return
      }

      const backupDir = getBackupDir(config)!
      const files = getSyncFiles()

      const statusMap: Record<string, { label: string; icon: string }> = {
        local_newer: { label: '本地更新', icon: '📤' },
        backup_newer: { label: '备份更新', icon: '📥' },
        same: { label: '相同', icon: '✅' },
        local_only: { label: '仅本地', icon: '📤' },
        backup_only: { label: '仅备份', icon: '📥' },
        neither: { label: '不存在', icon: '⬜' },
      }

      const results = files.map(f => {
        const backupPath = path.join(backupDir, f.name)
        const status = compareFileSync(f.name, f.local, backupPath)
        return { ...f, backupPath, status }
      })

      console.log('\n文件同步状态:')
      for (const r of results) {
        const s = statusMap[r.status]
        console.log(`  ${s.icon} ${r.name.padEnd(16)} ${s.label}`)
      }

      const needsSync = results.some(r => r.status !== 'same' && r.status !== 'neither')
      if (!needsSync) {
        console.log('\n所有文件已同步，无需操作。')
        return
      }

      const direction = await clack.select<{ value: string; label: string }[], string>({
        message: '选择同步方向:',
        options: [
          { value: 'push', label: '📤 推送到备份 (本地 → 备份)' },
          { value: 'pull', label: '📥 从备份拉取 (备份 → 本地)' },
          { value: 'cancel', label: '❌ 取消' },
        ],
      })
      if (clack.isCancel(direction) || direction === 'cancel') {
        clack.cancel('已取消')
        return
      }

      fs.mkdirSync(backupDir, { recursive: true })
      for (const r of results) {
        if (r.status === 'neither') continue
        const src = direction === 'push' ? r.local : r.backupPath
        const dest = direction === 'push' ? r.backupPath : r.local
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
          const mtime = fs.statSync(src).mtime
          fs.utimesSync(dest, mtime, mtime)
          console.log(`  ✅ ${r.name} 已同步`)
        }
      }
      console.log('\n🎉 同步完成！')
    })

  return program
}
