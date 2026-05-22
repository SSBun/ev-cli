# RFC: ev-cli — English Vocabulary CLI

**Status:** Draft
**Date:** 2026-05-22
**Author:** caishilin

## 1. Summary

`ev-cli` is a terminal-based English vocabulary learning tool for Chinese speakers. It uses spaced repetition (SM-2) and quizzes to drive long-term retention, with built-in word packs sourced from [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary).

## 2. Goals

- Effective vocabulary retention via SM-2 spaced repetition
- Zero-config learning experience with built-in word packs
- Fast, pleasant CLI interaction
- Support for custom word addition and bulk import

## 3. Target User

Chinese speakers learning English. Definitions, UI prompts, and word packs are Chinese-oriented. Exam preparation (CET-4/6, 考研, TOEFL, SAT) is a primary use case.

## 4. Architecture

### 4.1 Tech Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript |
| Runtime | Node.js 20 LTS |
| Module system | ESM only |
| CLI framework | Commander.js |
| Interactive prompts | @clack/prompts |
| Build | tsup (esbuild) |
| Dev runner | tsx |
| Testing | Vitest |

### 4.2 Directory Structure

```
ev-cli/
├── src/
│   ├── commands/       # Commander subcommands
│   ├── core/           # SM-2 algorithm, card scheduling
│   ├── store/          # JSON file read/write, data layer
│   ├── prompts/        # Interactive review session UI
│   └── utils/          # Formatting, output helpers
├── data/               # Built-in word packs (JSON)
├── scripts/            # Data conversion scripts
├── test/               # Vitest tests
├── package.json
└── tsconfig.json
```

### 4.3 Distribution

Published to npm. Install via `npm install -g ev-cli` or run ad-hoc with `npx ev-cli`.

## 5. Data Model

### 5.1 Word Entry (Internal Schema)

```ts
interface WordEntry {
  word: string
  definition: string       // Chinese definition
  pos: string              // Part of speech: n, v, adj, etc.
  example?: string         // Example sentence
  ipa?: string             // IPA pronunciation
}
```

### 5.2 Card (SRS State)

```ts
interface Card {
  word: string
  direction: 'en2cn' | 'cn2en'  // Bidirectional review
  easeFactor: number       // SM-2 ease factor (default 2.5)
  interval: number         // Days until next review
  repetitions: number      // Consecutive correct responses
  nextReview: string       // ISO date
  lastReview?: string      // ISO date
}
```

### 5.3 User Config

```ts
interface Config {
  activePack: string       // Current word pack ID
  newPerDay: number        // Default: 15
  reviewLimit: number      // Default: 100
}
```

### 5.4 Storage

All user data stored in `~/.ev-cli/`:
- `config.json` — user preferences
- `progress.json` — card SRS states and review history

One JSON file, loaded/saved on each session. Human-readable, `jq`-compatible.

## 6. Word Packs

### 6.1 Built-in Packs

Sourced from [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary), using the `json-sentence` variant (includes IPA and example sentences).

| Pack ID | Name | Words |
|---------|------|-------|
| junior | 初中 | 3,223 |
| senior | 高中 | 6,008 |
| cet4 | 四级 (CET-4) | 7,508 |
| cet6 | 六级 (CET-6) | 5,651 |
| postgrad | 考研 | 9,602 |
| toefl | 托福 (TOEFL) | 13,477 |
| sat | SAT | 8,887 |

Data is vendored in `data/` as JSON files. A conversion script (`scripts/convert-data.ts`) transforms the upstream `json-sentence` format to the internal schema. Pinned to a specific upstream commit.

### 6.2 Custom Words

Users add words interactively via `ev-cli add`. Stored in a special `custom` pack.

### 6.3 Import

Users can import words from JSON or CSV files via `ev-cli import <file>`. Format auto-detected by file extension.

**JSON format:**
```json
[
  { "word": "ephemeral", "definition": "短暂的", "pos": "adj", "example": "The ephemeral beauty of cherry blossoms", "ipa": "/ɪˈfemərəl/" }
]
```

