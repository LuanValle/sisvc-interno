import { clearAdminCookie } from './_auth.js'

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Metodo nao permitido.',
        })
    }

    // Remove o cookie de sessao usado pelas APIs administrativas.
    clearAdminCookie(response)

    return response.status(200).json({
        message: 'Logout realizado com sucesso.',
    })
}
