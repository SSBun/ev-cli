import type { Card, Rating } from '../types.js'

const MIN_EASE_FACTOR = 1.3

export function createCard(word: string, direction: 'en2cn' | 'cn2en'): Card {
  return {
    word,
    direction,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: today(),
  }
}

export function reviewCard(card: Card, rating: Rating): Card {
  let { easeFactor, interval, repetitions } = card

  switch (rating) {
    case 'again':
      repetitions = 0
      interval = 1
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2)
      break
    case 'hard':
      interval = Math.ceil(interval * 1.2) || 1
      repetitions += 1
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15)
      break
    case 'good':
      if (repetitions === 0) {
        interval = 1
      } else if (repetitions === 1) {
        interval = 6
      } else {
        interval = Math.ceil(interval * easeFactor)
      }
      repetitions += 1
      break
    case 'easy':
      interval = Math.ceil(interval * easeFactor * 1.3) || 4
      repetitions += 1
      easeFactor += 0.15
      break
  }

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextDate.toISOString().slice(0, 10),
    lastReview: today(),
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