**CSV format:**
```
word,definition,pos,example,ipa
ephemeral,短暂的,adj,"The ephemeral beauty of cherry blossoms",/ɪˈfemərəl/
```

## 7. Learning Mechanism

### 7.1 Spaced Repetition (SM-2)

Algorithm: [SuperMemo SM-2](https://supermemo.guru/wiki/SuperMemo_1.0_for_DOS_(1987)#Algorithm_SM-2)

Each card tracks:
- `easeFactor` — starts at 2.5, adjusted on each review
- `interval` — days until next review
- `repetitions` — consecutive correct count

### 7.2 Review Rating

4-button system (maps to SM-2 quality values):

| Button | SM-2 Quality | Behavior |
|--------|-------------|----------|
| Again | 0 | Reset repetitions to 0, interval = 1 day |
| Hard | 2 | Decrease ease factor, interval *= 1.2 |
| Good | 3 | Standard interval progression |
| Easy | 5 | Increase ease factor, bonus interval multiplier |

"Good" is the default — most reviews require no deliberation.

### 7.3 Bidirectional Cards

Each word generates two cards:
- **en2cn**: show English word → recall Chinese definition
- **cn2en**: show Chinese definition → recall English word

Both directions scheduled independently in the SRS queue.

### 7.4 Quiz Mode

Multiple choice supplement to SRS review:
- Show a word + 4 candidate definitions (or reverse)
- Correct answers drawn from same pack to increase difficulty
- Quiz results do not affect SRS scheduling (low-stakes practice)

## 8. CLI Commands

```
ev-cli learn            Start SRS review session (interactive)
ev-cli quiz             Start multiple choice quiz (interactive)
ev-cli add              Add a custom word interactively
ev-cli import <file>    Import words from CSV/JSON file
ev-cli list [--pack]    List words, optionally filtered by pack
ev-cli stats            Show progress summary
ev-cli config           View/set preferences
```

### 8.1 `ev-cli learn`

Interactive session flow:
1. Load cards due for review from `progress.json`
2. If new word slots available, draw from active pack
3. Present cards one-by-one via @clack/prompts
4. Show card → user attempts recall → reveal answer → user rates (Again/Hard/Good/Easy)
5. Update SRS state, save after each card
6. Session ends when queue empty or user quits
7. Display summary: cards reviewed, retention rate, streak

### 8.2 `ev-cli stats`

Display:
- Words learned today / total
- Current streak (consecutive days)
- Retention rate (%)
- Total words in active deck
- Mature words (interval > 21 days)

## 9. Daily Limits

Configurable via `ev-cli config`:

| Setting | Default | Description |
|---------|---------|-------------|
| `newPerDay` | 15 | New words introduced per day |
| `reviewLimit` | 100 | Max reviews per session |

Rationale: 15 new words/day produces ~100 reviews/day within a week due to SRS scheduling. Default prevents burnout.

## 10. Conversion Pipeline

```
KyleBing/english-vocabulary (json-sentence)
    ↓ scripts/convert-data.ts
data/{pack-id}.json (internal schema)
    ↓ bundled by tsup
npm package (ev-cli)
```

Conversion script:
1. Reads upstream `json-sentence` files
2. Maps to internal `WordEntry` schema
3. Outputs `data/{pack-id}.json`
4. Logged with upstream commit hash for reproducibility

## 11. Testing Plan

Critical paths to test:
- SM-2 algorithm correctness (interval calculation, ease factor updates)
- Card scheduling (due card selection, daily limits)
- Data import (JSON/CSV parsing, validation)
- Progress file read/write (edge cases: corrupt file, missing fields)

Unit tests via Vitest. Target: >90% coverage on `core/` and `store/`.

## 12. Future Considerations (Out of Scope for v1)

- Export/import of user progress for backup/migration
- Cloud sync across devices
- Audio pronunciation playback
- Frequency-based word packs
- Detailed analytics (per-word history, charts)
- `ev-cli search` and `ev-cli edit` commands
- Homebrew distribution
