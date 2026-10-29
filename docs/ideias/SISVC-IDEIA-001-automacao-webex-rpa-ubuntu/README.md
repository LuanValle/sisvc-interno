# SISVC-IDEIA-001 — Automação Webex via Ubuntu

**Status:** INVESTIGAÇÃO EM ANDAMENTO — sem implementação.

Esta pasta agrupa os documentos da ideia. O código de produção, quando aprovado, permanecerá nas pastas de aplicação (backend/frontend/worker) e não será implementado dentro de `docs/`.

## Documentos

- [SISVC-IDEIA-001 — Documento principal](./SISVC-IDEIA-001-automacao-webex-rpa-ubuntu.md): objetivo, restrições e proposta geral.
- [INVESTIGACAO.md](./INVESTIGACAO.md): fatos, perguntas, respostas e decisões.
- [ARQUITETURA.md](./ARQUITETURA.md): componentes, fronteiras, responsabilidades e fluxo.
- [ESPECIFICACAO.md](./ESPECIFICACAO.md): o que deve fazer, o que não pode fazer e critérios de aceite.
- [PLANO-TDD.md](./PLANO-TDD.md): SDD, ciclos RED/GREEN/REFACTOR, testes e gates.

## Decisão registrada: 2026-10-29

Um operador autorizado recebe o chamado pelo **Telegram** e seleciona **Aprovar** ou **Recusar**. Trata-se da **única confirmação humana rotineira**. Aprovar atualiza o SISVC e enfileira a criação Webex pelo robô Ubuntu; recusar registra a recusa e não aciona o robô. A identidade/permissões do operador e a validade do chamado devem ser verificadas pelo backend. Intervenções em falhas técnicas são exceções, não segunda aprovação.

## Próxima pergunta da entrevista

Definir os destinatários dos convites Webex: apenas o responsável já cadastrado ou uma lista de participantes informados na solicitação.

**Regra de governança:** documentos ainda são rascunhos. Não considerar requisitos adicionais aprovados antes da entrevista, análise, testes e homologação.
