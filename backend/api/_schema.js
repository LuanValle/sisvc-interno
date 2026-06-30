import { sql } from './_db.js'

let videoconferenciaSchemaReady = false
let solicitacaoSchemaReady = false
let auditSchemaReady = false

export async function ensureAuditSchema() {
    if (auditSchemaReady) return

    await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            acao TEXT NOT NULL,
            entidade TEXT NOT NULL,
            entidade_id TEXT,
            usuario TEXT,
            detalhes JSONB,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `

    await sql`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_criado
        ON audit_logs (criado_em DESC)
    `

    await sql`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade
        ON audit_logs (entidade, entidade_id)
    `

    auditSchemaReady = true
}

export async function ensureSolicitacaoSchema() {
    if (solicitacaoSchemaReady) return

    await sql`
        ALTER TABLE solicitacoes
        ADD COLUMN IF NOT EXISTS email_responsavel TEXT
    `

    await sql`
        ALTER TABLE solicitacoes
        ADD COLUMN IF NOT EXISTS solicitar_link BOOLEAN NOT NULL DEFAULT false
    `

    await sql`
        ALTER TABLE solicitacoes
        ADD COLUMN IF NOT EXISTS local_fisico TEXT
    `

    await sql`
        ALTER TABLE solicitacoes
        ADD COLUMN IF NOT EXISTS horario_fim TIME
    `

    solicitacaoSchemaReady = true
}

export async function ensureVideoconferenciaSchema() {
    if (videoconferenciaSchemaReady) return

    await sql`
        ALTER TABLE videoconferencias
        ADD COLUMN IF NOT EXISTS local_fisico TEXT
    `

    await sql`
        ALTER TABLE videoconferencias
        ADD COLUMN IF NOT EXISTS horario_fim TIME
    `

    await sql`
        ALTER TABLE videoconferencias
        ADD COLUMN IF NOT EXISTS data_fim DATE
    `

    await sql`
        ALTER TABLE videoconferencias
        ADD COLUMN IF NOT EXISTS recurrence_group_id TEXT
    `

    await sql`
        ALTER TABLE videoconferencias
        ADD COLUMN IF NOT EXISTS recurrence_type TEXT
    `

    await sql`
        CREATE INDEX IF NOT EXISTS idx_videoconferencias_periodo
        ON videoconferencias (concluida, data, data_fim, horario)
    `

    videoconferenciaSchemaReady = true
}
