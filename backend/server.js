import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

import adminLogin from './api/admin-login.js'
import adminLogout from './api/admin-logout.js'
import acompanhamento from './api/acompanhamento.js'
import auditoria from './api/auditoria.js'
import solicitacoes from './api/solicitacoes.js'
import aprovarSolicitacao from './api/solicitacoes/[id]/aprovar.js'
import rejeitarSolicitacao from './api/solicitacoes/[id]/rejeitar.js'
import status from './api/status.js'
import videoconferencias from './api/videoconferencias.js'
import videoconferenciaPorId from './api/videoconferencias/[id].js'
import { closeDatabase, initializeDatabase } from './database/database.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.resolve(currentDir, '../frontend/dist')
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false)

app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'SAMEORIGIN')
  response.setHeader('Referrer-Policy', 'same-origin')
  next()
})
app.use(express.json({ limit: '1mb' }))

const route = (handler, withId = false) => async (request, response, next) => {
  if (withId) {
    Object.defineProperty(request, 'query', {
      value: { ...request.query, id: request.params.id },
      configurable: true,
      enumerable: true,
    })
  }

  try {
    await handler(request, response)
  } catch (error) {
    next(error)
  }
}

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'sisvc' })
})
app.get('/api/acompanhamento', route(acompanhamento))
app.get('/api/status', route(status))
app.post('/api/admin-login', route(adminLogin))
app.post('/api/admin-logout', route(adminLogout))
app.get('/api/auditoria', route(auditoria))
app.get('/api/solicitacoes', route(solicitacoes))
app.post('/api/solicitacoes', route(solicitacoes))
app.patch('/api/solicitacoes/:id/aprovar', route(aprovarSolicitacao, true))
app.patch('/api/solicitacoes/:id/rejeitar', route(rejeitarSolicitacao, true))
app.get('/api/videoconferencias', route(videoconferencias))
app.post('/api/videoconferencias', route(videoconferencias))
app.patch('/api/videoconferencias/:id', route(videoconferenciaPorId, true))
app.delete('/api/videoconferencias/:id', route(videoconferenciaPorId, true))

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Rota da API nao encontrada.' })
})

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    etag: true,
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  }))

  app.use((request, response, next) => {
    if (request.method !== 'GET') return next()
    return response.sendFile(path.join(frontendDist, 'index.html'))
  })
} else {
  console.warn('Frontend nao compilado. Execute npm run build antes de iniciar em producao.')
}

app.use((error, _request, response, _next) => {
  console.error('Erro nao tratado:', error)
  if (response.headersSent) return
  const statusCode = error instanceof SyntaxError ? 400 : 500
  response.status(statusCode).json({
    error: statusCode === 400 ? 'JSON invalido.' : 'Erro interno do servidor.',
  })
})

if (process.env.NODE_ENV === 'test') {
  console.warn('NODE_ENV=test: inicializacao do PostgreSQL ignorada para teste isolado.')
} else {
  await initializeDatabase()
  console.log('PostgreSQL conectado e esquema verificado.')
}

const server = app.listen(port, host, () => {
  console.log(`SISVC interno em http://${host}:${port}`)
})

async function shutdown(signal) {
  console.log(`${signal} recebido; encerrando o SISVC.`)
  server.close(async () => {
    await closeDatabase()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
