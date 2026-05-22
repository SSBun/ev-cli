import chalk from 'chalk'
import type { WordEntry } from '../types.js'

export function formatWordFront(entry: WordEntry, direction: 'en2cn' | 'cn2en'): string {
  if (direction === 'en2cn') {
    let text = chalk.bold.cyan(entry.word)
    if (entry.ipa) text += chalk.gray(` ${entry.ipa}`)
    if (entry.pos) text += chalk.gray(` (${entry.pos})`)
    return text
  }
  return chalk.bold.yellow(entry.definition)
}

export function formatWordBack(entry: WordEntry, direction: 'en2cn' | 'cn2en'): string {
  if (direction === 'en2cn') return chalk.green(entry.definition)
  let text = chalk.bold.cyan(entry.word)
  if (entry.ipa) text += chalk.gray(` ${entry.ipa}`)
  return text
}

export function formatStats(stats: {
  reviewedToday: number
  streak: number
  retentionRate: number
  totalWords: number
  matureWords: number
}): string {
  return [
    `📊 今日已学: ${chalk.bold(String(stats.reviewedToday))}`,
    `🔥 连续天数: ${chalk.bold(String(stats.streak))}`,
    `✅ 记忆保持: ${chalk.bold(stats.retentionRate.toFixed(1) + '%')}`,
    `📚 总词数: ${chalk.bold(String(stats.totalWords))}`,
    `🎓 已掌握: ${chalk.bold(String(stats.matureWords))} (间隔 > 21天)`,
  ].join('\n')
}

export function formatSessionSummary(reviewed: number, correct: number): string {
  const rate = reviewed > 0 ? ((correct / reviewed) * 100).toFixed(1) : '0.0'
  return [
    `\n━━━ 📝 学习结束 ━━━`,
    `本次复习: ${chalk.bold(String(reviewed))} 个`,
    `正确率: ${chalk.bold(rate + '%')}`,
  ].join('\n')
}
