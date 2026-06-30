import { requireAdmin } from './_auth.js'
import { sql } from './_db.js'
import { readJsonBody, sendJsonParseError } from './_request.js'
import { ensureSolicitacaoSchema, ensureVideoconferenciaSchema } from './_schema.js'
import { isPastDate, isValidContact, isValidNip, isValidUrlOrEmpty, normalizeSector } from './_validators.js'
import { isValidTimeRange } from './_schedule.js'

const camposObrigatorios = [
    'nome',
    'nip',
    'setor',
    'contato',
    'nome_videoconferencia',
    'local_plataforma',
    'local_fisico',
    'data',
    'horario',
    'horario_fim',
    'prioridade',
]

const statusPermitidos = new Set(['pendente', 'aprovada', 'rejeitada'])
const MAX_LIMIT = 100

function temCampoObrigatorioVazio(dados) {
    return camposObrigatorios.some((campo) => !dados[campo] || !String(dados[campo]).trim())
}

function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return fallback
    return parsed
}

async function listarSolicitacoes(request, response) {
    // Listar solicitacoes e uma acao administrativa, por isso exige login.
    if (requireAdmin(request, response)) return
    await ensureSolicitacaoSchema()

    const status = String(request.query?.status || '').trim().toLowerCase()
    const shouldPaginate =
        request.query?.limit !== undefined ||
        request.query?.offset !== undefined
    const limit = Math.min(parsePositiveInteger(request.query?.limit, 20), MAX_LIMIT)
    const offset = parsePositiveInteger(request.query?.offset, 0)

    if (status && !statusPermitidos.has(status)) {
        return response.status(400).json({
            error: 'Status invalido para filtro de solicitacoes.',
        })
    }

    if (shouldPaginate) {
        const [{ total }] = status
            ? await sql`
                SELECT COUNT(*)::int AS total
                FROM solicitacoes
                WHERE status = ${status}
            `
            : await sql`
                SELECT COUNT(*)::int AS total
                FROM solicitacoes
            `

        const solicitacoes = status
            ? await sql`
                SELECT *
                FROM solicitacoes
                WHERE status = ${status}
                ORDER BY criado_em DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `
            : await sql`
                SELECT *
                FROM solicitacoes
                ORDER BY criado_em DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `

        return response.status(200).json({
            data: solicitacoes,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + solicitacoes.length < total,
            },
        })
    }

    const solicitacoes = status
        ? await sql`
            SELECT *
            FROM solicitacoes
            WHERE status = ${status}
            ORDER BY criado_em DESC
        `
        : await sql`
            SELECT *
            FROM solicitacoes
            ORDER BY criado_em DESC
        `

    return response.status(200).json({
        data: solicitacoes,
    })
}

async function criarSolicitacao(request, response) {
    const body = readJsonBody(request)

    if (temCampoObrigatorioVazio(body)) {
        return response.status(400).json({
            error: 'Preencha todos os campos obrigatórios.',
        })
    }

    const {
        nome,
        nip,
        contato,
        email_responsavel,
        nome_videoconferencia,
        local_plataforma,
        local_fisico,
        data,
        horario,
        horario_fim,
        prioridade,
        link,
        solicitar_link,
        observacoes,
    } = body

    const setor = normalizeSector(body.setor)

    if (!isValidNip(nip)) {
        return response.status(400).json({
            error: 'Informe o identificador funcional no formato 00.0000.00.',
        })
    }

    if (!isValidContact(contato)) {
        return response.status(400).json({
            error: 'Informe o contato com DDD.',
        })
    }

    if (isPastDate(data)) {
        return response.status(400).json({
            error: 'A data não pode ser anterior à data atual.',
        })
    }

    if (!isValidTimeRange(horario, horario_fim)) {
        return response.status(400).json({
            error: 'O horario final deve ser posterior ao horario inicial.',
        })
    }

    if (!isValidUrlOrEmpty(link?.trim())) {
        return response.status(400).json({
            error: 'Informe uma URL válida começando com http:// ou https://.',
        })
    }

    await Promise.all([ensureSolicitacaoSchema(), ensureVideoconferenciaSchema()])

    const [conflitoDeHorario] = await sql`
        SELECT horario, horario_fim
        FROM videoconferencias
        WHERE concluida = false
          AND data <= ${data.trim()}::date
          AND COALESCE(data_fim, data) >= ${data.trim()}::date
          AND UPPER(TRIM(local_fisico)) = UPPER(TRIM(${local_fisico.trim()}))
          AND horario < ${horario_fim.trim()}::time
          AND COALESCE(horario_fim, horario) > ${horario.trim()}::time
        LIMIT 1
    `

    if (conflitoDeHorario) {
        return response.status(409).json({
            error: `Este local ja esta reservado das ${String(conflitoDeHorario.horario).slice(0, 5)} as ${String(conflitoDeHorario.horario_fim).slice(0, 5)}. Escolha outro periodo.`,
        })
    }

    // Evita envio duplo da mesma solicitação pendente.
    const [solicitacaoDuplicada] = await sql`
        SELECT id
        FROM solicitacoes
        WHERE status = 'pendente'
          AND nip = ${nip.trim()}
          AND nome_videoconferencia = ${nome_videoconferencia.trim()}
          AND data = ${data.trim()}
          AND horario = ${horario.trim()}
        LIMIT 1
    `

    if (solicitacaoDuplicada) {
        return response.status(409).json({
            error: 'Já existe uma solicitação pendente igual a esta.',
        })
    }

    const [novaSolicitacao] = await sql`
        INSERT INTO solicitacoes (
            nome,
            nip,
            setor,
            contato,
            email_responsavel,
            nome_videoconferencia,
            local_plataforma,
            local_fisico,
            data,
            horario,
            horario_fim,
            prioridade,
            link,
            solicitar_link,
            observacoes
        ) VALUES (
            ${nome.trim()},
            ${nip.trim()},
            ${setor},
            ${contato.trim()},
            ${email_responsavel?.trim() || null},
            ${nome_videoconferencia.trim()},
            ${local_plataforma.trim()},
            ${local_fisico?.trim() || null},
            ${data.trim()},
            ${horario.trim()},
            ${horario_fim.trim()},
            ${prioridade.trim()},
            ${link?.trim() || null},
            ${Boolean(solicitar_link) && !link?.trim()},
            ${observacoes?.trim() || null}
        )
        RETURNING *
    `

    return response.status(201).json({
        data: novaSolicitacao,
        message: 'Solicitação criada com sucesso.',
    })
}

export default async function handler(request, response) {
    try {
        if (request.method === 'GET') return listarSolicitacoes(request, response)
        if (request.method === 'POST') return criarSolicitacao(request, response)

        return response.status(405).json({
            error: 'Método não permitido.',
        })
    } catch (error) {
        if (error instanceof SyntaxError) return sendJsonParseError(response)

        return response.status(500).json({
            error: error.message,
        })
    }
}
