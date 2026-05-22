import * as clack from '@clack/prompts'
import chalk from 'chalk'
import type { Card, WordEntry, Rating, Progress } from '../types.js'
import { reviewCard, createCard } from '../core/sm2.js'
import { formatWordFront, formatWordBack, formatSessionSummary } from '../utils/format.js'

export async function runLearnSession(
  allWords: WordEntry[],
  progress: Progress,
  newPerDay: number,
  reviewLimit: number,
): Promise<{ progress: Progress; reviewed: number; correct: number }> {
  const wordMap = new Map(allWords.map(w => [w.word, w]))
  const existingWords = new Set(progress.cards.map(c => c.word))

  const todayCards = progress.cards
    .filter(c => c.nextReview <= new Date().toISOString().slice(0, 10))
    .slice(0, reviewLimit)
  const newWords = allWords.filter(w => !existingWords.has(w.word)).slice(0, newPerDay)

  const totalQueue = todayCards.length + newWords.length
  if (totalQueue === 0) {
    clack.outro(chalk.green('🎉 今日学习已完成！没有需要复习的词。'))
    return { progress, reviewed: 0, correct: 0 }
  }

  clack.intro(`📚 今日学习: ${todayCards.length} 个复习 + ${newWords.length} 个新词`)

  let reviewed = 0
  let correct = 0

  for (const card of todayCards) {
    const entry = wordMap.get(card.word)
    if (!entry) continue
    const result = await reviewOne(card, entry)
    if (result === 'cancel') break

    const updated = reviewCard(card, result.rating)
    const idx = progress.cards.findIndex(c => c.word === card.word && c.direction === card.direction)
    progress.cards[idx] = updated
    progress.history.push({ word: card.word, direction: card.direction, rating: result.rating, timestamp: new Date().toISOString() })
    reviewed++
    if (result.rating !== 'again') correct++
  }

  for (const word of newWords) {
    const direction = 'en2cn' as const
    const result = await reviewOne(null, word, direction)
    if (result === 'cancel') break

    const card = createCard(word.word, direction)
    const updated = reviewCard(card, result.rating)
    progress.cards.push(updated)
    progress.history.push({ word: word.word, direction, rating: result.rating, timestamp: new Date().toISOString() })
    reviewed++
    if (result.rating !== 'again') correct++
  }

  console.log(formatSessionSummary(reviewed, correct))
  return { progress, reviewed, correct }
}

async function reviewOne(
  card: Card | null,
  entry: WordEntry,
  direction?: 'en2cn' | 'cn2en',
): Promise<{ rating: Rating } | 'cancel'> {
  const dir = direction ?? card!.direction
  console.log('\n' + formatWordFront(entry, dir))

  const reveal = await clack.confirm({ message: '显示答案?' })
  if (clack.isCancel(reveal)) return 'cancel'

  console.log(formatWordBack(entry, dir))
  if (entry.example) console.log(chalk.gray(`  💬 ${entry.example}`))

  const rating = await clack.select<{ value: Rating; label: string }[], Rating>({
    message: '评价:',
    options: [
      { value: 'again', label: '🔴 重来 (Again)' },
      { value: 'hard', label: '🟡 困难 (Hard)' },
      { value: 'good', label: '🟢 记住了 (Good)' },
      { value: 'easy', label: '🔵 太简单 (Easy)' },
    ],
  })
  if (clack.isCancel(rating)) return 'cancel'

  return { rating: rating as Rating }
}
