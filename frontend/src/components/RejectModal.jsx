import { useState } from 'react'

function RejectModal({ onConfirm, onCancel, isLoading }) {
  const [reason, setReason] = useState('')

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <div className="modal">
        <h2 id="reject-title">Rejeitar solicitação</h2>
        <label className="form-field">
          Motivo da rejeição
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows="4"
            placeholder="Informe o motivo para registro administrativo."
          />
        </label>
        <div className="modal-actions">
          <button className="button ghost" type="button" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </button>
          <button className="button danger-button" type="button" onClick={() => onConfirm(reason.trim())} disabled={isLoading}>
            {isLoading ? 'Rejeitando...' : 'Rejeitar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RejectModal
