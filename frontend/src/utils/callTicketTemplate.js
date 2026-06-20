const SYSTEM_EMAIL = 'video-support@example.com'

const monthCodes = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
]

const formatMilitaryDate = (date) => {
  if (!date) return 'DATA NAO INFORMADA'

  const [year, month, day] = date.split('-')
  const monthIndex = Number(month) - 1
  const monthCode = monthCodes[monthIndex] || month

  return `${day}${monthCode}${year}`
}

const formatTimeZoneQ = (time) => {
  if (!time) return ''
  return `${time.replace(':', '')}Q`
}

const normalizeText = (text = '') =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const findResponsibleEmail = (conference) => {
  const text = conference.notes || ''
  const explicitEmail = normalizeText(text).match(/email do responsavel:\s*([^\s,;]+)/i)?.[1]
  const anyEmail = text.match(/[^\s,;]+@[^\s,;]+\.[^\s,;]+/)?.[0]

  return explicitEmail || anyEmail || 'EMAIL DO SOLICITANTE'
}

const findEndTime = (notes = '') => {
  const normalizedNotes = normalizeText(notes)
  const patterns = [
    /(?:termino|termina|ate|fim)\D{0,20}(\d{1,2})[:h](\d{2})/i,
    /(\d{1,2})[:h](\d{2})\s*(?:como|de)?\s*(?:termino|fim)/i,
  ]

  for (const pattern of patterns) {
    const match = normalizedNotes.match(pattern)
    if (match) return `${match[1].padStart(2, '0')}${match[2]}Q`
  }

  return ''
}

const findDuration = (notes = '') => {
  const explicitDuration = normalizeText(notes).match(/duracao\D{0,20}(\d{1,2})(?:[:h](\d{2}))?/i)
  if (!explicitDuration) return ''

  const hours = Number(explicitDuration[1])
  const minutes = explicitDuration[2] ? Number(explicitDuration[2]) : 0
  const parts = []

  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}min`)

  return parts.join(' ')
}

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return ''

  const startHours = Number(startTime.slice(0, 2))
  const startMinutes = Number(startTime.slice(3, 5))
  const endHours = Number(endTime.slice(0, 2))
  const endMinutes = Number(endTime.slice(2, 4))

  const startTotal = startHours * 60 + startMinutes
  const endTotal = endHours * 60 + endMinutes
  const total = endTotal - startTotal

  if (total <= 0) return ''

  const hours = Math.floor(total / 60)
  const minutes = total % 60
  const parts = []

  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}min`)

  return parts.join(' ')
}

const buildDateLine = (conference, endTime) => {
  const startDate = formatMilitaryDate(conference.date)
  const endDate = conference.endDate && conference.endDate !== conference.date
    ? formatMilitaryDate(conference.endDate)
    : ''
  const dateText = endDate ? `${startDate} a ${endDate}` : startDate
  const startTime = formatTimeZoneQ(conference.time)
  const timeText = endTime
    ? `${startTime || 'INICIO NAO INFORMADO'} - ${endTime}`
    : startTime || 'INICIO NAO INFORMADO'

  return `${dateText} - ${timeText}`
}

export const buildCallTicketText = (conference) => {
  const endTime = findEndTime(conference.notes)
  const duration = findDuration(conference.notes) || calculateDuration(conference.time, endTime) || 'Dia todo'
  const responsibleEmail = findResponsibleEmail(conference)

  return [
    'Solicitacao de criacao de reuniao virtual:',
    `Solicitante - ${conference.responsible || 'NOME DO SOLICITANTE'}`,
    `Contatos - ${responsibleEmail}, ${SYSTEM_EMAIL}`,
    `Data e horario - ${buildDateLine(conference, endTime)}`,
    `Duracao - ${duration}`,
    `Titulo - ${conference.name || 'TITULO DA REUNIAO'}`,
  ].join('\n')
}
