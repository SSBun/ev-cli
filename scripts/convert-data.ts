import fs from 'node:fs'
import path from 'node:path'

const PACK_MAP: Record<string, { prefix: string; name: string }> = {
  junior: { prefix: 'ChuZhong', name: '初中' },
  senior: { prefix: 'GaoZhong', name: '高中' },
  cet4: { prefix: 'CET4', name: '四级 (CET-4)' },
  cet6: { prefix: 'CET6', name: '六级 (CET-6)' },
  postgrad: { prefix: 'KaoYan', name: '考研' },
  toefl: { prefix: 'TOEFL', name: '托福 (TOEFL)' },
  sat: { prefix: 'SAT', name: 'SAT' },
}

interface UpstreamWord {
  word: string
  us?: string
  uk?: string
  translations: { translation: string; type: string }[]
  phrases?: { phrase: string; translation: string }[]
  sentences?: { sentence: string; translation: string }[]
}

interface InternalWord {
  word: string
  definition: string
  pos: string
  example?: string
  ipa?: string
}

function convert(inputDir: string, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true })

  for (const [packId, { prefix, name }] of Object.entries(PACK_MAP)) {
    const files = fs.readdirSync(inputDir)
      .filter(f => f.startsWith(prefix + '_') && f.endsWith('.json'))
      .sort()

    if (files.length === 0) {
      console.log(`⏭️  跳过 ${name}: 文件不存在`)
      continue
    }

    const converted: InternalWord[] = []
    for (const file of files) {
      const raw: UpstreamWord[] = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf-8'))
      for (const w of raw) {
        converted.push({
          word: w.word,
          definition: w.translations.map(t => `${t.type} ${t.translation}`).join('；'),
          pos: w.translations.map(t => t.type).join('/'),
          example: w.sentences?.[0]?.sentence,
          ipa: w.us,
        })
      }
    }

    const outputFile = path.join(outputDir, `${packId}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(converted, null, 2) + '\n')
    console.log(`✅ ${name} → ${packId}.json (${converted.length} 词)`)
  }
}

const inputDir = process.argv[2]
const outputDir = process.argv[3] || 'data'

if (!inputDir) {
  console.error('用法: npx tsx scripts/convert-data.ts <json-sentence目录> [输出目录]')
  process.exit(1)
}

convert(inputDir, outputDir)
