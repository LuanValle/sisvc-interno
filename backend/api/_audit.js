import { sql } from './_db.js'
import { ensureAuditSchema } from './_schema.js'

const DEFAULT_ADMIN_USER = 'admin'

export const getAuditUser = () => process.env.ADMIN_USER || DEFAULT_ADMIN_USER

export async function logAuditAction({
    acao,
    entidade,
    entidadeId,
    usuario = getAuditUser(),
    detalhes = {},
}) {
    await ensureAuditSchema()

    await sql`
        INSERT INTO audit_logs (
            acao,
            entidade,
            entidade_id,
            usuario,
            detalhes
        )
        VALUES (
            ${acao},
            ${entidade},
            ${entidadeId ? String(entidadeId) : null},
            ${usuario},
            ${JSON.stringify(detalhes)}::jsonb
        )
    `
}

export async function safeLogAuditAction(payload) {
    try {
        await logAuditAction(payload)
    } catch (error) {
        console.error('Falha ao registrar auditoria:', error.message)
    }
}
