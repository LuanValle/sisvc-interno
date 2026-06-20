import ConferenceCard from './ConferenceCard'
import EmptyState from './EmptyState'
import { combineDateAndTime, formatDatePtBr, isToday } from '../utils/dateUtils'

const getDateGroupTitle = (date) => {
  const formatted = formatDatePtBr(date)
  return isToday(date) ? `Hoje - ${formatted}` : formatted
}

const sortBySchedule = (a, b) => {
  return combineDateAndTime(a.date, a.time) - combineDateAndTime(b.date, b.time)
}

const groupConferencesByDate = (conferences) => {
  const pendingConferences = conferences.filter((conference) => !conference.completed)
  const completedConferences = conferences.filter((conference) => conference.completed)

  const dateGroups = pendingConferences.reduce((accumulator, conference) => {
    const existing = accumulator.get(conference.date) || []
    accumulator.set(conference.date, [...existing, conference])
    return accumulator
  }, new Map())

  const groups = [...dateGroups.entries()]
    .sort(([dateA], [dateB]) => new Date(`${dateA}T12:00:00`) - new Date(`${dateB}T12:00:00`))
    .map(([date, items]) => ({
      key: date,
      date,
      title: getDateGroupTitle(date),
      items: [...items].sort(sortBySchedule),
    }))

  if (completedConferences.length) {
    groups.push({
      key: 'completed',
      date: null,
      title: 'Concluidas',
      isCompletedGroup: true,
      items: [...completedConferences].sort(sortBySchedule),
    })
  }

  return groups
}

function ConferenceList({ conferences, hasConferences, actions = {} }) {
  if (!conferences.length) {
    return <EmptyState hasConferences={hasConferences} />
  }

  const groupedConferences = groupConferencesByDate(conferences)

  return (
    <section className="conference-list" aria-label="Lista de videoconferencias">
      {groupedConferences.map((group) => (
        <section
          className={group.isCompletedGroup ? 'date-group completed-group' : 'date-group'}
          key={group.key}
          aria-label={group.isCompletedGroup ? 'Videoconferencias concluidas' : `Videoconferencias de ${formatDatePtBr(group.date)}`}
        >
          <header className="date-group-header">
            <div>
              <p className="eyebrow">{group.isCompletedGroup ? 'Finalizadas' : 'Data'}</p>
              <h3>{group.title}</h3>
            </div>
            <span>
              {group.items.length} {group.items.length === 1 ? 'videoconferencia' : 'videoconferencias'}
            </span>
          </header>
          <div className="date-group-items">
            {group.items.map((conference) => (
              <ConferenceCard key={conference.id} conference={conference} {...actions} />
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

export default ConferenceList
