# SISVC-IDEIA-001 — Arquitetura proposta

**Status:** RASCUNHO PARA DISCUSSÃO — não aprovado; sem implementação.

## Contexto
Separar a lógica de solicitações/aprovações do SISVC do executor de navegador no Ubuntu, sem exigir acesso direto do robô ao banco.

## Componentes e fronteiras
1. **Frontend SISVC:** criar solicitação, aprovar/rejeitar, observar estado da automação e consultar link.
2. **Backend Express:** autenticação, regras de negócio, fila persistente, autorização das tarefas, auditoria e atualização dos resultados.
3. **PostgreSQL:** fonte de verdade para solicitações, reuniões e tarefas. Verificar correspondência com a implantação real.
4. **Worker Ubuntu (Node.js):** inicia chamadas HTTPS autenticadas para retirar tarefas e informar status; não recebe conexões externas e não acessa diretamente o banco.
5. **Adaptador Webex (Playwright):** navegador isolado, sessão institucional validada, criação de reunião e captura do link.
6. **Indicador local opcional:** mostra estado do robô sem assumir o foco do painel operacional.

## Fluxo nominal
Solicitação → aprovação SISVC → tarefa PENDENTE → worker assume → AGENDANDO → Webex cria reunião → captura link e confirmação de convidados → SISVC atualiza reunião e tarefa CONCLUIDA → interface informa resultado.

## Estados sugeridos para a tarefa
- PENDENTE: aguardando worker.
- EM_EXECUCAO: reservada e sendo executada por um worker.
- AGUARDANDO_AUTENTICACAO: a sessão Webex necessita intervenção humana.
- REVISAR_MANUALMENTE: resultado incerto ou necessidade de verificação antes de retry.
- FALHA_RECUPERAVEL: erro transitório comprovado, com retentativa controlada.
- CONCLUIDA: criação confirmada com referência/link persistidos.
- CANCELADA: tarefa retirada por regra explícita.

**Separação obrigatória proposta:** a aprovação do chamado e o estado do agendamento Webex são conceitos distintos.

## Propriedades arquiteturais a validar
- Guardar uma tarefa por solicitação elegível; reserva atômica para impedir dois workers simultâneos.
- Confirmar se a reunião existe antes de qualquer retry após timeout da interface; prevenir duplicidade no Webex.
- Worker desconectado não implica perda de tarefa; computador pode ficar desligado fora do expediente.
- O processo pode rodar headless e com sessão protegida; quando houver login/MFA, pedir ação humana autorizada.
- Nunca incluir credenciais, cookies, links institucionais ou dados reais no Git.
- A API fica na rede interna; worker acessa somente endpoints autenticados e limitados.
- Decisão de envio de convites deve respeitar destinatários validados e controles institucionais.

## Comparação de abordagens (pendente de ADR)
- **Playwright no Ubuntu:** menor dependência de API institucional, mas frágil diante de alterações na interface e login.
- **API Webex oficial:** potencialmente mais robusta; requer verificar autorização, escopos e elegibilidade da conta.
- **Automação desktop com foco na janela:** incompatível com a exigência de não atrapalhar o computador compartilhado; evitar como padrão.

## Organização do código quando aprovado
- backend/automation/: orquestração da fila e contratos internos.
- worker-webex/: processo isolado, cliente da API e adaptador Playwright.
- frontend/: visualização de estado e operações de supervisão.
- backend/tests/ e worker-webex/tests/: testes objetivos por camada.

## Governança
Referência metodológica: JARVIS AGENTS.md e Constitution — especificação, esclarecimento, plano, tarefas, análise e implementação; decisões materiais registradas em ADR. Este documento ainda não define tarefas de execução.