import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const { Pool } = pg

// Exporta os valores temporais exatamente como o PostgreSQL os devolve.
for (const typeId of [1082, 1083, 1114, 1184]) {
  pg.types.setTypeParser(typeId, (value) => value)
}

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

const sourceUrl = process.env.SOURCE_DATABASE_URL
if (!sourceUrl) {
  throw new Error('Defina SOURCE_DATABASE_URL com a conexao do banco atual (Neon).')
}

const outputArgument = process.argv.find((argument) => argument.startsWith('--output='))
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const outputPath = path.resolve(
  outputArgument?.slice('--output='.length) || `backups/sisvc-${timestamp}.json`,
)

const pool = new Pool({
  connectionString: sourceUrl,
  ssl: process.env.SOURCE_DB_SSL === 'false'
    ? false
    : { rejectUnauthorized: process.env.SOURCE_DB_SSL_REJECT_UNAUTHORIZED !== 'false' },
  max: 2,
})

try {
  const backup = {
    format: 'sisvc-database-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {},
    counts: {},
  }

  for (const [table, columns] of Object.entries(TABLES)) {
    const projection = columns.map((column) => `"${column}"`).join(', ')
    const result = await pool.query(`SELECT ${projection} FROM "${table}" ORDER BY id`)
    backup.tables[table] = result.rows
    backup.counts[table] = result.rowCount
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(backup, null, 2), { mode: 0o600 })

  console.log(`Backup criado em: ${outputPath}`)
  console.log('Registros exportados:', backup.counts)
  console.log('O arquivo contem dados pessoais e deve permanecer em local protegido.')
} finally {
  await pool.end()
}
