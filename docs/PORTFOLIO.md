# Apresentação de portfólio

## Descrição curta

Desenvolvi o SisVC, uma aplicação full stack para gerenciar solicitações e agenda de videoconferências. O projeto cobre desde formulários e painel administrativo até banco PostgreSQL, auditoria e deploy em servidor Linux.

## Stack

- React, Vite e React Router
- Node.js e Express
- PostgreSQL e SQL parametrizado
- Apache HTTP Server
- systemd
- npm workspaces e Node Test Runner

## Desafios técnicos

- Adaptar handlers serverless para um processo Express persistente.
- Entregar frontend e API pela mesma origem.
- Modelar solicitações, agenda, recorrência e auditoria.
- Configurar PostgreSQL com SCRAM-SHA-256 e acesso somente local.
- Automatizar a criação do schema e a importação transacional.
- Diagnosticar proxy, autenticação do banco, systemd e reverse proxy.
- Publicar uma versão demonstrável sem dados ou referências do ambiente real.

## Responsabilidades realizadas

- Organização do monorepo em frontend e backend.
- Implementação e manutenção de rotas REST.
- Validação de entrada e prevenção de registros duplicados.
- Autenticação com sessão assinada e cookie HttpOnly.
- Construção de componentes, filtros e formulários React.
- Modelagem e documentação PostgreSQL.
- Criação de arquivos Apache e systemd.
- Escrita de testes, smoke test e documentação operacional.
- Sanitização do repositório para exposição pública.

## O que aprendi

- Diferenças entre serverless e processos persistentes.
- Operação de aplicações Node em Linux.
- Diagnóstico por camadas: rede, proxy, aplicação e banco.
- Importância de schemas repetíveis, backups testados e logs úteis.
- Como transformar problemas reais de deploy em documentação reutilizável.
- Como equilibrar simplicidade operacional e segurança.

## Resultados

- Fluxo completo de solicitação, decisão administrativa e agenda.
- Build reproduzível com `npm ci` e `npm run build`.
- Processo supervisionado pelo systemd.
- API e frontend publicados por reverse proxy.
- Banco isolado da rede externa.
- Documentação suficiente para outro desenvolvedor compreender e executar o projeto.

## Texto curto para LinkedIn

> Desenvolvi uma aplicação full stack para gestão de solicitações e agenda de videoconferências usando React, Node.js, Express e PostgreSQL. Além das funcionalidades de negócio, adaptei a aplicação de serverless para servidor Linux, configurei Apache como reverse proxy, systemd para supervisão e PostgreSQL com autenticação SCRAM-SHA-256. O projeto também inclui auditoria, importação transacional, testes e documentação completa de arquitetura, segurança e troubleshooting.

Todos os dados, endereços e referências presentes nesta versão são fictícios e próprios para demonstração.
