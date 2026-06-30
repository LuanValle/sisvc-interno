export function getMonthRange(value) {
    const month = String(value || '').trim()
    const match = /^(\d{4})-(\d{2})$/.exec(month)

    if (!match) return null

    const year = Number(match[1])
    const monthNumber = Number(match[2])
    if (year < 2000 || year > 2100 || monthNumber < 1 || monthNumber > 12) return null

    const lastDay = new Date(year, monthNumber, 0).getDate()
    return {
        month,
        start: `${month}-01`,
        end: `${month}-${String(lastDay).padStart(2, '0')}`,
    }
}
