# SISVC-IDEIA-001 — Plano de validação e TDD

**Status:** RASCUNHO; nenhum teste executado; nenhuma implementação iniciada.

## Relação entre SDD e TDD
- **SDD (Specification-Driven Development):** primeiro definir o comportamento e o que está fora de escopo; esclarecer; planejar; decompor em tarefas; revisar coerência.
- **TDD (Test-Driven Development):** executar para cada unidade de comportamento aprovada: RED (teste reproduz falha), GREEN (código mínimo para passar), REFACTOR (melhorar estrutura mantendo testes verdes).
- O TDD não substitui teste real do navegador/Webex; ações externas devem ter testes de contrato/mocks e testes de integração/E2E controlados.
- CCD foi citado no debate, mas o significado exato deve ser confirmado antes de incorporar uma regra com essa sigla.

## Ciclos RED → GREEN → REFACTOR propostos
1. Dado pedido Webex elegível, uma notificação é destinada ao operador autorizado no Telegram (mock do Bot API).
2. Dado botão **Aprovar** acionado por operador Telegram autorizado, SISVC registra aprovação e cria exatamente uma tarefa, sem uma segunda confirmação.
3. Dado botão **Recusar**, SISVC registra recusa e nenhuma tarefa Webex é criada.
4. Dado callback repetido, expirado, de operador não autorizado ou para chamado já decidido, nenhuma nova tarefa/decisão é produzida.
5. Duas aprovações concorrentes resultam em uma única tarefa.
6. Worker com credencial válida assume tarefa; sem credencial não tem acesso.
7. Worker indisponível não perde fila; reiniciar conserva tarefas pendentes.
8. Pedido com datas/participantes inválidos é recusado com motivo verificável.
9. Adaptador de Webex simulado cria reunião e devolve link; backend persiste resultado.
10. Timeout após submissão com resultado incerto impede retry cego.
11. Falha de autenticação Webex marca AGUARDANDO_AUTENTICACAO e exige operador.
12. Fluxo completo com Webex de teste real comprova agendamento e captura do link.
13. UI informa estado sem travar ou assumir a sessão de trabalho compartilhada.

## Qualidade e evidências
- Testes unitários: regras de elegibilidade, autorização de operador Telegram, validação de decisões, mudanças de estado e participantes.
- Integração: Bot Telegram (simulado) / API SISVC / worker, persistência, controle de concorrência, auditoria.
- Contrato: esquema da tarefa e comportamento do adaptador Webex.
- E2E controlado: Webex na conta de teste/ambiente autorizado, horários fictícios, confirmar envio de convites quando aplicável.
- Evidências: cenário, data, versão/commit, passos, comportamento esperado, resultado observado, logs saneados.
- RED confirmado exige teste que realmente falhou; GREEN exige evidência dos testes passando, não somente afirmação.

## Gates propostos
- G0: entrevista e regras de elegibilidade aprovadas.
- G1: especificação e ADRs revisados; critérios de aceite testáveis.
- G2: protótipo RPA Webex controlado validado no Ubuntu.
- G3: tarefas TDD e testes de integração verdes.
- G4: demonstração ponta a ponta e homologação humana em ambiente autorizado.

**Proibido declarar PASS antecipadamente.** Documentar sempre as limitações decorrentes de autenticação institucional, indisponibilidade de rede e interface Webex.