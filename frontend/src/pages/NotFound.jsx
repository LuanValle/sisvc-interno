import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="entry-page">
      <section className="entry-hero compact">
        <h1>Página não encontrada</h1>
        <p>A rota solicitada não existe neste sistema.</p>
        <Link className="button primary" to="/">
          Voltar para início
        </Link>
      </section>
    </main>
  )
}

export default NotFound
