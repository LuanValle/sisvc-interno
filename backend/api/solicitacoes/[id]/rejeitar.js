import { requireAdmin } from '../../_auth.js'
import { safeLogAuditAction } from '../../_audit.js'
import { sql } from '../../_db.js'
import { readJsonBody, sendJsonParseError } from '../../_request.js'

export default async function handler(request, response) {
    if (request.method !== 'PATCH') {
        return response.status(405).json({
            error: 'Método não permitido.',
        })
    }

    if (requireAdmin(request, response)) return

    let body

    try {
        body = readJsonBody(request)
    } catch (error) {
        if (error instanceof SyntaxError) return sendJsonParseError(response)
        throw error
    }

    const { id } = request.query
    const motivo = body.motivo_rejeicao?.trim() || ''

    if (!motivo) {
        return response.status(400).json({
            error: 'Informe o motivo da rejeição.',
        })
    }

    try {
        const [solicitacao] = await sql`
            SELECT *
            FROM solicitacoes
            WHERE id = ${id}
        `

        if (!solicitacao) {
            return response.status(404).json({
                error: 'Solicitação não encontrada.',
            })
        }

        if (solicitacao.status !== 'pendente') {
            return response.status(400).json({
                error: 'Apenas solicitações pendentes podem ser rejeitadas.',
            })
        }

        const [solicitacaoAtualizada] = await sql`
            UPDATE solicitacoes
            SET status = 'rejeitada',
                motivo_rejeicao = ${motivo},
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `

        await safeLogAuditAction({
            acao: 'rejeitar_solicitacao',
            entidade: 'solicitacao',
            entidadeId: solicitacao.id,
            detalhes: {
                solicitacao_id: solicitacao.id,
                nome_videoconferencia: solicitacao.nome_videoconferencia,
                solicitante: solicitacao.nome,
                setor: solicitacao.setor,
                motivo_rejeicao: motivo,
            },
        })

        return response.status(200).json({
            message: 'Solicitação rejeitada com sucesso.',
            data: solicitacaoAtualizada,
        })
    } catch (error) {
        return response.status(500).json({
            error: 'Erro ao rejeitar solicitação.',
            details: error.message,
        })
    }
}
