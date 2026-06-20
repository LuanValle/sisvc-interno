import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const IGNORED_DIRS = new Set(['.git', '.vercel', 'backups', 'dist', 'node_modules'])
const CHECKED_EXTENSIONS = new Set(['.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs'])
const MOJIBAKE_PATTERN = /\u00C3.|\u00C2.|\u00E2[\u20AC\u0080-\u00BF]|\uFFFD/

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue

    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath))
      continue
    }

    if (CHECKED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

const files = await listFiles(ROOT)
const matches = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    if (MOJIBAKE_PATTERN.test(line)) {
      matches.push(`${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`)
    }
  })
}

if (matches.length) {
  console.error('Foram encontrados textos com possivel acentuacao quebrada:')
  console.error(matches.join('\n'))
  process.exit(1)
}

console.log('Acentuacao verificada sem sinais de mojibake.')
