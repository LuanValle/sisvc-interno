const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const escapeCsv = (value) => {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

const toCsv = (headers, rows) =>
  `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n')}`

const formatDateOnly = (value) => String(value || '').slice(0, 10)
const formatTimeOnly = (value) => String(value || '').slice(0, 5)

export const exportAuditAgendaCsv = (agenda, { inicio, fim }) => {
  const headers = [
    'ID',
    'Nome',
    'Plataforma',
    'Local',
    'Data inicial',
    'Data final',
    'Horario',
    'Prioridade',
    'Responsavel',
    'Setor',
    'Link informado',
    'Concluida',
    'Solicitacao ID',
    'Criado em',
    'Atualizado em',
    'Observacoes',
  ]

  const rows = agenda.map((item) => [
    item.id,
    item.nome,
    item.plataforma,
    item.local_fisico,
    formatDateOnly(item.data),
    formatDateOnly(item.data_fim),
    formatTimeOnly(item.horario),
    item.prioridade,
    item.responsavel,
    item.setor,
    item.link ? 'Sim' : 'Nao',
    item.concluida ? 'Sim' : 'Nao',
    item.solicitacao_id,
    item.criado_em,
    item.atualizado_em,
    item.observacoes,
  ])

  downloadFile(
    toCsv(headers, rows),
    `auditoria-agenda-${inicio || 'inicio'}-${fim || 'fim'}.csv`,
    'text/csv;charset=utf-8',
  )
}

export const exportAuditLogsCsv = (logs, { inicio, fim }) => {
  const headers = [
    'ID',
    'Data/Hora',
    'Usuario',
    'Acao',
    'Entidade',
    'Entidade ID',
    'Detalhes',
  ]

  const rows = logs.map((log) => [
    log.id,
    log.criado_em,
    log.usuario,
    log.acao,
    log.entidade,
    log.entidade_id,
    JSON.stringify(log.detalhes || {}),
  ])

  downloadFile(
    toCsv(headers, rows),
    `auditoria-acoes-${inicio || 'inicio'}-${fim || 'fim'}.csv`,
    'text/csv;charset=utf-8',
  )
}
