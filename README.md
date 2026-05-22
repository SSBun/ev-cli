# ev-cli

English vocabulary CLI for Chinese speakers — SM-2 spaced repetition in the terminal.

Built-in word packs sourced from [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary).

## Features

- SM-2 spaced repetition algorithm
- 7 built-in word packs (54,356 words): 初中, 高中, CET-4, CET-6, 考研, TOEFL, SAT
- Bidirectional review (English → Chinese)
- Multiple choice quiz mode
- Custom word addition and bulk import (CSV/JSON)
- Backup sync to configurable directory (e.g., iCloud)
- Learning stats: streak, retention rate, mature words

## Install

```bash
npm install -g ev-cli
# or
npx ev-cli --help
```

Requires Node.js >= 20.

## Usage

### Learn

```bash
ev-cli learn          # Start SRS review session
ev-cli quiz -n 10     # Multiple choice quiz
```

Review flow: see the word → press Enter to reveal answer → rate (Again/Hard/Good/Easy).

### Manage Words

```bash
ev-cli add                        # Add a custom word interactively
ev-cli import words.json          # Import from JSON
ev-cli import words.csv           # Import from CSV
ev-cli list                       # List available word packs
ev-cli list --pack cet4           # List words in a pack
```

### Configuration

```bash
ev-cli config                                 # View current config
ev-cli config --pack cet6                     # Switch active word pack
ev-cli config --new-per-day 20                # New words per day (default: 15)
ev-cli config --review-limit 50               # Max reviews per session (default: 100)
ev-cli config --backup-dir ~/path/to/cloud    # Set backup directory
```

### Backup & Sync

```bash
ev-cli sync          # Compare local files with backup, choose push or pull
```

Backup triggers automatically after each `learn` session. Files synced: `progress.json`, `config.json`, `custom.json`.

### Stats

```bash
ev-cli stats         # Show learning progress
```

## Word Packs

| ID | Name | Words |
|----|------|-------|
| junior | 初中 | 3,223 |
| senior | 高中 | 6,008 |
| cet4 | 四级 (CET-4) | 7,508 |
| cet6 | 六级 (CET-6) | 5,651 |
| postgrad | 考研 | 9,602 |
| toefl | 托福 (TOEFL) | 13,477 |
| sat | SAT | 8,887 |

## Data Storage

User data stored in `~/.ev-cli/`:

- `config.json` — user preferences
- `progress.json` — SRS card states and review history
- `custom.json` — user-added words

Override with `EV_CLI_HOME` environment variable.

## Development

```bash
npm install
npm run dev -- --help       # Run in dev mode
npm test                    # Run tests
npm run build               # Build for production
```

## License

MIT
