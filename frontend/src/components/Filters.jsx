import { ChevronDown, ChevronUp, ListFilter } from 'lucide-react'
import { useState } from 'react'

const filters = [
  ['all', 'Todas'],
  ['pending', 'Pendentes'],
  ['completed', 'Concluídas'],
  ['expired', 'Vencidas'],
  ['high-critical', 'Alta/Crítica'],
  ['today', 'Hoje'],
  ['week', 'Esta semana'],
  ['month', 'Este mês'],
  ['next-30', 'Próximos 30 dias'],
]

function Filters({ activeFilter, setActiveFilter }) {
  const [isOpen, setIsOpen] = useState(false)
  const activeLabel = filters.find(([value]) => value === activeFilter)?.[1] || 'Todas'

  const selectFilter = (value) => {
    setActiveFilter(value)
    setIsOpen(false)
  }

  return (
    <div className="filter-disclosure no-print">
      <button
        className="button secondary filter-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="agenda-filter-options"
        onClick={() => setIsOpen((current) => !current)}
      >
        <ListFilter size={17} />
        Filtros: {activeLabel}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <nav
          className="filters"
          id="agenda-filter-options"
          aria-label="Filtros de videoconferências"
        >
          {filters.map(([value, label]) => (
            <button
              className={activeFilter === value ? 'filter-button active' : 'filter-button'}
              type="button"
              key={value}
              onClick={() => selectFilter(value)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

export default Filters
