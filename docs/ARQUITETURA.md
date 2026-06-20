# Arquitetura

## Visão geral

O SisVC usa uma arquitetura web em camadas, implantada em uma única VM Linux. O desenho privilegia simplicidade operacional, separação de responsabilidades e baixa superfície de exposição.

```text
Navegador
   │ HTTP/HTTPS
   ▼
Apache HTTP Server
   │ reverse proxy
   ▼
Node.js / Express
   ├── /api/*          regras de negócio
   └── /*              build React/Vite
   │
   ▼
PostgreSQL
```

## Componentes

### Frontend

O frontend está em `frontend/` e usa React com Vite. Ele concentra:

- formulários e validações de experiência do usuário;
- painel administrativo;
- agenda, filtros e paginação;
- mapeamento entre o formato da API e os componentes;
- exportações CSV/JSON.

No desenvolvimento, o Vite encaminha `/api` para o Express. Em produção, o build em `frontend/dist` é entregue pelo próprio backend.

### Backend

O backend está em `backend/` e usa Express. Ele concentra:

- autenticação administrativa;
- criação e consulta de solicitações;
- aprovação e rejeição;
- CRUD da agenda;
- recorrência de eventos;
- auditoria;
- inicialização idempotente do schema.

Os handlers em `backend/api/` foram adaptados de funções serverless para um processo persistente, preservando a lógica de negócio.

### Banco de dados

O PostgreSQL armazena solicitações, eventos e auditoria. A aplicação usa pool de conexões e templates SQL parametrizados. O banco escuta somente no loopback no cenário de VM única.

### Apache

O Apache é o ponto público da aplicação. Ele:

- recebe HTTP/HTTPS;
- preserva o host original;
- encaminha requisições para `127.0.0.1:3000`;
- mantém logs de acesso e erro separados;
- permite adicionar TLS sem expor o processo Node diretamente.

### systemd

O serviço systemd executa a aplicação com usuário sem privilégios, reinicia o processo em falhas e centraliza os logs no journal.

## Fluxo de solicitação

```text
Formulário público
   ↓
POST /api/solicitacoes
   ↓
Validação e persistência
   ↓
Painel administrativo
   ├── PATCH /aprovar → cria evento relacionado
   └── PATCH /rejeitar → registra justificativa
   ↓
Registro de auditoria
```

## Fluxo de autenticação

1. O administrador envia usuário e senha por `POST /api/admin-login`.
2. O backend compara as credenciais vindas do ambiente.
3. Uma sessão com expiração é assinada por HMAC.
4. O navegador recebe somente o token em cookie HttpOnly.
5. Rotas protegidas validam assinatura e expiração.

## Limites de rede

```text
0.0.0.0:80/443       Apache — exposto
127.0.0.1:3000       Node — privado
127.0.0.1:5432       PostgreSQL — privado
```

## Estrutura lógica

```text
frontend/src/pages       telas e coordenação
frontend/src/components  componentes reutilizáveis
frontend/src/utils       API, formatos e validações
backend/api              handlers HTTP
backend/database         conexão e schema
backend/scripts          transferência controlada de dados
deploy                   exemplos operacionais
docs                     decisões e procedimentos
```

## Decisões e trade-offs

- Uma VM reduz a complexidade, mas não oferece alta disponibilidade.
- Servir o frontend pelo Express simplifica o deploy, porém acopla a publicação das duas camadas.
- Credenciais administrativas em variáveis de ambiente são adequadas ao escopo atual, mas uma evolução deve usar usuários persistidos e hash de senha.
- O schema idempotente facilita instalação; migrações versionadas são a evolução recomendada.
