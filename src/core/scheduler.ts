import type { Card, WordEntry, Config } from '../types.js'

export function getDueCards(cards: Card[], limit?: number): Card[] {
  const today = new Date().toISOString().slice(0, 10)
  const due = cards.filter(c => c.nextReview <= today)
  return limit ? due.slice(0, limit) : due
}

export function getNewCards(allWords: WordEntry[], existingCards: Card[], limit: number): WordEntry[] {
  const learnedWords = new Set(existingCards.map(c => c.word))
  return allWords.filter(w => !learnedWords.has(w.word)).slice(0, limit)
}

export function buildSession(
  allWords: WordEntry[],
  existingCards: Card[],
  config: Pick<Config, 'newPerDay' | 'reviewLimit'>,
): { dueCards: Card[]; newWords: WordEntry[] } {
  const dueCards = getDueCards(existingCards, config.reviewLimit)
  const newWords = getNewCards(allWords, existingCards, config.newPerDay)
  return { dueCards, newWords }
}
