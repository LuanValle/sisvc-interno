import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import { apiFetch } from '../utils/apiClient'
import { formatDatePtBr } from '../utils/dateUtils'
import { formatNip } from '../utils/formatters'

const SEARCH_OPTIONS = [
  { value: 'nip', label: 'NIP', placeholder: 'Ex.: 19.0485.56' },
  { value: 'nome', label: 'Nome da videoconferencia', placeholder: 'Digite o nome da videoconferencia' },
  { value: 'responsavel', label: 'Responsavel', placeholder: 'Digite o nome do responsavel' },
  { value: 'data', label: 'Data', placeholder: '' },
]

const STATUS_LABELS = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  concluida: 'Concluida',
}

function ConferenceTracking() {
  const [searchType, setSearchType] = useState('nip')
  const [searchValue, setSearchValue] = useState('')
  const [activeSearch, setActiveSearch] = useState(null)
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedOption = SEARCH_OPTIONS.find((option) => option.value === searchType)

  const runSearch = async ({ type, value, targetPage }) => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        tipo: type,
        valor: value,
        pagina: String(targetPage),
      })
      const response = await apiFetch(`/api/acompanhamento?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Nao foi possivel realizar a busca.')
      }

      setResults(result.data || [])
      setPage(result.meta?.page || targetPage)
      setHasMore(Boolean(result.meta?.hasMore))
      setHasSearched(true)
    } catch (requestError) {
      setResults([])
      setHasMore(false)
      setHasSearched(true)
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextSearch = { type: searchType, value: searchValue.trim() }
    setActiveSearch(nextSearch)
    runSearch({ ...nextSearch, targetPage: 1 })
  }

  const handlePageChange = (targetPage) => {
    if (!activeSearch || targetPage < 1 || loading) return
    runSearch({ ...activeSearch, targetPage })
  }

  const handleTypeChange = (event) => {
    setSearchType(event.target.value)
    setSearchValue('')
    setResults([])
    setHasSearched(false)
    setError('')
  }

  const handleValueChange = (event) => {
    const value = searchType === 'nip' ? formatNip(event.target.value) : event.target.value
    setSearchValue(value)
  }

  return (
    <div className="public-shell tracking-shell">
      <main className="tracking-page">
        <Link className="back-link" to="/">
          <ArrowLeft size={18} />
          Voltar para o inicio
        </Link>

        <section className="tracking-panel">
          <div className="tracking-heading">
            <p className="eyebrow">Consulta publica</p>
            <h1>Acompanhar videoconferencias</h1>
            <p>Consulte o andamento de uma solicitacao. Por seguranca, links de acesso nao sao exibidos.</p>
          </div>

          <form className="tracking-search" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Buscar por</span>
              <select value={searchType} onChange={handleTypeChange}>
                {SEARCH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field tracking-query-field">
              <span>{selectedOption.label}</span>
              <input
                type={searchType === 'data' ? 'date' : 'search'}
                value={searchValue}
                placeholder={selectedOption.placeholder}
                maxLength={searchType === 'nip' ? 10 : 120}
                autoComplete="off"
                onChange={handleValueChange}
                required
              />
            </label>

            <button className="button primary tracking-submit" type="submit" disabled={loading}>
              <Search size={18} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          <ErrorMessage message={error} />
          {loading && <Loading message="Consultando videoconferencias..." />}

          {!loading && hasSearched && !error && results.length === 0 && (
            <div className="tracking-empty" role="status">
              Nenhuma videoconferencia encontrada para essa busca.
            </div>
          )}

          {!loading && results.length > 0 && (
            <section className="tracking-results" aria-live="polite">
              <div className="tracking-results-heading">
                <div>
                  <h2>Resultado da busca</h2>
                  <p>Exibindo ate 10 videoconferencias por pagina.</p>
                </div>
                <span>Pagina {page}</span>
              </div>

              <div className="tracking-table-wrap">
                <table className="tracking-table">
                  <thead>
                    <tr>
                      <th>Videoconferencia</th>
                      <th>NIP do solicitante</th>
                      <th>Responsavel</th>
                      <th>Data</th>
                      <th>Local</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((conference) => (
                      <tr
                        key={conference.id}
                        className={`tracking-row tracking-row-${conference.status}`}
                      >
                        <td data-label="Videoconferencia">{conference.nome_videoconferencia}</td>
                        <td data-label="NIP do solicitante">{conference.nip}</td>
                        <td data-label="Responsavel">{conference.responsavel}</td>
                        <td data-label="Data">{formatDatePtBr(conference.data?.slice(0, 10))}</td>
                        <td data-label="Local">{conference.local || 'Nao informado'}</td>
                        <td data-label="Status">
                          <span className={`situation-badge situation-${conference.status}`}>
                            {STATUS_LABELS[conference.status] || conference.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-controls tracking-pagination">
                <span>Pagina {page}</span>
                <div>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft size={17} />
                    Anterior
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasMore || loading}
                  >
                    Proxima
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  )
}

export default ConferenceTracking
