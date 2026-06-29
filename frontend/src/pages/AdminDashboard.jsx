import { useCallback, useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'
import { apiFetch } from '../utils/apiClient'
import { apiToConference, apiToRequest } from '../utils/apiMappers'
import { isToday } from '../utils/dateUtils'
import { getRequestSummary } from '../utils/requestUtils'
import { AGENDA_CHANGED_EVENT, REQUESTS_CHANGED_EVENT, subscribeRealtimeEvent } from '../utils/realtimeEvents'
import { useSmartPolling } from '../utils/useSmartPolling'

function AdminDashboard() {
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    expired: 0,
    today: 0,
    highPriority: 0,
  })
  const [error, setError] = useState('')
  const [status, setStatus] = useState({
    database: 'verificando',
    lastUpdatedAt: null,
    pending: 0,
    today: 0,
  })

  const fetchSummary = useCallback(async () => {
    try {
      setError('')

      // Busca solicitacoes e agenda para montar os numeros do painel.
      const [requestsResponse, conferencesResponse] = await Promise.all([
        apiFetch('/api/solicitacoes'),
        apiFetch('/api/videoconferencias'),
      ])
      const [requestsResult, conferencesResult] = await Promise.all([
        requestsResponse.json(),
        conferencesResponse.json(),
      ])

      if (!requestsResponse.ok) {
        throw new Error(requestsResult.error || 'Nao foi possivel carregar o painel.')
      }

      if (!conferencesResponse.ok) {
        throw new Error(conferencesResult.error || 'Nao foi possivel carregar a agenda do painel.')
      }

      const requests = (requestsResult.data || []).map(apiToRequest)
      const conferences = (conferencesResult.data || []).map(apiToConference)
      const requestSummary = getRequestSummary(requests)
      const conferencesToday = conferences.filter((conference) => isToday(conference.date, conference.endDate)).length
      const nextSummary = {
        ...requestSummary,
        today: conferencesToday,
      }

      setSummary(nextSummary)
      setStatus({
        database: 'conectado',
        lastUpdatedAt: new Date(),
        pending: requestSummary.pending,
        today: requestSummary.today,
      })
    } catch (error) {
      setError(error.message)
      setStatus((current) => ({
        ...current,
        database: 'erro',
      }))
    }
  }, [])

  useSmartPolling(fetchSummary, 10000)

  useEffect(() => {
    const refreshSummary = () => fetchSummary()
    const unsubscribeRequests = subscribeRealtimeEvent(REQUESTS_CHANGED_EVENT, refreshSummary)
    const unsubscribeAgenda = subscribeRealtimeEvent(AGENDA_CHANGED_EVENT, refreshSummary)

    return () => {
      unsubscribeRequests()
      unsubscribeAgenda()
    }
  }, [fetchSummary])

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Painel administrativo</h1>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <Dashboard summary={summary} />
      <section className="status-panel" aria-label="Status do sistema">
        <article>
          <span>Banco</span>
          <strong className={status.database === 'conectado' ? 'status-ok' : 'status-error'}>
            {status.database}
          </strong>
        </article>
        <article>
          <span>Última atualização</span>
          <strong>
            {status.lastUpdatedAt
              ? status.lastUpdatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </strong>
        </article>
        <article>
          <span>Pendentes</span>
          <strong>{status.pending}</strong>
        </article>
        <article>
          <span>Solicitações de hoje</span>
          <strong>{status.today}</strong>
        </article>
      </section>
    </section>
  )
}

export default AdminDashboard
