import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const TABLES = {
  solicitacoes: [
    'id', 'nome', 'nip', 'setor', 'contato', 'email_responsavel',
    'nome_videoconferencia', 'local_plataforma', 'local_fisico', 'data',
    'horario', 'prioridade', 'link', 'solicitar_link', 'observacoes',
    'status', 'motivo_rejeicao', 'criado_em', 'atualizado_em',
  ],
  videoconferencias: [
    'id', 'nome', 'plataforma', 'local_fisico', 'data', 'horario', 'data_fim',
    'prioridade', 'responsavel', 'setor', 'link', 'observacoes', 'concluida',
    'solicitacao_id', 'recurrence_group_id', 'recurrence_type', 'criado_em',
    'atualizado_em',
  ],
  audit_logs: [
    'id', 'acao', 'entidade', 'entidade_id', 'usuario', 'detalhes', 'criado_em',
  ],
}

const inputArgument = process.argv.find((argument) => argument.startsWith('--input='))
if (!inputArgument) throw new Error('Informe --input=backups/arquivo.json.')
if (process.env.IMPORT_CONFIRM !== 'IMPORTAR_DADOS') {
  throw new Error('Defina IMPORT_CONFIRM=IMPORTAR_DADOS para confirmar a importacao.')
}

const inputPath = path.resolve(inputArgument.slice('--input='.length))
const backup = JSON.parse(await fs.readFile(inputPath, 'utf8'))

if (backup.format !== 'sisvc-database-backup' || backup.version !== 1) {
  throw new Error('Formato de backup invalido ou nao suportado.')
}

for (const table of Object.keys(TABLES)) {
  if (!Array.isArray(backup.tables?.[table])) {
    throw new Error(`O backup nao contem a tabela ${table}.`)
  }
}

const connectionConfig = process.env.TARGET_DATABASE_URL
  ? { connectionString: process.env.TARGET_DATABASE_URL }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    }

if (!process.env.TARGET_DATABASE_URL && !process.env.PGHOST) {
  throw new Error('Defina TARGET_DATABASE_URL ou PGHOST/PGDATABASE/PGUSER/PGPASSWORD.')
}

const pool = new Pool({
  ...connectionConfig,
  ssl: process.env.TARGET_DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.TARGET_DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false,
  max: 2,
})

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const schema = await fs.readFile(path.resolve(currentDir, '../database/schema.sql'), 'utf8')
const client = await pool.connect()

try {
  await client.query(schema)

  const countResult = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM solicitacoes) AS solicitacoes,
      (SELECT COUNT(*)::int FROM videoconferencias) AS videoconferencias,
      (SELECT COUNT(*)::int FROM audit_logs) AS audit_logs
  `)
  const existingCount = Object.values(countResult.rows[0]).reduce((sum, value) => sum + value, 0)

  if (existingCount > 0 && process.env.IMPORT_REPLACE_EXISTING !== 'true') {
    throw new Error(
      'O banco de destino ja contem dados. Defina IMPORT_REPLACE_EXISTING=true somente se deseja substitui-los.',
    )
  }

  await client.query('BEGIN')
  await client.query('TRUNCATE TABLE audit_logs, videoconferencias, solicitacoes RESTART IDENTITY CASCADE')

  for (const [table, columns] of Object.entries(TABLES)) {
    const columnList = columns.map((column) => `"${column}"`).join(', ')

    for (const row of backup.tables[table]) {
      const values = columns.map((column) => row[column] ?? null)
      const placeholders = columns.map((_column, index) => `$${index + 1}`).join(', ')
      await client.query(
        `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`,
        values,
      )
    }

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1),
        EXISTS (SELECT 1 FROM "${table}")
      )
    `)
  }

  for (const table of Object.keys(TABLES)) {
    const result = await client.query(`SELECT COUNT(*)::int AS total FROM "${table}"`)
    const expected = backup.tables[table].length
    if (result.rows[0].total !== expected) {
      throw new Error(`Contagem divergente em ${table}: ${result.rows[0].total} de ${expected}.`)
    }
  }

  await client.query('COMMIT')
  console.log('Importacao concluida e contagens verificadas:', backup.counts)
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  throw error
} finally {
  client.release()
  await pool.end()
}
