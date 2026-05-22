export interface WordEntry {
  word: string
  definition: string
  pos: string
  example?: string
  ipa?: string
}

export type Direction = 'en2cn' | 'cn2en'

export interface Card {
  word: string
  direction: Direction
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: string
  lastReview?: string
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface Config {
  activePack: string
  newPerDay: number
  reviewLimit: number
}

export interface Progress {
  cards: Card[]
  history: ReviewRecord[]
}

export interface ReviewRecord {
  word: string
  direction: Direction
  rating: Rating
  timestamp: string
}

export interface WordPack {
  id: string
  name: string
  words: WordEntry[]
}
