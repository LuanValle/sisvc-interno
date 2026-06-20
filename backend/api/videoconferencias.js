import { randomUUID } from 'node:crypto'
import { safeLogAuditAction } from './_audit.js'
import { requireAdmin } from './_auth.js'
import { sql } from './_db.js'
import { readJsonBody, sendJsonParseError } from './_request.js'
import { ensureVideoconferenciaSchema } from './_schema.js'
import { isPastDate, isValidUrlOrEmpty, normalizeSector } from './_validators.js'

const camposObrigatorios = ['nome', 'plataforma', 'data', 'horario', 'prioridade']
const recurrenceTypes = new Set(['none', 'weekly', 'biweekly', 'monthly'])
const MAX_OCCURRENCES = 52

function temCampoObrigatorioVazio(dados) {
    return camposObrigatorios.some((campo) => !dados[campo] || !String(dados[campo]).trim())
}

function parseDate(value) {
    if (!value) return null
    const date = new Date(`${value}T12:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(date) {
    return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

function addMonths(date, months) {
    const next = new Date(date)
    next.setMonth(next.getMonth() + months)
    return next
}

function buildOccurrences({ data, data_fim, recurrence_type, repeat_until }) {
    const recurrenceType = recurrence_type || 'none'
    const startDate = parseDate(data)
    const endDate = parseDate(data_fim) || startDate
    const repeatUntil = parseDate(repeat_until)

    if (!startDate || !endDate) {
        return { error: 'Informe datas validas para a videoconferencia.' }
    }

    if (endDate < startDate) {
        return { error: 'A data final nao pode ser anterior a data inicial.' }
    }

    if (!recurrenceTypes.has(recurrenceType)) {
        return { error: 'Tipo de recorrencia invalido.' }
    }

    if (recurrenceType === 'none') {
        return {
            recurrenceType,
            occurrences: [{
                data: formatDate(startDate),
                data_fim: data_fim ? formatDate(endDate) : null,
            }],
        }
    }

    if (!repeatUntil) {
        return { error: 'Informe ate quando a recorrencia deve ser criada.' }
    }

    if (repeatUntil < startDate) {
        return { error: 'A data limite da recorrencia nao pode ser anterior a data inicial.' }
    }

    const periodDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
    const occurrences = []
    let currentStart = startDate

    while (currentStart <= repeatUntil) {
        if (occurrences.length >= MAX_OCCURRENCES) {
            return { error: `A recorrencia pode criar no maximo ${MAX_OCCURRENCES} ocorrencias.` }
        }

        const currentEnd = addDays(currentStart, periodDays)
        occurrences.push({
            data: formatDate(currentStart),
            data_fim: data_fim ? formatDate(currentEnd) : null,
        })

        if (recurrenceType === 'weekly') currentStart = addDays(currentStart, 7)
        if (recurrenceType === 'biweekly') currentStart = addDays(currentStart, 14)
        if (recurrenceType === 'monthly') currentStart = addMonths(currentStart, 1)
    }

    return { recurrenceType, occurrences }
}

async function listarVideoconferencias(request, response) {
    // A agenda é administrativa, então a listagem também exige login.
    if (requireAdmin(request, response)) return

    await ensureVideoconferenciaSchema()

    const videoconferencias = await sql`
        SELECT *
        FROM videoconferencias
        ORDER BY concluida ASC, data ASC, horario ASC
    `

    return response.status(200).json({
        data: videoconferencias,
    })
}

async function criarVideoconferencia(request, response) {
    if (requireAdmin(request, response)) return

    const body = readJsonBody(request)

    if (temCampoObrigatorioVazio(body)) {
        return response.status(400).json({
            error: 'Preencha todos os campos obrigatórios.',
        })
    }

    const {
        nome,
        plataforma,
        local_fisico,
        data,
        data_fim,
        horario,
        prioridade,
        responsavel,
        link,
        observacoes,
        recurrence_type,
        repeat_until,
    } = body

    const setor = normalizeSector(body.setor)
    const recurrence = buildOccurrences({ data, data_fim, recurrence_type, repeat_until })

    if (recurrence.error) {
        return response.status(400).json({
            error: recurrence.error,
        })
    }

    if (isPastDate(data)) {
        return response.status(400).json({
            error: 'A data não pode ser anterior à data atual.',
        })
    }

    if (!isValidUrlOrEmpty(link?.trim())) {
        return response.status(400).json({
            error: 'Informe uma URL válida começando com http:// ou https://.',
        })
    }

    await ensureVideoconferenciaSchema()

    for (const occurrence of recurrence.occurrences) {
        const occurrenceEnd = occurrence.data_fim || occurrence.data

        // Impede cadastro duplicado da mesma reunião no mesmo dia e horário.
        const [duplicada] = await sql`
            SELECT id
            FROM videoconferencias
            WHERE nome = ${nome.trim()}
              AND plataforma = ${plataforma.trim()}
              AND horario = ${horario.trim()}
              AND data <= ${occurrenceEnd}::date
              AND COALESCE(data_fim, data) >= ${occurrence.data}::date
            LIMIT 1
        `

        if (duplicada) {
            return response.status(409).json({
                error: `Ja existe uma videoconferencia igual em ${occurrence.data} neste horario.`,
            })
        }
    }

    const recurrenceGroupId = recurrence.occurrences.length > 1 ? randomUUID() : null
    const videoconferencias = []

    for (const occurrence of recurrence.occurrences) {
        const [videoconferencia] = await sql`
            INSERT INTO videoconferencias (
            nome,
            plataforma,
            local_fisico,
            data,
            data_fim,
            horario,
            prioridade,
            responsavel,
            setor,
            link,
            observacoes,
            recurrence_group_id,
            recurrence_type
        )
        VALUES (
            ${nome.trim()},
            ${plataforma.trim()},
            ${local_fisico?.trim() || null},
            ${occurrence.data},
            ${occurrence.data_fim},
            ${horario.trim()},
            ${prioridade.trim()},
            ${responsavel?.trim() || null},
            ${setor || null},
            ${link?.trim() || null},
            ${observacoes?.trim() || null},
            ${recurrenceGroupId},
            ${recurrence.recurrenceType}
        )
        RETURNING *
        `

        videoconferencias.push(videoconferencia)
    }

    await safeLogAuditAction({
        acao: 'criar_videoconferencia',
        entidade: 'videoconferencia',
        entidadeId: recurrenceGroupId || videoconferencias[0]?.id,
        detalhes: {
            origem: 'cadastro_manual',
            quantidade: videoconferencias.length,
            ids: videoconferencias.map((item) => item.id),
            nome: nome.trim(),
            plataforma: plataforma.trim(),
            local_fisico: local_fisico?.trim() || null,
            data,
            data_fim: data_fim || null,
            horario: horario.trim(),
            prioridade: prioridade.trim(),
            setor: setor || null,
            recurrence_type: recurrence.recurrenceType,
        },
    })

    return response.status(201).json({
        message: videoconferencias.length > 1
            ? `${videoconferencias.length} videoconferencias criadas com sucesso.`
            : 'Videoconferencia criada com sucesso.',
        data: videoconferencias.length > 1 ? videoconferencias : videoconferencias[0],
    })
}

export default async function handler(request, response) {
    try {
        if (request.method === 'GET') return listarVideoconferencias(request, response)
        if (request.method === 'POST') return criarVideoconferencia(request, response)

        return response.status(405).json({
            error: 'Método não permitido. Use GET ou POST.',
        })
    } catch (error) {
        if (error instanceof SyntaxError) return sendJsonParseError(response)

        return response.status(500).json({
            error: 'Ocorreu um erro ao processar a solicitação.',
            details: error.message,
        })
    }
}
