const isHighPriority = (priority) => {
  // Remove acentos para contar prioridades criticas mesmo quando vierem com grafias diferentes.
  const normalized = String(priority || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return ['Alta', 'Critica'].includes(normalized)
}

const isCreatedToday = (createdAt) => {
  if (!createdAt) return false

  const createdDate = new Date(createdAt)
  if (Number.isNaN(createdDate.getTime())) return false

  const today = new Date()
  return (
    createdDate.getFullYear() === today.getFullYear() &&
    createdDate.getMonth() === today.getMonth() &&
    createdDate.getDate() === today.getDate()
  )
}

// Monta os numeros exibidos no dashboard administrativo usando dados vindos do banco.
export const getRequestSummary = (requests) => ({
  total: requests.length,
  pending: requests.filter((request) => request.status === 'pendente').length,
  completed: requests.filter((request) => request.status === 'aprovada').length,
  expired: requests.filter((request) => request.status === 'rejeitada').length,
  today: requests.filter((request) => isCreatedToday(request.createdAt)).length,
  highPriority: requests.filter((request) => isHighPriority(request.priority)).length,
})

// Converte uma solicitacao publica aprovada em uma videoconferencia da agenda.
export const requestToConference = (request) => ({
  name: request.conferenceName,
  platform: request.platform,
  date: request.date,
  time: request.time,
  priority: request.priority,
  responsible: request.name,
  department: request.department,
  link: request.link || '',
  notes: request.notes || `Solicitado por ${request.name} - contato: ${request.contact}`,
})
