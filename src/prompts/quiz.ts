import * as clack from '@clack/prompts'
import chalk from 'chalk'
import type { WordEntry } from '../types.js'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(allWords: WordEntry[], correct: WordEntry, count: number): WordEntry[] {
  const others = allWords.filter(w => w.word !== correct.word)
  return shuffle(others).slice(0, count)
}

export async function runQuizSession(allWords: WordEntry[], count = 10): Promise<{ total: number; correct: number }> {
  const questions = shuffle(allWords).slice(0, count)
  if (questions.length === 0) {
    clack.outro(chalk.yellow('词库为空，请先添加词汇。'))
    return { total: 0, correct: 0 }
  }

  clack.intro(`🎯 测验模式: ${questions.length} 题`)

  let correct = 0
  const direction = Math.random() < 0.5 ? 'en2cn' : 'cn2en'

  for (const word of questions) {
    const distractors = pickDistractors(allWords, word, 3)
    const options = shuffle([word, ...distractors])

    const question = direction === 'en2cn' ? word.word : word.definition
    const correctAnswer = direction === 'en2cn' ? word.definition : word.word

    const choice = await clack.select<{ value: string; label: string }[], string>({
      message: `${question}`,
      options: options.map(o => ({
        value: direction === 'en2cn' ? o.definition : o.word,
        label: direction === 'en2cn' ? o.definition : o.word,
      })),
    })

    if (clack.isCancel(choice)) break

    if (choice === correctAnswer) {
      correct++
      console.log(chalk.green('  ✅ 正确!'))
    } else {
      console.log(chalk.red(`  ❌ 错误! 正确答案: ${correctAnswer}`))
    }
  }

  console.log(`\n🎯 得分: ${chalk.bold(String(correct))}/${questions.length} (${((correct / questions.length) * 100).toFixed(0)}%)`)
  return { total: questions.length, correct }
}
