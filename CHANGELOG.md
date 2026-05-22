# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-05-22

### Added

- SM-2 spaced repetition algorithm with Again/Hard/Good/Easy rating
- 7 built-in word packs (54,356 words) from KyleBing/english-vocabulary
- `ev-cli learn` — interactive SRS review session (en2cn direction)
- `ev-cli quiz` — multiple choice quiz mode
- `ev-cli add` — add custom words interactively
- `ev-cli import` — bulk import from CSV or JSON files
- `ev-cli list` — list available word packs and words
- `ev-cli config` — view/set preferences (pack, daily limits, backup dir)
- `ev-cli stats` — show learning progress (streak, retention, mature words)
- `ev-cli sync` — bidirectional backup sync with mtime comparison
- Automatic backup sync after each learn session
- Configurable backup directory (supports iCloud, Dropbox, etc.)
- Learning stats: daily review count, streak, retention rate, mature words
- JSON-based local storage in `~/.ev-cli/`
- Data conversion script for upstream vocabulary repository

### Technical

- TypeScript, ESM-only, Node.js >= 20
- Commander.js for CLI routing
- @clack/prompts for interactive sessions
- tsup/esbuild for bundling
- Vitest for testing (35 tests)
