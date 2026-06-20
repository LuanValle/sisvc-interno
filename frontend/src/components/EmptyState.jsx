import { CalendarX } from 'lucide-react'

function EmptyState({ hasConferences }) {
  return (
    <div className="empty-state">
      <CalendarX size={42} aria-hidden="true" />
      <h2>{hasConferences ? 'Nenhum resultado encontrado' : 'Nenhuma videoconferência cadastrada'}</h2>
      <p>
        {hasConferences
          ? 'Ajuste a busca ou escolha outro filtro para encontrar reuniões.'
          : 'Cadastre a primeira reunião para começar a organizar a agenda.'}
      </p>
    </div>
  )
}

export default EmptyState
