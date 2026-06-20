import assert from 'node:assert/strict'
import test from 'node:test'
import { isAdminAuthenticated, setAdminCookie } from '../api/_auth.js'

test('sessao administrativa assinada e aceita', () => {
  process.env.ADMIN_SESSION_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres'
  const headers = {}

  setAdminCookie({
    setHeader(name, value) {
      headers[name] = value
    },
  })

  const cookie = headers['Set-Cookie'].split(';')[0]
  assert.equal(isAdminAuthenticated({ headers: { cookie } }), true)
})

test('sessao administrativa forjada e rejeitada', () => {
  process.env.ADMIN_SESSION_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres'
  assert.equal(
    isAdminAuthenticated({ headers: { cookie: 'admin_session=token.forjado' } }),
    false,
  )
})
