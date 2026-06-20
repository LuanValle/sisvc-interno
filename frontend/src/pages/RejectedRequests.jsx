import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import RequestCard from '../components/RequestCard'
import { apiFetch } from '../utils/apiClient'
import { apiToRequest } from '../utils/apiMappers'
import { REQUESTS_CHANGED_EVENT, subscribeRealtimeEvent } from '../utils/realtimeEvents'
import { useSmartPolling } from '../utils/useSmartPolling'

const PAGE_SIZE = 20
const pollingAfterInitialLoad = { intervalMs: 10000, runImmediately: false }

function RejectedRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
  })

  const fetchRequests = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) setLoading(true)
      setError('')

      // Carrega somente as rejeitadas da pagina atual.
      const offset = page * PAGE_SIZE
      const response = await apiFetch(`/api/solicitacoes?status=rejeitada&limit=${PAGE_SIZE}&offset=${offset}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível carregar as solicitações rejeitadas.')
      }

      // Converte os nomes do banco para o formato esperado pelo RequestCard.
      setRequests((result.data || []).map(apiToRequest))
      setPagination({
        total: result.meta?.total || 0,
        hasMore: Boolean(result.meta?.hasMore),
      })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRequests({ showLoading: true })
  }, [fetchRequests])

  useSmartPolling(fetchRequests, pollingAfterInitialLoad)

  useEffect(() => {
    const refreshRequests = () => fetchRequests()
    return subscribeRealtimeEvent(REQUESTS_CHANGED_EVENT, refreshRequests)
  }, [fetchRequests])

  const rejected = requests

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Histórico</p>
          <h1>Solicitações rejeitadas</h1>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Carregando solicitações rejeitadas...</div>}

      {!loading && rejected.length ? (
        <>
          <div className="conference-list">
            {rejected.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
          <div className="pagination-controls">
            <span>
              Pagina {page + 1} de {Math.max(1, Math.ceil(pagination.total / PAGE_SIZE))}
            </span>
            <div>
              <button
                className="button secondary"
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Anterior
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={!pagination.hasMore || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Proxima
              </button>
            </div>
          </div>
        </>
      ) : (
        !loading && <EmptyState hasConferences={false} />
      )}
    </section>
  )
}

export default RejectedRequests
