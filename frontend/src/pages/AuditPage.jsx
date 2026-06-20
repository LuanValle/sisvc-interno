import { Download, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { exportAuditAgendaCsv, exportAuditLogsCsv } from '../utils/auditExportUtils'
import { apiFetch } from '../utils/apiClient'

const actionLabels = {
  aprovar_solicitacao: 'Aprovou solicitacao',
  rejeitar_solicitacao: 'Rejeitou solicitacao',
  criar_videoconferencia: 'Criou videoconferencia',
  editar_videoconferencia: 'Editou videoconferencia',
  concluir_videoconferencia: 'Marcou como concluida',
  reabrir_videoconferencia: 'Reabriu videoconferencia',
  excluir_videoconferencia: 'Excluiu videoconferencia',
}

const formatDateTime = (value) => {
  if (!value) return '--'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const formatDate = (value) => {
  if (!value) return '--'

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
    .format(new Date(`${String(value).slice(0, 10)}T12:00:00`))
}

const formatTime = (value) => String(value || '').slice(0, 5) || '--'

const normalizeDetails = (details) => {
  if (!details) return {}
  if (typeof details === 'string') {
    try {
      return JSON.parse(details)
    } catch {
      return {}
    }
  }
  return details
}

const getAgendaDateText = (item) => {
  const start = formatDate(item.data)
  const end = item.data_fim ? formatDate(item.data_fim) : ''
  return end && end !== start ? `${start} a ${end}` : start
}

const getLogTitle = (log) => {
  const details = normalizeDetails(log.detalhes)
  const title = details.nome_videoconferencia || details.nome || details.depois?.nome || details.antes?.nome
  const fallback = log.entidade === 'videoconferencia' ? 'Videoconferencia' : 'Solicitacao'
  return title || `${fallback} ${log.entidade_id || ''}`.trim()
}

const getLogDescription = (log) => {
  const details = normalizeDetails(log.detalhes)
  const parts = [
    log.entidade ? `Entidade: ${log.entidade}` : '',
    log.entidade_id ? `ID: ${log.entidade_id}` : '',
    details.solicitante ? `Solicitante: ${details.solicitante}` : '',
    details.setor ? `Setor: ${details.setor}` : '',
    details.depois?.setor ? `Setor: ${details.depois.setor}` : '',
    details.data ? `Data: ${formatDate(details.data)}` : '',
    details.depois?.data ? `Data: ${formatDate(details.depois.data)}` : '',
    details.horario ? `Horario: ${formatTime(details.horario)}` : '',
    details.depois?.horario ? `Horario: ${formatTime(details.depois.horario)}` : '',
    details.quantidade ? `Quantidade: ${details.quantidade}` : '',
    details.motivo_rejeicao ? `Motivo: ${details.motivo_rejeicao}` : '',
  ].filter(Boolean)

  return parts.join(' - ')
}

const hasValueChanged = (before, after, field) =>
  String(before?.[field] ?? '') !== String(after?.[field] ?? '')

const buildChangeList = (log) => {
  const details = normalizeDetails(log.detalhes)
  const before = details.antes
  const after = details.depois

  if (!before || !after) return []

  const fields = [
    ['nome', 'Nome'],
    ['plataforma', 'Plataforma'],
    ['local_fisico', 'Local'],
    ['data', 'Data'],
    ['data_fim', 'Data final'],
    ['horario', 'Horario'],
    ['prioridade', 'Prioridade'],
    ['responsavel', 'Responsavel'],
    ['setor', 'Setor'],
    ['concluida', 'Concluida'],
  ]

  return fields
    .filter(([field]) => hasValueChanged(before, after, field))
    .map(([field, label]) => {
      const formatValue = field.includes('data')
        ? formatDate
        : field === 'horario'
          ? formatTime
          : (value) => {
              if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
              return value || '--'
            }

      return `${label}: ${formatValue(before[field])} -> ${formatValue(after[field])}`
    })
}

const getLogMetaItems = (log) => {
  const details = normalizeDetails(log.detalhes)
  const before = details.antes || {}
  const after = details.depois || {}
  const data = details.data || after.data || before.data
  const horario = details.horario || after.horario || before.horario
  const setor = details.setor || after.setor || before.setor

  return [
    ['Entidade', log.entidade],
    ['ID', log.entidade_id],
    ['Data', data ? formatDate(data) : ''],
    ['Horario', horario ? formatTime(horario) : ''],
    ['Setor', setor],
    ['Solicitante', details.solicitante],
    ['Quantidade', details.quantidade],
    ['Motivo', details.motivo_rejeicao],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '')
}

function AuditPage() {
  const [filters, setFilters] = useState({
    inicio: '',
    fim: '',
  })
  const [agenda, setAgenda] = useState([])
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    concluidas: 0,
    pendentes: 0,
    comLink: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.inicio) params.set('inicio', filters.inicio)
    if (filters.fim) params.set('fim', filters.fim)
    return params.toString()
  }, [filters])

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const url = queryString ? `/api/auditoria?${queryString}` : '/api/auditoria'
      const response = await apiFetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Nao foi possivel carregar a auditoria.')
      }

      setAgenda(result.agenda || [])
      setLogs(result.logs || [])
      setSummary(result.summary || {
        total: 0,
        concluidas: 0,
        pendentes: 0,
        comLink: 0,
      })
      setLastUpdatedAt(new Date())
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    fetchAudit()
  }, [fetchAudit])

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      inicio: '',
      fim: '',
    })
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Auditoria</p>
          <h1>Relatorios administrativos</h1>
          {lastUpdatedAt && (
            <span className="last-updated">
              Atualizado as {lastUpdatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button className="button secondary" type="button" onClick={fetchAudit} disabled={loading}>
          <RefreshCw size={17} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="panel audit-panel" aria-label="Filtros de auditoria">
        <div className="audit-filters">
          <label className="form-field">
            Data inicial
            <input
              type="date"
              value={filters.inicio}
              onChange={(event) => updateFilter('inicio', event.target.value)}
            />
          </label>
          <label className="form-field">
            Data final
            <input
              type="date"
              value={filters.fim}
              onChange={(event) => updateFilter('fim', event.target.value)}
            />
          </label>
          <div className="audit-actions">
            <button
              className="button ghost"
              type="button"
              onClick={clearFilters}
              disabled={!filters.inicio && !filters.fim}
            >
              <X size={17} />
              Todos os periodos
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => exportAuditAgendaCsv(agenda, filters)}
              disabled={!agenda.length}
            >
              <Download size={17} />
              Exportar agenda CSV
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => exportAuditLogsCsv(logs, filters)}
              disabled={!logs.length}
            >
              <Download size={17} />
              Exportar acoes CSV
            </button>
          </div>
        </div>
      </section>

      <section className="audit-summary" aria-label="Resumo da auditoria">
        <article>
          <span>VCs no relatorio</span>
          <strong>{summary.total}</strong>
        </article>
        <article>
          <span>Concluidas</span>
          <strong>{summary.concluidas}</strong>
        </article>
        <article>
          <span>Pendentes</span>
          <strong>{summary.pendentes}</strong>
        </article>
        <article>
          <span>Com link</span>
          <strong>{summary.comLink}</strong>
        </article>
      </section>

      <section className="panel audit-panel" aria-label="Videoconferencias do relatorio">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Agenda auditada</p>
            <h2>Videoconferencias do relatorio</h2>
          </div>
          <span className="audit-count">{agenda.length} registros</span>
        </div>

        {loading && <div className="state-box">Carregando videoconferencias...</div>}

        {!loading && !agenda.length && (
          <div className="state-box">Nenhuma videoconferencia encontrada nesse periodo.</div>
        )}

        {!loading && agenda.length > 0 && (
          <div className="audit-log-list">
            {agenda.map((item) => (
              <article className="audit-log-item audit-agenda-item" key={item.id}>
                <div>
                  <strong>{item.nome}</strong>
                  <span>{getAgendaDateText(item)} - {formatTime(item.horario)}</span>
                </div>
                <p>
                  {item.plataforma}
                  {item.local_fisico ? ` - ${item.local_fisico}` : ''}
                  {item.responsavel ? ` - ${item.responsavel}` : ''}
                  {item.setor ? ` - ${item.setor}` : ''}
                </p>
                <small>
                  {item.concluida ? 'Concluida' : 'Pendente'}
                  {' - '}
                  {item.link ? 'Com link' : 'Sem link'}
                  {item.solicitacao_id ? ` - Solicitacao ${item.solicitacao_id}` : ' - Cadastro manual'}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel audit-panel" aria-label="Acoes administrativas">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Historico</p>
            <h2>Acoes registradas</h2>
          </div>
          <span className="audit-count">{logs.length} registros</span>
        </div>

        {loading && <div className="state-box">Carregando auditoria...</div>}

        {!loading && !logs.length && (
          <div className="state-box">Nenhuma acao administrativa registrada nesse periodo. Os logs passam a contar depois que a auditoria foi ativada.</div>
        )}

        {!loading && logs.length > 0 && (
          <div className="audit-log-list">
            {logs.map((log) => {
              const metaItems = getLogMetaItems(log)
              const changes = buildChangeList(log)

              return (
                <article className="audit-log-item" key={log.id}>
                  <div>
                    <strong>{actionLabels[log.acao] || log.acao}</strong>
                    <span>{formatDateTime(log.criado_em)} - {log.usuario || 'admin'}</span>
                  </div>
                  <p>{getLogTitle(log)}</p>
                  {getLogDescription(log) && <small>{getLogDescription(log)}</small>}
                  {metaItems.length > 0 && (
                    <dl className="audit-detail-grid">
                      {metaItems.map(([label, value]) => (
                        <div key={`${log.id}-${label}`}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {changes.length > 0 && (
                    <ul className="audit-change-list">
                      {changes.map((change) => (
                        <li key={`${log.id}-${change}`}>{change}</li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default AuditPage
