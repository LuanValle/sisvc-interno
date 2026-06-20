import { useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, Copy, ExternalLink, Pencil, RotateCcw, Trash2 } from 'lucide-react'
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

  const handleCopyTicket = async () => {
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
    <article className={`conference-card ${statusClass}`}>
      <div className="card-topline">
        <div>
          <h3>{conference.name}</h3>
          <p>{conference.platform}</p>
        </div>
        <div className="badge-group">
          <span className={`priority-badge priority-${conference.priority.toLowerCase()}`}>
            {conference.priority}
          </span>
          <span className={`situation-badge situation-${situation}`}>{getDateStatusText(conference)}</span>
        </div>
      </div>

      <dl className="conference-details">
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
        {conference.responsible && (
          <div>
            <dt>Responsável</dt>
            <dd>{conference.responsible}</dd>
          </div>
        )}
        {conference.department && (
          <div>
            <dt>Setor</dt>
            <dd>{conference.department}</dd>
          </div>
        )}
        {conference.physicalLocation && (
          <div>
            <dt>Local</dt>
            <dd>{conference.physicalLocation}</dd>
          </div>
        )}
        <div>
          <dt>Situação</dt>
          <dd className="capitalize">{situation}</dd>
        </div>
      </dl>

      {conference.link && (
        <a className="meeting-link" href={conference.link} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} />
          Abrir reunião
        </a>
      )}

      {conference.notes && <p className="notes">{conference.notes}</p>}

      {onEdit && onDelete && onComplete && onReopen && (
        <div className="card-actions no-print">
          <button className="icon-button" type="button" onClick={() => onEdit(conference)} title="Editar">
            <Pencil size={17} />
            <span>Editar</span>
          </button>
          <button
            className={copyStatus === 'copied' ? 'icon-button copied' : 'icon-button'}
            type="button"
            onClick={handleCopyTicket}
            title="Copiar modelo de chamado"
          >
            <Copy size={17} />
            <span>{copyStatus === 'copied' ? 'Copiado' : copyStatus === 'error' ? 'Erro ao copiar' : 'Copiar chamado'}</span>
          </button>
          <button
            className={sisrecimStatus === 'copied' ? 'icon-button copied' : 'icon-button'}
            type="button"
            onClick={handleOpenSisrecimTicket}
            title="Copiar modelo e abrir chamado no SisRecim"
          >
            <ExternalLink size={17} />
            <span>{sisrecimStatus === 'copied' ? 'Copiado' : sisrecimStatus === 'error' ? 'Erro ao copiar' : 'Abrir SisRecim'}</span>
          </button>
          {conference.completed ? (
            <button className="icon-button" type="button" onClick={() => onReopen(conference.id)} title="Reabrir">
              <RotateCcw size={17} />
              <span>Reabrir</span>
            </button>
          ) : (
            <button className="icon-button success" type="button" onClick={() => onComplete(conference.id)} title="Concluir">
              <CheckCircle2 size={17} />
              <span>Concluir</span>
            </button>
          )}
          <button className="icon-button danger" type="button" onClick={() => onDelete(conference.id)} title="Excluir">
            <Trash2 size={17} />
            <span>Excluir</span>
          </button>
        </div>
      )}
    </article>
  )
}

export default ConferenceCard
