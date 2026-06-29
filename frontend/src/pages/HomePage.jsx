import { CalendarPlus, SearchCheck, Video } from 'lucide-react'
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="entry-page">
      <section className="entry-hero">
        <div className="entry-brand">
          <div className="entry-logo-frame" aria-hidden="true">
            <div className="entry-logo-mark">
              <Video size={64} strokeWidth={1.8} />
              <strong>SisVC</strong>
              <span>Agendamento de videoconferencias</span>
            </div>
          </div>
        </div>

        <div className="entry-actions entry-actions-primary">
          <Link className="entry-action-card" to="/solicitar">
            <CalendarPlus size={20} />
            <span>Solicitar videoconferencia</span>
          </Link>
          <Link className="entry-action-card entry-action-secondary" to="/acompanhar">
            <SearchCheck size={20} />
            <span>Acompanhar videoconferencias</span>
          </Link>
          <Link className="entry-login-link" to="/admin/login">
            Login administrativo
          </Link>
        </div>
      </section>
    </main>
  )
}

export default HomePage
