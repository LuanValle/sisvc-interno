import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import RejectModal from '../components/RejectModal'
import RequestCard from '../components/RequestCard'
import { apiFetch } from '../utils/apiClient'
import { apiToRequest } from '../utils/apiMappers'
import { notifyAgendaChanged, notifyRequestsChanged, REQUESTS_CHANGED_EVENT, subscribeRealtimeEvent } from '../utils/realtimeEvents'
import { useSmartPolling } from '../utils/useSmartPolling'

const pollingAfterInitialLoad = { intervalMs: 10000, runImmediately: false }

function PendingRequests() {
  const [requests, setRequests] = useState([])
  const [rejecting, setRejecting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [isRejecting, setIsRejecting] = useState(false)

  const fetchRequests = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) setLoading(true)
      setError('')

      // Carrega as solicitações reais do banco por meio da API.
      const response = await apiFetch('/api/solicitacoes?status=pendente')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível carregar as solicitações.')
      }

      setRequests((result.data || []).map(apiToRequest))
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests({ showLoading: true })
  }, [fetchRequests])

  useSmartPolling(fetchRequests, pollingAfterInitialLoad)

  useEffect(() => {
    const refreshRequests = () => fetchRequests()
    return subscribeRealtimeEvent(REQUESTS_CHANGED_EVENT, refreshRequests)
  }, [fetchRequests])

  const pendingRequests = requests

  const approveRequest = async (request) => {
    if (actionLoadingId) return

    try {
      setError('')
      setActionLoadingId(request.id)

      const response = await apiFetch(`/api/solicitacoes/${request.id}/aprovar`, {
        method: 'PATCH',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível aprovar a solicitação.')
      }

      await fetchRequests()
      notifyRequestsChanged()
      notifyAgendaChanged()
    } catch (error) {
      setError(error.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const rejectRequest = async (reason) => {
    if (!rejecting || isRejecting) return

    try {
      setError('')
      setIsRejecting(true)

      const response = await apiFetch(`/api/solicitacoes/${rejecting.id}/rejeitar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo_rejeicao: reason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível rejeitar a solicitação.')
      }

      setRejecting(null)
      await fetchRequests()
      notifyRequestsChanged()
    } catch (error) {
      setError(error.message)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Análise</p>
          <h1>Solicitações pendentes</h1>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Carregando solicitações...</div>}

      {!loading && pendingRequests.length ? (
        <div className="conference-list">
          {pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={approveRequest}
              onReject={setRejecting}
              actionLoadingId={actionLoadingId}
            />
          ))}
        </div>
      ) : (
        !loading && <EmptyState hasConferences={false} />
      )}

      {rejecting && (
        <RejectModal
          onConfirm={rejectRequest}
          onCancel={() => setRejecting(null)}
          isLoading={isRejecting}
        />
      )}
    </section>
  )
}

export default PendingRequests
