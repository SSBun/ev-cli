import fs from 'node:fs'
import path from 'node:path'

const PACK_MAP: Record<string, string> = {
  '初中': 'junior',
  '高中': 'senior',
  '四级': 'cet4',
  '六级': 'cet6',
  '考研': 'postgrad',
  '托福': 'toefl',
  'SAT': 'sat',
}

interface UpstreamWord {
  word: string
  translations: { translation: string; type: string }[]
  phrases?: { phrase: string; translation: string }[]
  sentences?: { sentence: string; translation: string }[]
  phonetic?: { us: string; uk: string }
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

  for (const [chineseName, packId] of Object.entries(PACK_MAP)) {
    const inputFile = path.join(inputDir, `${chineseName}.json`)
    if (!fs.existsSync(inputFile)) {
      console.log(`⏭️  跳过 ${chineseName}: 文件不存在`)
      continue
    }

    const raw: UpstreamWord[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
    const converted: InternalWord[] = raw.map(w => ({
      word: w.word,
      definition: w.translations.map(t => `${t.type} ${t.translation}`).join('；'),
      pos: w.translations.map(t => t.type).join('/'),
      example: w.sentences?.[0]?.sentence,
      ipa: w.phonetic?.us,
    }))

    const outputFile = path.join(outputDir, `${packId}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(converted, null, 2) + '\n')
    console.log(`✅ ${chineseName} → ${packId}.json (${converted.length} 词)`)
  }
}

const inputDir = process.argv[2]
const outputDir = process.argv[3] || 'data'

if (!inputDir) {
  console.error('用法: npx tsx scripts/convert-data.ts <json-sentence目录> [输出目录]')
  process.exit(1)
}

convert(inputDir, outputDir)
