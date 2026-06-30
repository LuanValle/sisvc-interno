import { useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronDown, Clock, Copy, EllipsisVertical, ExternalLink, MapPin, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import {
  formatDateRangePtBr,
  getDateStatusText,
  getSituation,
  getVisualClassByProximity,
} from '../utils/dateUtils'
import { buildCallTicketText } from '../utils/callTicketTemplate'

const SISRECIM_TICKET_URL = 'https://siscsrecim.ctim.mb/front/ticket.form.php'

const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

function ConferenceCard({ conference, onEdit, onDelete, onComplete, onReopen }) {
  const statusClass = getVisualClassByProximity(conference)
  const situation = getSituation(conference)
  const [copyStatus, setCopyStatus] = useState('')
  const [sisrecimStatus, setSisrecimStatus] = useState('')
  const [actionsOpen, setActionsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const toggleDetails = () => setDetailsOpen((current) => !current)

  const handleCardClick = (event) => {
    if (event.target.closest('button, a, input, select, textarea, label')) return
    toggleDetails()
  }

  const handleCopyTicket = async () => {
    setActionsOpen(false)
    try {
      await copyToClipboard(buildCallTicketText(conference))
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus(''), 1800)
    } catch {
      setCopyStatus('error')
      window.setTimeout(() => setCopyStatus(''), 2200)
    }
  }

  const handleOpenSisrecimTicket = () => {
    setActionsOpen(false)
    const copyPromise = copyToClipboard(buildCallTicketText(conference))
    window.open(SISRECIM_TICKET_URL, '_blank', 'noopener,noreferrer')

    copyPromise
      .then(() => {
        setSisrecimStatus('copied')
        window.setTimeout(() => setSisrecimStatus(''), 1800)
      })
      .catch(() => {
        setSisrecimStatus('error')
        window.setTimeout(() => setSisrecimStatus(''), 2200)
      })
  }

  return (
    <article
      className={`conference-card ${statusClass}${actionsOpen ? ' actions-menu-open' : ''}${detailsOpen ? ' details-open' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-topline">
        <div>
          <h3>{conference.name}</h3>
        </div>
        <div className="badge-group">
          <span className={`situation-badge situation-${situation}`}>{getDateStatusText(conference)}</span>
        </div>
      </div>

      <dl className="conference-details conference-details-compact">
        <div>
          <dt>
            <CalendarDays size={15} />
            {conference.endDate ? 'Período' : 'Data'}
          </dt>
          <dd>{formatDateRangePtBr(conference.date, conference.endDate)}</dd>
        </div>
        <div>
          <dt>
            <Clock size={15} />
            Horário
          </dt>
          <dd>{conference.time}</dd>
        </div>
        <div>
          <dt>
            <MapPin size={15} />
            Local
          </dt>
          <dd>{conference.physicalLocation || 'Não informado'}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd className="capitalize">{situation}</dd>
        </div>
      </dl>

      <div className="conference-extra-details" aria-hidden={!detailsOpen}>
        <div className="conference-extra-details-inner">
          <dl className="conference-extra-details-grid">
            <div>
              <dt>Plataforma</dt>
              <dd>{conference.platform || 'Não informada'}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{conference.responsible || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Setor</dt>
              <dd>{conference.department || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>{conference.priority || 'Não informada'}</dd>
            </div>
            <div>
              <dt>Horário final</dt>
              <dd>{conference.endTime || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Recorrência</dt>
              <dd>{conference.recurrenceType && conference.recurrenceType !== 'none' ? conference.recurrenceType : 'Não'}</dd>
            </div>
          </dl>
          {conference.notes && (
            <div className="conference-extra-notes">
              <strong>Observações</strong>
              <p>{conference.notes}</p>
            </div>
          )}
        </div>
      </div>

      <button
        className="conference-details-toggle no-print"
        type="button"
        aria-expanded={detailsOpen}
        onClick={toggleDetails}
      >
        {detailsOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {onEdit && onDelete && onComplete && onReopen && (
        <div className="card-actions-wrapper no-print">
          <button
            className="icon-button card-actions-toggle"
            type="button"
            aria-label={`Ações de ${conference.name}`}
            aria-expanded={actionsOpen}
            title="Mais ações"
            onClick={() => setActionsOpen((current) => !current)}
          >
            <EllipsisVertical size={19} />
          </button>
          {actionsOpen && (
            <div className="card-actions-menu">
              {conference.link && (
                <a className="card-action-item" href={conference.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} />
                  Abrir reunião
                </a>
              )}
              <button type="button" onClick={() => { setActionsOpen(false); onEdit(conference) }}>
                <Pencil size={16} />
                Editar
              </button>
              <button type="button" onClick={handleCopyTicket}>
                <Copy size={16} />
                Copiar chamado
              </button>
              <button type="button" onClick={handleOpenSisrecimTicket}>
                <ExternalLink size={16} />
                Abrir SisRecim
              </button>
              {conference.completed ? (
                <button type="button" onClick={() => { setActionsOpen(false); onReopen(conference.id) }}>
                  <RotateCcw size={16} />
                  Reabrir
                </button>
              ) : (
                <button className="success" type="button" onClick={() => { setActionsOpen(false); onComplete(conference.id) }}>
                  <CheckCircle2 size={16} />
                  Concluir
                </button>
              )}
              <button className="danger" type="button" onClick={() => { setActionsOpen(false); onDelete(conference.id) }}>
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          )}
          {(copyStatus || sisrecimStatus) && (
            <span className="card-action-feedback" role="status">
              {copyStatus === 'copied' || sisrecimStatus === 'copied' ? 'Copiado' : 'Erro ao copiar'}
            </span>
          )}
        </div>
      )}
    </article>
  )
}

export default ConferenceCard
