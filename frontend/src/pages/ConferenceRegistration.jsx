import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConferenceForm, { emptyForm } from '../components/ConferenceForm'
import { apiFetch } from '../utils/apiClient'
import { apiToConference, conferenceToApi } from '../utils/apiMappers'
import { notifyAgendaChanged } from '../utils/realtimeEvents'
import { validateConference } from '../utils/validationUtils'

function conferenceToForm(conference) {
  return {
    name: conference.name,
    platform: conference.platform,
    physicalLocation: conference.physicalLocation || '',
    date: conference.date,
    endDate: conference.endDate || '',
    time: conference.time,
    priority: conference.priority,
    responsible: conference.responsible || '',
    department: conference.department || '',
    link: conference.link || '',
    notes: conference.notes || '',
    recurrenceType: 'none',
    repeatUntil: '',
  }
}

function ConferenceRegistration() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editingId = id || null
  const isEditing = Boolean(editingId)

  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)

  const pageTitle = useMemo(
    () => (isEditing ? 'Editar videoconferencia' : 'Cadastrar videoconferencia'),
    [isEditing],
  )

  const loadConference = useCallback(async () => {
    if (!editingId) return

    try {
      setIsLoading(true)
      setMessage('')

      const response = await apiFetch('/api/videoconferencias')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Nao foi possivel carregar a videoconferencia.')
      }

      const conferences = (result.data || []).map(apiToConference)
      const selectedConference = conferences.find((conference) => String(conference.id) === String(editingId))

      if (!selectedConference) {
        setMessage('Videoconferencia nao encontrada para edicao.')
        return
      }

      setFormData(conferenceToForm(selectedConference))
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar videoconferencia.')
    } finally {
      setIsLoading(false)
    }
  }, [editingId])

  useEffect(() => {
    loadConference()
  }, [loadConference])

  const resetForm = () => {
    setFormData(emptyForm)
    setErrors({})
  }

  const handleCancelEdit = () => {
    navigate('/admin/agenda')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSaving) return

    const trimmedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    )

    const validationErrors = validateConference(trimmedData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length) {
      setMessage('Revise os campos destacados antes de salvar.')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      const response = await apiFetch(
        isEditing ? `/api/videoconferencias/${editingId}` : '/api/videoconferencias',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(conferenceToApi(trimmedData)),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || 'Nao foi possivel salvar a videoconferencia.')
        return
      }

      notifyAgendaChanged()

      if (isEditing) {
        setMessage('Videoconferencia atualizada com sucesso.')
        navigate('/admin/agenda')
        return
      }

      resetForm()
      setMessage(result.message || 'Videoconferencia cadastrada com sucesso.')
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar videoconferencia.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>{pageTitle}</h1>
        </div>
        <Link className="button secondary" to="/admin/agenda">
          <ArrowLeft size={17} />
          Voltar para agenda
        </Link>
      </div>

      {message && (
        <div className="toast no-print" role="status">
          {message}
          <button type="button" onClick={() => setMessage('')} aria-label="Fechar aviso">
            x
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="state-box">Carregando videoconferencia...</div>
      ) : (
        <ConferenceForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onCancelEdit={isEditing ? handleCancelEdit : resetForm}
          isSaving={isSaving}
        />
      )}
    </section>
  )
}

export default ConferenceRegistration
