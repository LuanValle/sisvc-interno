// Converte uma solicitacao recebida da API/banco para o formato usado pelos componentes React.
// O banco usa nomes em portugues; a interface usa nomes mais curtos em ingles.
export const apiToRequest = (item) => ({
  id: item.id,
  name: item.nome,
  nip: item.nip,
  department: item.setor,
  contact: item.contato,
  responsibleEmail: item.email_responsavel || '',
  conferenceName: item.nome_videoconferencia,
  platform: item.local_plataforma,
  physicalLocation: item.local_fisico || '',
  date: item.data?.slice(0, 10) || '',
  time: item.horario?.slice(0, 5) || '',
  priority: item.prioridade,
  link: item.link || '',
  requestLink: Boolean(item.solicitar_link),
  notes: item.observacoes || '',
  status: item.status,
  rejectionReason: item.motivo_rejeicao || '',
  createdAt: item.criado_em,
  updatedAt: item.atualizado_em,
})

// Converte uma videoconferencia recebida da API/banco para o formato usado na agenda.
export const apiToConference = (item) => ({
  id: item.id,
  name: item.nome,
  platform: item.plataforma,
  physicalLocation: item.local_fisico || '',
  date: item.data?.slice(0, 10) || '',
  endDate: item.data_fim?.slice(0, 10) || '',
  time: item.horario?.slice(0, 5) || '',
  endTime: item.horario_fim?.slice(0, 5) || '',
  priority: item.prioridade,
  responsible: item.responsavel || '',
  department: item.setor || '',
  link: item.link || '',
  notes: item.observacoes || '',
  completed: Boolean(item.concluida),
  recurrenceGroupId: item.recurrence_group_id || '',
  recurrenceType: item.recurrence_type || 'none',
  createdAt: item.criado_em,
  updatedAt: item.atualizado_em,
})

// Converte os dados do formulario da agenda para os nomes esperados pela API/banco.
export const conferenceToApi = (conference) => ({
  nome: conference.name,
  plataforma: conference.platform,
  local_fisico: conference.physicalLocation,
  data: conference.date,
  data_fim: conference.endDate || null,
  horario: conference.time,
  prioridade: conference.priority,
  responsavel: conference.responsible,
  setor: conference.department,
  link: conference.link,
  observacoes: conference.notes,
  concluida: Boolean(conference.completed),
  recurrence_type: conference.recurrenceType || 'none',
  repeat_until: conference.repeatUntil || null,
})
