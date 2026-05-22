import { describe, it, expect } from 'vitest'
import { loadPack, listPacks } from '../src/store/packs.js'

describe('loadPack', () => {
  it('loads a word pack by id', () => {
    const pack = loadPack('cet4')
    expect(pack.id).toBe('cet4')
    expect(pack.name).toBe('四级 (CET-4)')
    expect(pack.words.length).toBeGreaterThan(0)
  })

  it('returns words with correct shape', () => {
    const pack = loadPack('cet4')
    const word = pack.words[0]
    expect(word).toHaveProperty('word')
    expect(word).toHaveProperty('definition')
    expect(word).toHaveProperty('pos')
  })

  it('throws for unknown pack id', () => {
    expect(() => loadPack('nonexistent')).toThrow()
  })
})

describe('listPacks', () => {
  it('returns list of available packs', () => {
    const packs = listPacks()
    expect(packs.length).toBeGreaterThan(0)
    expect(packs[0]).toHaveProperty('id')
    expect(packs[0]).toHaveProperty('name')
    expect(packs[0]).toHaveProperty('count')
  })
})
