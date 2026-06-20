import { CalendarCheck, CalendarClock, CircleAlert, ListChecks, Siren, TimerReset } from 'lucide-react'

const cards = [
  ['total', 'Total', ListChecks],
  ['pending', 'Pendentes', CalendarClock],
  ['completed', 'Concluídas/Aprovadas', CalendarCheck],
  ['expired', 'Vencidas/Rejeitadas', TimerReset],
  ['today', 'Hoje', CircleAlert],
  ['highPriority', 'Alta/Crítica', Siren],
]

function Dashboard({ summary }) {
  return (
    <section className="dashboard" aria-label="Resumo das videoconferências">
      {cards.map(([key, label, Icon]) => (
        <article className={`summary-card summary-${key}`} key={key}>
          <span className="summary-icon" aria-hidden="true">
            <Icon size={19} />
          </span>
          <div>
            <strong>{summary[key]}</strong>
            <span>{label}</span>
          </div>
        </article>
      ))}
    </section>
  )
}

export default Dashboard
