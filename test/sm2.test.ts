import { describe, it, expect } from 'vitest'
import { createCard, reviewCard } from '../src/core/sm2.js'
import type { Card } from '../src/types.js'

describe('createCard', () => {
  it('creates a new card with default SM-2 values', () => {
    const card = createCard('ability', 'en2cn')
    expect(card.word).toBe('ability')
    expect(card.direction).toBe('en2cn')
    expect(card.easeFactor).toBe(2.5)
    expect(card.interval).toBe(0)
    expect(card.repetitions).toBe(0)
    expect(card.nextReview).toBe(new Date().toISOString().slice(0, 10))
    expect(card.lastReview).toBeUndefined()
  })
})

describe('reviewCard', () => {
  it('resets on "again" rating', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 6,
      repetitions: 3,
      nextReview: '2026-01-01',
      lastReview: '2026-01-01',
    }
    const result = reviewCard(card, 'again')
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBeLessThan(2.5)
  })

  it('handles "hard" rating — small interval increase', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 6,
      repetitions: 3,
      nextReview: '2026-01-01',
      lastReview: '2026-01-01',
    }
    const result = reviewCard(card, 'hard')
    expect(result.interval).toBe(Math.ceil(6 * 1.2))
    expect(result.repetitions).toBe(card.repetitions + 1)
    expect(result.easeFactor).toBeLessThan(2.5)
  })

  it('handles "good" rating — standard progression', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: '2026-01-01',
      lastReview: '2026-01-01',
    }
    const result = reviewCard(card, 'good')
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
    expect(result.easeFactor).toBe(2.5)
  })

  it('handles "easy" rating — bonus interval', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 6,
      repetitions: 3,
      nextReview: '2026-01-01',
      lastReview: '2026-01-01',
    }
    const result = reviewCard(card, 'easy')
    expect(result.interval).toBe(Math.ceil(6 * 2.5 * 1.3))
    expect(result.repetitions).toBe(card.repetitions + 1)
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  it('first "good" repetition sets interval to 1', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: '2026-01-01',
    }
    const result = reviewCard(card, 'good')
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('second "good" repetition sets interval to 6', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: '2026-01-01',
      lastReview: '2026-01-01',
    }
    const result = reviewCard(card, 'good')
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('subsequent "good" uses ease factor for interval', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: '2026-01-01',
      lastReview: '2026-01-01',
    }
    const result = reviewCard(card, 'good')
    expect(result.interval).toBe(Math.ceil(6 * 2.5))
    expect(result.repetitions).toBe(3)
  })

  it('never lets ease factor drop below 1.3', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 1.36,
      interval: 1,
      repetitions: 0,
      nextReview: '2026-01-01',
    }
    const result = reviewCard(card, 'again')
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('updates nextReview to today + interval days', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: '2026-01-01',
    }
    const result = reviewCard(card, 'good')
    const expected = new Date()
    expected.setDate(expected.getDate() + result.interval)
    expect(result.nextReview).toBe(expected.toISOString().slice(0, 10))
  })

  it('updates lastReview to today', () => {
    const card: Card = {
      word: 'ability',
      direction: 'en2cn',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: '2026-01-01',
    }
    const result = reviewCard(card, 'good')
    expect(result.lastReview).toBe(new Date().toISOString().slice(0, 10))
  })
})
