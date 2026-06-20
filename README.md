# SisVC — Agendamento de videoconferências

Aplicação full stack para solicitar, aprovar e acompanhar videoconferências. O projeto demonstra a evolução de uma aplicação React com funções serverless para uma arquitetura persistente em servidor Linux, com API Express, PostgreSQL, Apache e systemd.

> Este repositório é uma versão de portfólio. Dados, endereços, credenciais, identidade visual e referências de infraestrutura foram removidos ou substituídos por exemplos.

## Problema resolvido

Equipes que compartilham recursos de videoconferência precisam centralizar solicitações, evitar conflitos de horário e acompanhar aprovações. O SisVC reúne esse fluxo em uma aplicação única, com área pública para solicitações e painel administrativo para gestão e auditoria.

## Funcionalidades

- Solicitação pública de videoconferência com validação de campos.
- Autenticação administrativa por cookie HttpOnly e sessão assinada.
- Aprovação e rejeição com registro do motivo.
- Agenda de reuniões aprovadas, incluindo eventos com vários dias.
- Recorrência semanal, quinzenal e mensal.
- Conclusão, reabertura, edição e exclusão de eventos.
- Busca, filtros, paginação e atualização periódica inteligente.
- Exportação CSV/JSON, impressão e trilha de auditoria.
- Health check em `GET /api/health`.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Lucide React |
| Backend | Node.js 22, Express 5 |
| Banco | PostgreSQL, driver `pg`, SQL parametrizado |
| Infraestrutura | Apache HTTP Server, systemd, Linux |
| Qualidade | Node Test Runner, smoke test, verificação de encoding, npm audit |

## Arquitetura

```text
Usuário
  │ HTTP/HTTPS
  ▼
Apache HTTP Server
  │ reverse proxy
  ▼
Node.js / Express ─────► frontend/dist (React)
  │ SQL parametrizado
  ▼
PostgreSQL local
```

O Apache é a única camada exposta. O Node escuta em `127.0.0.1:3000` e o PostgreSQL em `127.0.0.1:5432`.

Detalhes: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Fluxo principal

1. O usuário envia uma solicitação pelo frontend.
2. A API valida e grava a solicitação como pendente.
3. Um administrador autentica-se e aprova ou rejeita o pedido.
4. A aprovação cria um evento relacionado na agenda.
5. Operações administrativas relevantes geram registros de auditoria.
6. O frontend consulta a API pela mesma origem publicada pelo Apache.

## Destaques técnicos

- Migração de uma aplicação hospedada em Vercel para servidor Linux.
- Adaptação de handlers serverless para um serviço Express persistente.
- Monorepo npm com workspaces para frontend e backend.
- PostgreSQL local com autenticação SCRAM-SHA-256 e acesso restrito ao loopback.
- Apache como reverse proxy e systemd para supervisão do processo.
- Configuração por variáveis de ambiente sem credenciais no código.
- Importação transacional de backup com verificação de contagens.
- Suporte a proxy corporativo no processo de provisionamento.
- Build React/Vite servido pelo próprio Express em produção.
- Sessão assinada, cookie HttpOnly e consultas SQL parametrizadas.

## Estrutura

```text
sisvc-interno/
├── frontend/              # React, Vite e componentes de interface
├── backend/
│   ├── api/               # Handlers e regras de negócio
│   ├── database/          # Pool PostgreSQL e schema idempotente
│   ├── scripts/           # Exportação e importação controladas
│   ├── tests/             # Testes do backend
│   └── server.js          # Servidor Express
├── deploy/                # Exemplos Apache, systemd e provisionamento
├── docs/                  # Arquitetura, deploy, segurança e operação
├── scripts/               # Smoke test e verificações gerais
├── .env.example
└── package.json           # Scripts e workspaces npm
```

## Executar localmente

Requisitos: Node.js 22+, npm 10+ e PostgreSQL.

```bash
git clone https://github.com/LuanValle/sisvc-interno.git
cd sisvc-interno
cp .env.example .env
npm ci
npm run dev
```

Durante o desenvolvimento:

- Frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:3000`
- Health check: `http://127.0.0.1:3000/api/health`

O Vite encaminha `/api` para o Express. Em produção, frontend e API usam a mesma origem.

## Variáveis de ambiente

| Variável | Finalidade |
| --- | --- |
| `NODE_ENV` | Ambiente de execução |
| `HOST` / `PORT` | Interface e porta do Express |
| `DATABASE_URL` | Conexão PostgreSQL |
| `DB_SSL` | Habilita TLS para banco remoto |
| `ADMIN_USER` | Usuário administrativo |
| `ADMIN_PASSWORD` | Senha administrativa |
| `ADMIN_SESSION_SECRET` | Assinatura da sessão |
| `APP_SECURE_COOKIE` | Marca o cookie como `Secure` sob HTTPS |
| `VITE_API_BASE_URL` | Base opcional da API no build |

Use [.env.example](.env.example) como referência e nunca versione `.env`.

## Build e execução

```bash
npm run build
npm start
```

O Vite gera `frontend/dist`. O Express entrega o build e mantém as rotas `/api` no mesmo processo.

## Testes

```bash
npm test
npm run test:smoke -- --base-url=http://127.0.0.1:3000
npm audit
```

`npm test` executa a verificação de encoding, os testes do backend e o build de produção.

## Deploy em VM Linux

O fluxo de referência usa:

1. PostgreSQL restrito a localhost.
2. Aplicação instalada em `/opt/sisvc`.
3. systemd executando `npm start` com usuário sem privilégios.
4. Apache encaminhando requisições para `127.0.0.1:3000`.
5. Firewall expondo apenas HTTP/HTTPS.

Guia completo: [docs/DEPLOY-VM-LINUX.md](docs/DEPLOY-VM-LINUX.md).

## Decisões técnicas

- **Mesma origem para frontend e API:** simplifica cookies e evita CORS desnecessário.
- **Express servindo o build:** reduz componentes operacionais para um projeto de pequeno porte.
- **Schema idempotente:** facilita provisionamento e atualizações repetíveis.
- **Banco não exposto:** reduz a superfície de ataque.
- **Sem PM2:** systemd já fornece reinício, logs e inicialização no boot.
- **Importação transacional:** evita deixar o banco parcialmente carregado.

## Problemas resolvidos no deploy

- Proxy bloqueando downloads do npm e acesso do Git.
- PostgreSQL usando `peer`/`ident` em vez de autenticação por senha.
- Senha criada antes da ativação de SCRAM-SHA-256.
- Caracteres especiais quebrando a URL de conexão.
- Apache exibindo a página padrão em vez do reverse proxy.
- Node acessível localmente, mas indisponível pela rede.
- Serviço systemd falhando por variável ausente no `.env`.

Veja [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Banco de dados](docs/BANCO-DE-DADOS.md)
- [Deploy em VM Linux](docs/DEPLOY-VM-LINUX.md)
- [Segurança](docs/SEGURANCA.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Checklist de homologação](docs/CHECKLIST-HOMOLOGACAO.md)
- [Apresentação de portfólio](docs/PORTFOLIO.md)

## Melhorias futuras

- Testes de integração com PostgreSQL efêmero.
- Rate limiting e bloqueio progressivo no login.
- Gestão de usuários e perfis de acesso.
- HTTPS automatizado e rotação de segredos.
- Pipeline de CI para testes, build e análise estática.
- Observabilidade com métricas e alertas.
- Migrações de banco versionadas.

## Privacidade

Este projeto não inclui dados de produção, backups, credenciais, endereços de rede, domínios privados ou nomes institucionais. Todos os valores presentes na documentação são exemplos reservados para demonstração.
