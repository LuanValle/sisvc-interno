import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/apiClient'

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const selectedDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const toIsoDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-')

const parseIsoDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day, 12) : null
}

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const buildAvailabilityByDate = (reservations, visibleMonth) => {
  const result = {}
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12)
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0, 12)

  reservations.forEach((reservation) => {
    const start = parseIsoDate(reservation.data)
    const end = parseIsoDate(reservation.data_fim || reservation.data)
    if (!start || !end) return

    let current = start < monthStart ? monthStart : start
    const lastDate = end > monthEnd ? monthEnd : end

    while (current <= lastDate) {
      const key = toIsoDate(current)
      result[key] = [
        ...(result[key] || []),
        {
          time: String(reservation.horario || '').slice(0, 5),
          endTime: String(reservation.horario_fim || '').slice(0, 5),
          location: reservation.local,
        },
      ]
      current = addDays(current, 1)
    }
  })

  return result
}

function AvailabilityDatePicker({ value, onChange, min }) {
  const initialDate = parseIsoDate(value) || new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12),
  )
  const [reservations, setReservations] = useState([])
  const [hoveredDate, setHoveredDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const controller = new AbortController()
    const loadAvailability = async () => {
      try {
        setIsLoading(true)
        setError('')
        const response = await apiFetch(`/api/disponibilidade?mes=${monthKey(visibleMonth)}`, {
          signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Não foi possível consultar os espaços.')
        setReservations(result.data || [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setReservations([])
          setError(requestError.message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadAvailability()
    return () => controller.abort()
  }, [isOpen, visibleMonth])

  const availability = useMemo(
    () => buildAvailabilityByDate(reservations, visibleMonth),
    [reservations, visibleMonth],
  )

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const leadingBlankDays = (new Date(year, month, 1).getDay() + 6) % 7

    return [
      ...Array.from({ length: leadingBlankDays }, () => null),
      ...Array.from({ length: totalDays }, (_unused, index) => new Date(year, month, index + 1, 12)),
    ]
  }, [visibleMonth])

  const selectedDate = parseIsoDate(value)
  const selectedReservations = value ? availability[value] || [] : []

  const moveMonth = (amount) => {
    setHoveredDate('')
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12))
  }

  const selectDate = (date) => {
    const isoDate = toIsoDate(date)
    if (min && isoDate < min) return
    onChange(isoDate)
    setIsOpen(false)
  }

  return (
    <div className="availability-picker">
      <button
        className="availability-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
      >
        <CalendarDays size={18} />
        <span>{selectedDate ? selectedDateFormatter.format(selectedDate) : 'Selecione uma data'}</span>
      </button>

      {isOpen && (
        <div className="availability-calendar" role="dialog" aria-label="Calendário de disponibilidade">
          <header className="availability-calendar-header">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior">
              <ChevronLeft size={18} />
            </button>
            <strong>{monthFormatter.format(visibleMonth)}</strong>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Próximo mês">
              <ChevronRight size={18} />
            </button>
          </header>

          <div className="availability-weekdays" aria-hidden="true">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="availability-days">
            {days.map((date, index) => {
              if (!date) return <span className="availability-empty-day" key={`empty-${index}`} />

              const isoDate = toIsoDate(date)
              const slots = availability[isoDate] || []
              const isReserved = slots.length > 0
              const isSelected = value === isoDate
              const isDisabled = Boolean(min && isoDate < min)
              const label = isReserved
                ? `${date.getDate()}, ${slots.length} ${slots.length === 1 ? 'espaço reservado' : 'espaços reservados'}`
                : String(date.getDate())

              return (
                <button
                  className={[
                    'availability-day',
                    isReserved ? 'reserved' : '',
                    isSelected ? 'selected' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  key={isoDate}
                  disabled={isDisabled}
                  aria-label={label}
                  onClick={() => selectDate(date)}
                  onMouseEnter={() => setHoveredDate(isoDate)}
                  onMouseLeave={() => setHoveredDate('')}
                  onFocus={() => setHoveredDate(isoDate)}
                  onBlur={() => setHoveredDate('')}
                >
                  <span>{date.getDate()}</span>
                  {isReserved && <span className="availability-marker" aria-hidden="true" />}
                  {isReserved && hoveredDate === isoDate && (
                    <span className="availability-tooltip" role="tooltip">
                      <strong>Espaços reservados</strong>
                      {slots.map((slot, slotIndex) => (
                        <span key={`${slot.time}-${slot.location}-${slotIndex}`}>
                          <Clock3 size={13} /> {slot.time}{slot.endTime ? ` às ${slot.endTime}` : ''} · <MapPin size={13} /> {slot.location}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <footer className="availability-calendar-footer">
            {isLoading && <span>Consultando espaços...</span>}
            {!isLoading && error && <span className="availability-error">{error}</span>}
            {!isLoading && !error && <span><i /> Dia com espaço reservado</span>}
          </footer>
        </div>
      )}

      {value && selectedReservations.length > 0 && (
        <div className="selected-availability" role="status">
          <strong>Já reservado nesta data:</strong>
          {selectedReservations.map((slot, index) => (
            <span key={`${slot.time}-${slot.location}-${index}`}>{slot.time}{slot.endTime ? ` às ${slot.endTime}` : ''} · {slot.location}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default AvailabilityDatePicker
