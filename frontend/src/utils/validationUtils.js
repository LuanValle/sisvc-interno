const requiredFields = [
  ['name', 'Nome da videoconferência é obrigatório.'],
  ['platform', 'Plataforma e obrigatoria.'],
  ['date', 'Data é obrigatória.'],
  ['time', 'Horário é obrigatório.'],
  ['priority', 'Prioridade é obrigatória.'],
]

const validPriorities = ['Baixa', 'Média', 'Alta', 'Crítica']
const validPlatforms = ['Google Meet', 'Microsoft Teams', 'Zoom', 'Webex', 'UNA', 'Presencial', 'Outro']
const validRecurrenceTypes = ['none', 'weekly', 'biweekly', 'monthly']

const isPastDate = (value) => {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) || date < today
}

export const isValidUrl = (value) => {
  if (!value) return true

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

// Valida o formulário de cadastro/edição de videoconferências da agenda.
export const validateConference = (conference) => {
  const errors = {}

  requiredFields.forEach(([field, message]) => {
    if (!conference[field]?.trim()) errors[field] = message
  })

  if (conference.date && isPastDate(conference.date)) {
    errors.date = 'A data não pode ser anterior à data atual.'
  }

  if (conference.endDate && conference.date && conference.endDate < conference.date) {
    errors.endDate = 'A data final não pode ser anterior à data inicial.'
  }

  if (conference.recurrenceType && !validRecurrenceTypes.includes(conference.recurrenceType)) {
    errors.recurrenceType = 'Tipo de recorrência inválido.'
  }

  if (conference.recurrenceType && conference.recurrenceType !== 'none') {
    if (!conference.repeatUntil?.trim()) {
      errors.repeatUntil = 'Informe até quando a recorrência deve ser criada.'
    } else if (conference.date && conference.repeatUntil < conference.date) {
      errors.repeatUntil = 'A data limite da recorrência não pode ser anterior à data inicial.'
    }
  }

  if (conference.link?.trim() && !isValidUrl(conference.link.trim())) {
    errors.link = 'Informe uma URL válida começando com http:// ou https://.'
  }

  return errors
}

const isStringOrMissing = (value) => value === undefined || typeof value === 'string'
const isBooleanOrMissing = (value) => value === undefined || typeof value === 'boolean'

const isValidConferenceShape = (item) => {
  if (!item || typeof item !== 'object') return false

  const hasRequiredStrings =
    typeof item.name === 'string' &&
    typeof item.platform === 'string' &&
    typeof item.date === 'string' &&
    typeof item.time === 'string' &&
    typeof item.priority === 'string'

  if (!hasRequiredStrings) return false
  if (!item.name.trim() || !item.platform.trim() || !item.date.trim() || !item.time.trim()) return false
  if (!validPlatforms.includes(item.platform)) return false
  if (!validPriorities.includes(item.priority)) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false
  if (item.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(item.endDate)) return false
  if (!/^\d{2}:\d{2}$/.test(item.time)) return false
  if (item.link && !isValidUrl(item.link)) return false

  return (
    isStringOrMissing(item.id) &&
    isStringOrMissing(item.endDate) &&
    isStringOrMissing(item.physicalLocation) &&
    isStringOrMissing(item.responsible) &&
    isStringOrMissing(item.department) &&
    isStringOrMissing(item.link) &&
    isStringOrMissing(item.notes) &&
    isStringOrMissing(item.createdAt) &&
    isBooleanOrMissing(item.completed)
  )
}

// Garante que um backup importado tem a estrutura esperada antes de usar seus dados.
export const validateBackupStructure = (data) =>
  Array.isArray(data) && data.every(isValidConferenceShape)
