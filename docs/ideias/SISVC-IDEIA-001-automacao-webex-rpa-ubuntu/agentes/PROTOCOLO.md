# PROTOCOLO — Execução da equipe e handoffs

**Status:** documentação para configuração posterior, **não é orquestração ativa**.

## 1. Entrada da equipe
O ORQUESTRADOR recebe um pedido de desenvolvimento com ID `SISVC-IDEIA-001`, lê os arquivos da pasta da ideia, confere branch/worktree, verifica pendências e monta a primeira Work Order pequena. Não iniciar desenvolvimento a partir de suposições ainda não validadas.

## 2. Decisão e responsabilidades
- ORQUESTRADOR: autoriza escopo e etapa, coordena e registra. **Nunca desenvolve ou faz deploy.**
- DESENVOLVEDOR: identifica, executa **RED → GREEN → REFACTOR**, testa e relata. Só trabalha na Work Order aprovada.
- REVISOR: revisa de forma independente, aprova/corrige o input local, ou escala ao ORQUESTRADOR mudanças de escopo.
- PROPRIETÁRIO: decide **somente o gate final de deploy**. Não é o operador de aprovações de chamados Telegram.

## 3. Ciclo de desenvolvimento

```text
ORQUESTRADOR → Work Order (escopo, contratos, critérios)
       ↓
DESENVOLVEDOR → IDENTIFICAÇÃO → RED → GREEN → REFACTOR
       ↓
REVISOR independente
       ├─ PASS → ORQUESTRADOR aprova etapa → próxima tarefa
       ├─ REWORK LOCAL → aprova novo input → DESENVOLVEDOR reinicia IDENTIFICAÇÃO
       └─ MUDANÇA DE ESCOPO/BLOCKER → ORQUESTRADOR decide redesign ou BLOQUEAR
       ↓
Candidato de release (sem deploy)
       ↓
GATE HUMANO FINAL (aprovado/recusado/devolver)
```

**A correção aprovada pelo REVISOR só dispensa uma autorização adicional do ORQUESTRADOR quando for estritamente local e dentro do escopo.** O ORQUESTRADOR supervisiona por logs e aprova a promoção da etapa. Alterações materiais sempre exigem nova Work Order do ORQUESTRADOR.

## 4. Work Order (input obrigatório)

```text
WORK_ORDER_ID: <ex. SISVC-IDEIA-001-T001>
AGENTE_DESTINO: DESENVOLVEDOR
OBJETIVO: <resultado mensuravel>
REFERENCIAS: <spec, requisitos RF, criterios AC, ADR>
ESCOPO_PERMITIDO: <pastas/arquivos/contratos>
FORA_DO_ESCOPO: <proibicoes concretas>
PRECONDICOES: <acessos/ambiente>
TESTES: <casos RED, unit/integracao/e2e necessários>
GIT: <branch/worktree isolada e permissao de commit>
GATE: <qual prova autoriza avançar>
LIMITE_CORRECOES: <proposta inicial 3, configuravel>
```

## 5. Registro de progresso e tratamento de falhas

- A decisão do REVISOR sempre identifica `WORK_ORDER_ID`, tentativa, severidade e arquivos/testes relevantes.
- Em cada rework: preservar diagnóstico anterior, novo input, nova identificação e evidências RED/GREEN/REFACTOR.
- 3 correções locais sem solução (limite inicial proposto): bloquear looping e encaminhar ao ORQUESTRADOR.
- Regras ainda pendentes na IDEIA-001 (destinatários, sessão Webex, implantação real) precisam de investigação/validação antes de virar comportamento obrigatório.
- Sem teste físico em ambiente permitido: marcar `NAO_VALIDADO` e apresentar bloqueio, não falsificar PASS.

## 6. Regras de segurança e custo
- Sem credenciais, dados de produção, links internos reais ou cópias do perfil de navegador em Git, outputs ou prompts.
- Um escritor por worktree; revisão independente.
- Evitar uso de agentes para tarefas triviais que comandos/testes determinísticos resolvem.
- Nenhum agente pode publicar em produção, autorizar reunião real Webex ou aprovar chamado operacional no Telegram.
- Novos custos, serviços, acessos, alterações de segurança ou ações institucionais reais: não presumir autorização automática.

## 7. Pacote de entrega ao gate final

Deve conter:
1. Escopo e decisões de produto/arquitetura efetivamente aprovadas.
2. Relatório de tarefas concluídas, commits, branch e PR candidato.
3. Evidência de testes RED/GREEN/REFACTOR e regressão; E2E físico e ambiente quando houver.
4. Findings e correções do REVISOR; riscos e limitações remanescentes.
5. Plano de deploy, verificação pós-deploy e rollback.
6. Decisão solicitada: **APROVAR DEPLOY | DEVOLVER PARA CORREÇÃO | RECUSAR**.

**Se o pacote não estiver completo ou tiver riscos bloqueantes, o ORQUESTRADOR não deve apresentá-lo como pronto para deploy.**
