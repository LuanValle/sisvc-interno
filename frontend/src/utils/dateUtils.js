/**
 * Utilitarios de data da agenda.
 *
 * O sistema guarda datas no formato do input HTML: YYYY-MM-DD.
 * Sempre que uma data precisa virar objeto Date, adicionamos horario fixo
 * para evitar diferencas de fuso horario no navegador.
 */

export const combineDateAndTime = (date, time) => {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00`)
}

const startOfDay = (date) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

export const calculateDaysRemaining = (date) => {
  const today = startOfDay(new Date())
  const target = startOfDay(new Date(`${date}T00:00:00`))
  const diff = target.getTime() - today.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

const endOfDay = (date) => {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

export const isToday = (date, endDate = '') => {
  const today = startOfDay(new Date())
  const start = startOfDay(new Date(`${date}T00:00:00`))
  const end = endOfDay(new Date(`${endDate || date}T00:00:00`))
  return today >= start && today <= end
}

export const isExpired = (conference) => {
  if (conference.completed) return false

  if (conference.endDate && conference.endDate !== conference.date) {
    const periodEnd = endOfDay(new Date(`${conference.endDate}T00:00:00`))
    return periodEnd.getTime() < new Date().getTime()
  }

  const schedule = combineDateAndTime(conference.date, conference.time)
  return schedule ? schedule.getTime() < new Date().getTime() : false
}

const rangesOverlap = (startA, endA, startB, endB) => startA <= endB && endA >= startB

export const isWithinCurrentWeek = (date, endDate = '') => {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = startOfDay(now)
  monday.setDate(now.getDate() + mondayOffset)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const start = startOfDay(new Date(`${date}T00:00:00`))
  const end = endOfDay(new Date(`${endDate || date}T00:00:00`))
  return rangesOverlap(start, end, monday, sunday)
}

export const isWithinCurrentMonth = (date, endDate = '') => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const start = startOfDay(new Date(`${date}T00:00:00`))
  const end = endOfDay(new Date(`${endDate || date}T00:00:00`))
  return rangesOverlap(start, end, monthStart, monthEnd)
}

export const isWithinNext30Days = (date, endDate = '') => {
  const today = startOfDay(new Date())
  const limit = endOfDay(new Date())
  limit.setDate(limit.getDate() + 30)
  const start = startOfDay(new Date(`${date}T00:00:00`))
  const end = endOfDay(new Date(`${endDate || date}T00:00:00`))
  return rangesOverlap(start, end, today, limit)
}

export const formatDatePtBr = (date) => {
  if (!date) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

export const formatDateRangePtBr = (date, endDate = '') => {
  if (!endDate || endDate === date) return formatDatePtBr(date)
  return `${formatDatePtBr(date)} a ${formatDatePtBr(endDate)}`
}

// Texto curto mostrado no card da videoconferencia.
export const getDateStatusText = (conference) => {
  if (conference.completed) return 'Concluída'
  if (isExpired(conference)) return 'Vencida'
  if (isToday(conference.date, conference.endDate)) return 'É hoje'

  const days = calculateDaysRemaining(conference.date)
  if (days === 1) return 'Falta 1 dia'
  if (days > 1) return `Faltam ${days} dias`
  return 'Vencida'
}

// Classe CSS usada para colorir cards conforme proximidade e situacao.
export const getVisualClassByProximity = (conference) => {
  if (conference.completed) return 'status-completed'
  if (isExpired(conference)) return 'status-expired'

  const days = calculateDaysRemaining(conference.date)
  if (isToday(conference.date, conference.endDate)) return 'status-today'
  if (days >= 1 && days <= 3) return 'status-urgent'
  if (days >= 4 && days <= 7) return 'status-warning'
  return 'status-neutral'
}

export const getSituation = (conference) => {
  if (conference.completed) return 'concluida'
  if (isExpired(conference)) return 'vencida'
  return 'pendente'
}

// Mantem pendentes primeiro, ordenadas por data/hora, e concluidas no final.
export const sortByDateAndTime = (conferences) =>
  [...conferences].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    const aDate = combineDateAndTime(a.date, a.time)?.getTime() ?? 0
    const bDate = combineDateAndTime(b.date, b.time)?.getTime() ?? 0
    return aDate - bDate
  })
