import { requireAdmin } from '../_auth.js'
import { safeLogAuditAction } from '../_audit.js'
import { sql } from '../_db.js'
import { readJsonBody, sendJsonParseError } from '../_request.js'
import { ensureVideoconferenciaSchema } from '../_schema.js'
import { isCompletionOnlyPatch, isPastDate, isValidUrlOrEmpty, normalizeSector } from '../_validators.js'

const camposObrigatorios = ['nome', 'plataforma', 'data', 'horario', 'prioridade']

function temCampoObrigatorioVazio(dados) {
    return camposObrigatorios.some((campo) => !dados[campo] || !String(dados[campo]).trim())
}

const pickAuditFields = (videoconferencia) => ({
    nome: videoconferencia.nome,
    plataforma: videoconferencia.plataforma,
    local_fisico: videoconferencia.local_fisico,
    data: videoconferencia.data,
    data_fim: videoconferencia.data_fim,
    horario: videoconferencia.horario,
    prioridade: videoconferencia.prioridade,
    responsavel: videoconferencia.responsavel,
    setor: videoconferencia.setor,
    concluida: videoconferencia.concluida,
})

async function atualizarVideoconferencia(request, response) {
    if (requireAdmin(request, response)) return

    await ensureVideoconferenciaSchema()

    const { id } = request.query
    const body = readJsonBody(request)

    const [videoconferenciaAnterior] = await sql`
        SELECT *
        FROM videoconferencias
        WHERE id = ${id}
        LIMIT 1
    `

    if (!videoconferenciaAnterior) {
        return response.status(404).json({
            error: 'Videoconferencia nao encontrada.',
        })
    }

    // A conclusao/reabertura altera somente o status. Assim, uma VC cuja data
    // ja passou pode ser finalizada sem liberar a edicao dos demais campos.
    if (isCompletionOnlyPatch(body)) {
        const [videoconferencia] = await sql`
            UPDATE videoconferencias
            SET concluida = ${body.concluida},
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `

        const acao = !videoconferenciaAnterior.concluida && body.concluida
            ? 'concluir_videoconferencia'
            : videoconferenciaAnterior.concluida && !body.concluida
                ? 'reabrir_videoconferencia'
                : 'editar_videoconferencia'

        await safeLogAuditAction({
            acao,
            entidade: 'videoconferencia',
            entidadeId: videoconferencia.id,
            detalhes: {
                antes: pickAuditFields(videoconferenciaAnterior),
                depois: pickAuditFields(videoconferencia),
            },
        })

        return response.status(200).json({
            message: 'Videoconferencia atualizada com sucesso.',
            data: videoconferencia,
        })
    }

    if (temCampoObrigatorioVazio(body)) {
        return response.status(400).json({
            error: 'Preencha todos os campos obrigatorios.',
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
        concluida,
    } = body

    const setor = normalizeSector(body.setor)
    const dataFim = data_fim?.trim() || null
    const completedValue = Boolean(concluida)

    if (isPastDate(data)) {
        return response.status(400).json({
            error: 'A data nao pode ser anterior a data atual.',
        })
    }

    if (dataFim && dataFim < data.trim()) {
        return response.status(400).json({
            error: 'A data final nao pode ser anterior a data inicial.',
        })
    }

    if (!isValidUrlOrEmpty(link?.trim())) {
        return response.status(400).json({
            error: 'Informe uma URL valida comecando com http:// ou https://.',
        })
    }

    const dataFimParaConflito = dataFim || data.trim()

    const [duplicada] = await sql`
        SELECT id
        FROM videoconferencias
        WHERE id <> ${id}
          AND nome = ${nome.trim()}
          AND plataforma = ${plataforma.trim()}
          AND horario = ${horario.trim()}
          AND data <= ${dataFimParaConflito}::date
          AND COALESCE(data_fim, data) >= ${data.trim()}::date
        LIMIT 1
    `

    if (duplicada) {
        return response.status(409).json({
            error: 'Ja existe uma videoconferencia igual neste dia e horario.',
        })
    }

    const [videoconferencia] = await sql`
        UPDATE videoconferencias
        SET nome = ${nome.trim()},
            plataforma = ${plataforma.trim()},
            local_fisico = ${local_fisico?.trim() || null},
            data = ${data.trim()},
            data_fim = ${dataFim},
            horario = ${horario.trim()},
            prioridade = ${prioridade.trim()},
            responsavel = ${responsavel?.trim() || null},
            setor = ${setor || null},
            link = ${link?.trim() || null},
            observacoes = ${observacoes?.trim() || null},
            concluida = ${completedValue},
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
    `

    const acao = !videoconferenciaAnterior.concluida && completedValue
        ? 'concluir_videoconferencia'
        : videoconferenciaAnterior.concluida && !completedValue
            ? 'reabrir_videoconferencia'
            : 'editar_videoconferencia'

    await safeLogAuditAction({
        acao,
        entidade: 'videoconferencia',
        entidadeId: videoconferencia.id,
        detalhes: {
            antes: pickAuditFields(videoconferenciaAnterior),
            depois: pickAuditFields(videoconferencia),
        },
    })

    return response.status(200).json({
        message: 'Videoconferencia atualizada com sucesso.',
        data: videoconferencia,
    })
}

async function excluirVideoconferencia(request, response) {
    if (requireAdmin(request, response)) return

    await ensureVideoconferenciaSchema()

    const { id } = request.query

    const [videoconferencia] = await sql`
        DELETE FROM videoconferencias
        WHERE id = ${id}
        RETURNING *
    `

    if (!videoconferencia) {
        return response.status(404).json({
            error: 'Videoconferencia nao encontrada.',
        })
    }

    await safeLogAuditAction({
        acao: 'excluir_videoconferencia',
        entidade: 'videoconferencia',
        entidadeId: videoconferencia.id,
        detalhes: pickAuditFields(videoconferencia),
    })

    return response.status(200).json({
        message: 'Videoconferencia excluida com sucesso.',
        data: videoconferencia,
    })
}

export default async function handler(request, response) {
    try {
        if (request.method === 'PATCH') return atualizarVideoconferencia(request, response)
        if (request.method === 'DELETE') return excluirVideoconferencia(request, response)

        return response.status(405).json({
            error: 'Metodo nao permitido.',
        })
    } catch (error) {
        if (error instanceof SyntaxError) return sendJsonParseError(response)

        return response.status(500).json({
            error: 'Erro interno.',
            details: error.message,
        })
    }
}
