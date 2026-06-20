# Banco de dados

## Visão geral

O SisVC usa PostgreSQL. O schema canônico está em [backend/database/schema.sql](../backend/database/schema.sql) e pode ser aplicado repetidamente sem recriar tabelas existentes.

## Modelo

```text
solicitacoes 1 ───── 0..N videoconferencias
                            
audit_logs registra ações sobre as entidades
```

## Tabela `solicitacoes`

Armazena pedidos enviados pelo formulário público.

Campos principais:

| Campo | Finalidade |
| --- | --- |
| `id` | Chave primária |
| `nome` | Nome informado pelo solicitante |
| `nip` | Identificador funcional |
| `setor` | Área responsável |
| `contato` / `email_responsavel` | Canais de contato |
| `nome_videoconferencia` | Título solicitado |
| `data` / `horario` | Data e hora desejadas |
| `status` | `pendente`, `aprovada` ou `rejeitada` |
| `motivo_rejeicao` | Justificativa administrativa |
| `criado_em` / `atualizado_em` | Controle temporal |

## Tabela `videoconferencias`

Representa os itens da agenda.

| Campo | Finalidade |
| --- | --- |
| `id` | Chave primária |
| `solicitacao_id` | Referência opcional à solicitação de origem |
| `nome` / `plataforma` | Identificação do evento |
| `data` / `data_fim` / `horario` | Período agendado |
| `concluida` | Estado operacional |
| `recurrence_group_id` | Agrupa ocorrências de uma série |
| `recurrence_type` | Tipo de recorrência |
| `criado_em` / `atualizado_em` | Controle temporal |

## Tabela `audit_logs`

Registra ações administrativas relevantes.

| Campo | Finalidade |
| --- | --- |
| `acao` | Operação executada |
| `entidade` / `entidade_id` | Alvo da ação |
| `usuario` | Identificador administrativo |
| `detalhes` | Snapshot JSONB do contexto |
| `criado_em` | Data e hora do evento |

## Índices

O schema inclui índices para:

- status e criação das solicitações;
- detecção de duplicidade pendente;
- ordenação e conflitos de agenda;
- busca cronológica e por entidade na auditoria.

## Conexão

A aplicação lê `DATABASE_URL` e configura um pool do driver `pg`. Interpolações usam parâmetros posicionais, evitando concatenar valores diretamente no SQL.

Exemplo local:

```env
DATABASE_URL=postgresql://app_user:change_me@127.0.0.1:5432/app_db
DB_SSL=false
DB_POOL_MAX=10
```

## Estratégia de backup e importação

- Backups nunca são versionados.
- A exportação controlada gera JSON com formato e versão explícitos.
- A importação valida formato, exige confirmação e roda em transação.
- O importador preserva IDs, reajusta sequences e compara contagens.
- Em produção, recomenda-se também `pg_dump` em formato customizado.
- Cópias devem ficar criptografadas, com retenção e teste periódico de restauração.

## Cuidados com dados pessoais

Solicitações podem conter identificadores, nomes e contatos. Portanto:

- use somente dados sintéticos em desenvolvimento;
- limite acesso ao banco e aos backups;
- não anexe dumps a issues ou pull requests;
- remova dados de logs de diagnóstico;
- defina retenção e descarte;
- trate exportações como informação sensível.
