import { ArrowLeft, LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import { apiFetch } from '../utils/apiClient'

function AdminLogin() {
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setError('')

      // Envia usuario e senha para a API, evitando deixar a senha no codigo do navegador.
      const response = await apiFetch('/api/admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Usuario ou senha invalidos.')
        return
      }

      // Guarda apenas a sessao local do navegador para liberar as telas administrativas.
      sessionStorage.setItem('adminAuthenticated', 'true')
      navigate('/admin')
    } catch {
      setError('Nao foi possivel conectar com a API de login.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <Link className="back-link" to="/">
          <ArrowLeft size={17} />
          Voltar
        </Link>
        <p className="eyebrow">Area restrita</p>
        <h1>Login Administrativo</h1>
        <ErrorMessage message={error} />
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            Usuario
            <input value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" />
          </label>
          <label className="form-field">
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="button primary" type="submit">
            <LogIn size={18} />
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminLogin
