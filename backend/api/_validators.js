export function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '')
}

export function isValidNip(value) {
    // Aceita identificador funcional com 8 digitos: 00.0000.00.
    return onlyDigits(value).length === 8
}

export function normalizeSector(value) {
    return String(value || '').trim().toUpperCase()
}

export function isValidContact(value) {
    // Aceita telefone com codigo de area: 10 ou 11 digitos numericos.
    const digits = onlyDigits(value)
    return digits.length === 10 || digits.length === 11
}

export function isValidUrlOrEmpty(value) {
    if (!value) return true

    try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol)
    } catch {
        return false
    }
}

export function isPastDate(value) {
    if (!value) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) || date < today
}
