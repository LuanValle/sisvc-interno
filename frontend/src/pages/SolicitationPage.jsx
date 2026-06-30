import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import AvailabilityDatePicker from '../components/AvailabilityDatePicker'
import { apiFetch } from '../utils/apiClient'
import { formatContact, formatNip, normalizeSector, onlyDigits } from '../utils/formatters'
import { notifyRequestsChanged } from '../utils/realtimeEvents'
import { isValidUrl } from '../utils/validationUtils'

const initialForm = {
  name: '',
  nip: '',
  department: '',
  contact: '',
  responsibleEmail: '',
  conferenceName: '',
  platform: '',
  physicalLocation: '',
  date: '',
  time: '',
  endTime: '',
  priority: '',
  link: '',
  requestLink: false,
  notes: '',
}

const requiredFields = [
  'name',
  'nip',
  'department',
  'contact',
  'conferenceName',
  'platform',
  'physicalLocation',
  'date',
  'time',
  'endTime',
  'priority',
]

const platforms = ['Google Meet', 'Microsoft Teams', 'Zoom', 'Webex', 'UNA', 'Presencial', 'Outro']
const priorities = ['Baixa', 'Média', 'Alta', 'Crítica']

const isPastDate = (value) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${value}T00:00:00`) < today
}

const todayIso = () => {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

const mapFormToApiPayload = (form) => ({
  nome: form.name.trim(),
  nip: form.nip.trim(),
  setor: normalizeSector(form.department).trim(),
  contato: form.contact.trim(),
  email_responsavel: form.responsibleEmail.trim(),
  nome_videoconferencia: form.conferenceName.trim(),
  local_plataforma: form.platform.trim(),
  local_fisico: form.physicalLocation.trim(),
  data: form.date.trim(),
  horario: form.time.trim(),
  horario_fim: form.endTime.trim(),
  prioridade: form.priority.trim(),
  link: form.link.trim(),
  solicitar_link: Boolean(form.requestLink && !form.link.trim()),
  observacoes: form.notes.trim(),
})

function SolicitationPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSending, setIsSending] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateUppercaseField = (field, value) => {
    updateField(field, value.toUpperCase())
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSending) return

    const hasMissingRequiredField = requiredFields.some((field) => !form[field].trim())

    if (hasMissingRequiredField) {
      setSuccess('')
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    if (onlyDigits(form.nip).length !== 8) {
      setSuccess('')
      setError('Informe o identificador funcional no formato 00.0000.00.')
      return
    }

    if (![10, 11].includes(onlyDigits(form.contact).length)) {
      setSuccess('')
      setError('Informe o contato com DDD.')
      return
    }

    if (isPastDate(form.date)) {
      setSuccess('')
      setError('A data não pode ser anterior à data atual.')
      return
    }

    if (form.endTime <= form.time) {
      setSuccess('')
      setError('O horario final deve ser posterior ao horario inicial.')
      return
    }

    if (form.link.trim() && !isValidUrl(form.link.trim())) {
      setSuccess('')
      setError('Informe uma URL válida começando com http:// ou https://.')
      return
    }

    try {
      setIsSending(true)

      // Envia a solicitação pública para a API salvar no banco.
      const response = await apiFetch('/api/solicitacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapFormToApiPayload(form)),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setSuccess('')
        setError(result.error || 'Não foi possível enviar a solicitação.')
        return
      }

      setForm(initialForm)
      setError('')
      notifyRequestsChanged()
      setSuccess('Solicitação enviada com sucesso. Ela ficará pendente para análise administrativa.')
    } catch {
      setSuccess('')
      setError('Não foi possível conectar com a API.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="public-shell">
      <main className="solicitation-page">
        <Link className="back-link" to="/">
          <ArrowLeft size={17} />
          Voltar para início
        </Link>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Solicitação pública</p>
              <h1>Solicitar videoconferência</h1>
            </div>
          </div>

          <ErrorMessage message={error} />
          {success && <div className="success-message">{success}</div>}

          <form className="conference-form" onSubmit={handleSubmit} noValidate>
            <label className="form-field">
              Nome do solicitante *
              <input
                value={form.name}
                onChange={(event) => updateUppercaseField('name', event.target.value)}
                placeholder="Ex.: Pessoa Solicitante"
              />
            </label>
            <label className="form-field">
              Identificador funcional *
              <input
                value={form.nip}
                onChange={(event) => updateField('nip', formatNip(event.target.value))}
                placeholder="00.0000.00"
              />
            </label>
            <label className="form-field">
              Setor *
              <input
                value={form.department}
                onChange={(event) => updateField('department', normalizeSector(event.target.value))}
                placeholder="Tecnologia"
              />
            </label>
            <label className="form-field">
              Contato *
              <input
                value={form.contact}
                onChange={(event) => updateField('contact', formatContact(event.target.value))}
                placeholder="(00) 00000-0000"
              />
            </label>
            <label className="form-field">
              Email do responsável
              <input
                type="email"
                value={form.responsibleEmail}
                onChange={(event) => updateField('responsibleEmail', event.target.value)}
                placeholder="responsavel@example.com"
              />
            </label>
            <label className="form-field">
              Nome da videoconferência *
              <input
                value={form.conferenceName}
                onChange={(event) => updateField('conferenceName', event.target.value)}
              />
            </label>
            <label className="form-field">
              Plataforma *
              <select value={form.platform} onChange={(event) => updateField('platform', event.target.value)}>
                <option value="">Selecione</option>
                {platforms.map((platform) => (
                  <option value={platform} key={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Local da videoconferencia *
              <input
                value={form.physicalLocation}
                onChange={(event) => updateUppercaseField('physicalLocation', event.target.value)}
                placeholder="Ex.: AUDITORIO CGS"
              />
            </label>
            <div className="form-field">
              <span className="form-field-label">Data *</span>
              <AvailabilityDatePicker
                value={form.date}
                min={todayIso()}
                onChange={(date) => updateField('date', date)}
              />
            </div>
            <label className="form-field">
              Horário inicial *
              <input type="time" value={form.time} onChange={(event) => updateField('time', event.target.value)} />
            </label>
            <label className="form-field">
              Horário final *
              <input type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} />
            </label>
            <label className="form-field">
              Prioridade *
              <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                <option value="">Selecione</option>
                {priorities.map((priority) => (
                  <option value={priority} key={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Link da videoconferência
              <input
                value={form.link}
                onChange={(event) => {
                  updateField('link', event.target.value)
                  if (event.target.value.trim()) updateField('requestLink', false)
                }}
                placeholder="https://..."
              />
            </label>
            <label className="form-field checkbox-field">
              <input
                type="checkbox"
                checked={form.requestLink}
                disabled={Boolean(form.link.trim())}
                onChange={(event) => updateField('requestLink', event.target.checked)}
              />
              <span>Não tenho link de videoconferência e desejo solicitar a criação.</span>
            </label>
            <label className="form-field full-width">
              Observações
              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                rows="4"
                placeholder="Informe detalhes importantes: se ainda precisa que o link da videoconferência seja criado, materiais necessários, pauta, participantes, período de duração ou qualquer orientação para o administrador."
              />
            </label>
            <div className="form-actions full-width">
              <button className="button primary" type="submit" disabled={isSending}>
                <Send size={18} />
                {isSending ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default SolicitationPage
