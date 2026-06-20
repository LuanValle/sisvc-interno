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
  return (
    <nav className="filters no-print" aria-label="Filtros de videoconferências">
      {filters.map(([value, label]) => (
        <button
          className={activeFilter === value ? 'filter-button active' : 'filter-button'}
          type="button"
          key={value}
          onClick={() => setActiveFilter(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

export default Filters
