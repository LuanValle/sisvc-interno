import { setAdminCookie } from './_auth.js'

const DEFAULT_ADMIN_USER = 'admin'

function readLoginBody(request) {
    // Mantem compatibilidade com corpo recebido como objeto, texto ou Buffer.
    if (!request.body) return {}
    if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString('utf8'))
    if (typeof request.body === 'string') return JSON.parse(request.body)
    return request.body
}

export default async function handler(request, response) {
    try {
        if (request.method !== 'POST') {
            return response.status(405).json({
                error: 'Metodo nao permitido.',
            })
        }

        const body = readLoginBody(request)
        const adminUser = process.env.ADMIN_USER || DEFAULT_ADMIN_USER
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminPassword) {
            return response.status(500).json({
                error: 'ADMIN_PASSWORD nao esta configurada.',
            })
        }

        // A senha agora e validada no servidor, nao dentro do JavaScript do navegador.
        const isValidLogin =
            body.user === adminUser &&
            body.password === adminPassword

        if (!isValidLogin) {
            return response.status(401).json({
                error: 'Usuario ou senha invalidos.',
            })
        }

        // Ao autenticar, criamos um cookie HttpOnly usado pelas APIs administrativas.
        setAdminCookie(response)

        return response.status(200).json({
            message: 'Login realizado com sucesso.',
        })
    } catch (error) {
        if (error instanceof SyntaxError) {
            return response.status(400).json({
                error: 'JSON invalido.',
            })
        }

        return response.status(500).json({
            error: 'Erro ao processar login.',
        })
    }
}
