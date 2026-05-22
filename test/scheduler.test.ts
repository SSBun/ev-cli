import { describe, it, expect } from 'vitest'
import { getDueCards, getNewCards, buildSession } from '../src/core/scheduler.js'
import type { Card, WordEntry } from '../src/types.js'

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    word: 'test',
    direction: 'en2cn',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: today,
    ...overrides,
  }
}

const sampleWords: WordEntry[] = [
  { word: 'ability', definition: '能力', pos: 'n' },
  { word: 'abandon', definition: '放弃', pos: 'v' },
  { word: 'abstract', definition: '抽象的', pos: 'adj' },
  { word: 'academic', definition: '学术的', pos: 'adj' },
  { word: 'accelerate', definition: '加速', pos: 'v' },
]

describe('getDueCards', () => {
  it('returns cards where nextReview <= today', () => {
    const cards = [
      makeCard({ word: 'a', nextReview: today }),
      makeCard({ word: 'b', nextReview: yesterday }),
      makeCard({ word: 'c', nextReview: tomorrow }),
    ]
    const due = getDueCards(cards)
    expect(due).toHaveLength(2)
    expect(due.map(c => c.word)).toEqual(['a', 'b'])
  })

  it('returns empty array when nothing is due', () => {
    const cards = [makeCard({ nextReview: tomorrow })]
    expect(getDueCards(cards)).toHaveLength(0)
  })

  it('respects review limit', () => {
    const cards = Array.from({ length: 5 }, (_, i) => makeCard({ word: `w${i}`, nextReview: today }))
    const due = getDueCards(cards, 3)
    expect(due).toHaveLength(3)
  })
})

describe('getNewCards', () => {
  it('returns words that have no card yet', () => {
    const existingCards: Card[] = [
      makeCard({ word: 'ability', direction: 'en2cn' }),
      makeCard({ word: 'ability', direction: 'cn2en' }),
    ]
    const newWords = getNewCards(sampleWords, existingCards, 10)
    const newWordNames = newWords.map(w => w.word)
    expect(newWordNames).not.toContain('ability')
    expect(newWordNames).toContain('abandon')
    expect(newWordNames).toContain('abstract')
  })

  it('respects new per day limit', () => {
    const newWords = getNewCards(sampleWords, [], 2)
    expect(newWords).toHaveLength(2)
  })
})

describe('buildSession', () => {
  it('combines due reviews and new cards', () => {
    const existingCards: Card[] = [
      makeCard({ word: 'ability', nextReview: today }),
    ]
    const session = buildSession(sampleWords, existingCards, { newPerDay: 2, reviewLimit: 100 })
    expect(session.dueCards.length + session.newWords.length).toBeGreaterThan(0)
  })
})
