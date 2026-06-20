import { requireAdmin } from './_auth.js'
import { sql } from './_db.js'
import { ensureAuditSchema, ensureVideoconferenciaSchema } from './_schema.js'

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))

const getFilters = (request) => {
    const inicio = request.query?.inicio || ''
    const fim = request.query?.fim || ''

    if (inicio && !isDate(inicio)) return { error: 'Data inicial invalida.' }
    if (fim && !isDate(fim)) return { error: 'Data final invalida.' }
    if (inicio && fim && fim < inicio) return { error: 'Data final nao pode ser anterior a inicial.' }

    return { inicio, fim }
}

async function listarLogs(inicio, fim) {
    if (inicio && fim) {
        return sql`
            SELECT *
            FROM audit_logs
            WHERE criado_em >= ${inicio}::date
              AND criado_em < (${fim}::date + INTERVAL '1 day')
            ORDER BY criado_em DESC
            LIMIT 300
        `
    }

    if (inicio) {
        return sql`
            SELECT *
            FROM audit_logs
            WHERE criado_em >= ${inicio}::date
            ORDER BY criado_em DESC
            LIMIT 300
        `
    }

    if (fim) {
        return sql`
            SELECT *
            FROM audit_logs
            WHERE criado_em < (${fim}::date + INTERVAL '1 day')
            ORDER BY criado_em DESC
            LIMIT 300
        `
    }

    return sql`
        SELECT *
        FROM audit_logs
        ORDER BY criado_em DESC
        LIMIT 300
    `
}

async function listarAgenda(inicio, fim) {
    if (inicio && fim) {
        return sql`
            SELECT *
            FROM videoconferencias
            WHERE data <= ${fim}::date
              AND COALESCE(data_fim, data) >= ${inicio}::date
            ORDER BY data ASC, horario ASC
        `
    }

    if (inicio) {
        return sql`
            SELECT *
            FROM videoconferencias
            WHERE COALESCE(data_fim, data) >= ${inicio}::date
            ORDER BY data ASC, horario ASC
        `
    }

    if (fim) {
        return sql`
            SELECT *
            FROM videoconferencias
            WHERE data <= ${fim}::date
            ORDER BY data ASC, horario ASC
        `
    }

    return sql`
        SELECT *
        FROM videoconferencias
        ORDER BY data ASC, horario ASC
    `
}

const montarResumoAgenda = (agenda) => ({
    total: agenda.length,
    concluidas: agenda.filter((item) => item.concluida).length,
    pendentes: agenda.filter((item) => !item.concluida).length,
    comLink: agenda.filter((item) => item.link).length,
})

export default async function handler(request, response) {
    try {
        if (request.method !== 'GET') {
            return response.status(405).json({
                error: 'Metodo nao permitido. Use GET.',
            })
        }

        if (requireAdmin(request, response)) return

        const filters = getFilters(request)
        if (filters.error) {
            return response.status(400).json({
                error: filters.error,
            })
        }

        await ensureAuditSchema()
        await ensureVideoconferenciaSchema()

        const [logs, agenda] = await Promise.all([
            listarLogs(filters.inicio, filters.fim),
            listarAgenda(filters.inicio, filters.fim),
        ])

        return response.status(200).json({
            filters,
            summary: montarResumoAgenda(agenda),
            logs,
            agenda,
        })
    } catch (error) {
        return response.status(500).json({
            error: 'Erro ao carregar auditoria.',
            details: error.message,
        })
    }
}
