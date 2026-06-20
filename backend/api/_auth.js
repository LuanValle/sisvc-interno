import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'admin_session'
const SESSION_DURATION_SECONDS = 8 * 60 * 60

function getSessionSecret() {
    return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
}

function parseCookies(request) {
    const header = request.headers.cookie || ''

    return Object.fromEntries(
        header
            .split(';')
            .map((cookie) => cookie.trim().split('='))
            .filter(([key, value]) => key && value)
    )
}

export function isAdminAuthenticated(request) {
    const sessionSecret = getSessionSecret()
    if (!sessionSecret) return false

    const cookies = parseCookies(request)
    const token = decodeURIComponent(cookies[COOKIE_NAME] || '')
    const [payload, signature] = token.split('.')

    if (!payload || !signature) return false

    const expectedSignature = createHmac('sha256', sessionSecret)
        .update(payload)
        .digest('base64url')
    const received = Buffer.from(signature)
    const expected = Buffer.from(expectedSignature)

    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false

    try {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
        return Number(session.expiresAt) > Date.now()
    } catch {
        return false
    }
}

export function requireAdmin(request, response) {
    if (isAdminAuthenticated(request)) return false

    response.status(401).json({
        error: 'Acesso administrativo nao autorizado.',
    })
    return true
}

export function setAdminCookie(response) {
    const secureFlag = String(process.env.APP_SECURE_COOKIE || '').toLowerCase() === 'true'
        ? '; Secure'
        : ''
    const sessionSecret = getSessionSecret()

    if (!sessionSecret) {
        throw new Error('ADMIN_SESSION_SECRET ou ADMIN_PASSWORD precisa estar configurada.')
    }

    const payload = Buffer.from(JSON.stringify({
        expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    })).toString('base64url')
    const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url')
    const token = `${payload}.${signature}`

    // O segredo nunca e enviado ao navegador; o cookie contem apenas um token assinado.
    response.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}`
    )
}

export function clearAdminCookie(response) {
    const secureFlag = String(process.env.APP_SECURE_COOKIE || '').toLowerCase() === 'true'
        ? '; Secure'
        : ''

    response.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`
    )
}
