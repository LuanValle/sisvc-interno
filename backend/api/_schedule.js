const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidTimeRange(startTime, endTime) {
    const start = String(startTime || '').trim()
    const end = String(endTime || '').trim()
    return TIME_PATTERN.test(start) && TIME_PATTERN.test(end) && end > start
}

export function timeRangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
    if (!isValidTimeRange(firstStart, firstEnd) || !isValidTimeRange(secondStart, secondEnd)) {
        return false
    }

    return firstStart < secondEnd && firstEnd > secondStart
}
