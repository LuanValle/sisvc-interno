import { sql } from './_db.js'
import { ensureVideoconferenciaSchema } from './_schema.js'
import { getMonthRange } from './_availability.js'

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({
            error: 'Metodo nao permitido. Use GET.',
        })
    }

    response.setHeader('Cache-Control', 'no-store, max-age=0')

    const range = getMonthRange(request.query?.mes)
    if (!range) {
        return response.status(400).json({
            error: 'Informe o mes no formato AAAA-MM.',
        })
    }

    try {
        await ensureVideoconferenciaSchema()

        const rows = await sql`
            SELECT
                data,
                COALESCE(data_fim, data) AS data_fim,
                horario,
                horario_fim,
                TRIM(local_fisico) AS local
            FROM videoconferencias
            WHERE concluida = false
              AND NULLIF(TRIM(local_fisico), '') IS NOT NULL
              AND data <= ${range.end}::date
              AND COALESCE(data_fim, data) >= ${range.start}::date
            ORDER BY data ASC, horario ASC, local_fisico ASC
        `

        return response.status(200).json({
            data: rows,
            meta: {
                month: range.month,
            },
        })
    } catch (error) {
        console.error('Erro na consulta publica de disponibilidade:', error)
        return response.status(500).json({
            error: 'Nao foi possivel consultar os espacos reservados.',
        })
    }
}
