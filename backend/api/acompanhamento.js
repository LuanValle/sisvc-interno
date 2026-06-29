import { sql } from './_db.js'
import { ensureSolicitacaoSchema, ensureVideoconferenciaSchema } from './_schema.js'

const PAGE_SIZE = 10
const FILTERS = new Set(['nip', 'nome', 'responsavel', 'data'])

const parsePage = (value) => {
    const page = Number.parseInt(value, 10)
    return Number.isFinite(page) && page > 0 ? page : 1
}

const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsedDate = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value
}

function validateSearch(type, rawValue) {
    if (!FILTERS.has(type)) {
        return { error: 'Selecione um tipo de busca valido.' }
    }

    const value = String(rawValue || '').trim()

    if (type === 'nip') {
        const digits = value.replace(/\D/g, '')
        if (digits.length !== 8) {
            return { error: 'Informe o NIP completo para realizar a busca.' }
        }
        return { value, nip: digits }
    }

    if (type === 'data') {
        if (!isValidDate(value)) {
            return { error: 'Informe uma data valida para realizar a busca.' }
        }
        return { value }
    }

    const safeText = value.replace(/[%_]/g, '').trim()
    if (safeText.length < 3) {
        return { error: 'Digite pelo menos 3 caracteres para realizar a busca.' }
    }

    return { value: safeText }
}

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({
            error: 'Metodo nao permitido. Use GET.',
        })
    }

    response.setHeader('Cache-Control', 'no-store, max-age=0')

    try {
        const type = String(request.query?.tipo || 'nip').trim().toLowerCase()
        const search = validateSearch(type, request.query?.valor)

        if (search.error) {
            return response.status(400).json({ error: search.error })
        }

        const page = parsePage(request.query?.pagina)
        const offset = (page - 1) * PAGE_SIZE
        const nipValue = type === 'nip' ? search.nip : ''
        const textPattern = ['nome', 'responsavel'].includes(type) ? `%${search.value}%` : ''
        const dateValue = type === 'data' ? search.value : '1970-01-01'

        await Promise.all([
            ensureSolicitacaoSchema(),
            ensureVideoconferenciaSchema(),
        ])

        const rows = await sql`
            SELECT
                s.id,
                s.nome_videoconferencia,
                s.nip,
                COALESCE(v.responsavel, s.nome) AS responsavel,
                s.data,
                COALESCE(v.local_fisico, s.local_fisico) AS local,
                CASE
                    WHEN COALESCE(v.concluida, false) THEN 'concluida'
                    WHEN s.status = 'aprovada' THEN 'aprovada'
                    ELSE 'pendente'
                END AS status
            FROM solicitacoes s
            LEFT JOIN LATERAL (
                SELECT
                    vc.responsavel,
                    vc.local_fisico,
                    vc.concluida
                FROM videoconferencias vc
                WHERE vc.solicitacao_id = s.id
                ORDER BY vc.id DESC
                LIMIT 1
            ) v ON true
            WHERE s.status IN ('pendente', 'aprovada')
              AND (
                    (${type} = 'nip' AND REGEXP_REPLACE(s.nip, '[^0-9]', '', 'g') = ${nipValue})
                 OR (${type} = 'nome' AND s.nome_videoconferencia ILIKE ${textPattern})
                 OR (${type} = 'responsavel' AND COALESCE(v.responsavel, s.nome) ILIKE ${textPattern})
                 OR (${type} = 'data' AND s.data = ${dateValue}::date)
              )
            ORDER BY s.data DESC, s.horario DESC, s.id DESC
            LIMIT ${PAGE_SIZE + 1}
            OFFSET ${offset}
        `

        const hasMore = rows.length > PAGE_SIZE

        return response.status(200).json({
            data: rows.slice(0, PAGE_SIZE),
            meta: {
                page,
                pageSize: PAGE_SIZE,
                hasMore,
            },
        })
    } catch (error) {
        console.error('Erro na consulta publica de acompanhamento:', error)
        return response.status(500).json({
            error: 'Nao foi possivel consultar as videoconferencias.',
        })
    }
}
