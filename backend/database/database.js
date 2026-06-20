import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const { Pool } = pg
const currentDir = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({
  path: path.resolve(currentDir, '../../.env'),
  quiet: true,
})

for (const typeId of [1082, 1083, 1114, 1184]) {
  pg.types.setTypeParser(typeId, (value) => value)
}

const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true'
const rejectUnauthorized = String(
  process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true',
).toLowerCase() !== 'false'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nao esta configurada.')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized } : false,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

export async function sql(strings, ...values) {
  const text = strings.reduce(
    (query, part, index) => query + part + (index < values.length ? `$${index + 1}` : ''),
    '',
  )
  const result = await pool.query(text, values)
  return result.rows
}

export async function initializeDatabase() {
  const schema = await fs.readFile(path.join(currentDir, 'schema.sql'), 'utf8')
  const attempts = Number(process.env.DB_STARTUP_ATTEMPTS || 12)

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query(schema)
      return
    } catch (error) {
      if (attempt === attempts) throw error
      console.warn(`PostgreSQL indisponivel; nova tentativa ${attempt}/${attempts}.`)
      await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
  }
}

export async function checkDatabase() {
  await pool.query('SELECT 1')
}

export async function closeDatabase() {
  await pool.end()
}
