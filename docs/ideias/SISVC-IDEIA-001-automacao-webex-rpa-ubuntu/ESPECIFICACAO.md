# SISVC-IDEIA-001 — Especificação preliminar

**Status:** RASCUNHO / NÃO APROVADA PARA CÓDIGO.
**Legenda:** CONFIRMADO = relato ou código consultado; PROPOSTO = sujeito a aprovação; PENDENTE = precisa de resposta.

## Problema e resultado esperado
Após aprovação de uma solicitação Webex, realizar agendamento e devolver link e estado ao SISVC, reduzindo intervenção manual, sem comprometer a operação compartilhada do Ubuntu.

## Funcionalidades propostas (a validar)
- RF-01: reconhecer solicitação elegível à automação após aprovação no SISVC.
- RF-02: criar tarefa persistente associada à solicitação, no máximo uma por evento de aprovação.
- RF-03: worker autenticar-se perante backend e assumir tarefas, com estados e auditoria.
- RF-04: no Webex, criar reunião com título, data, horário, fuso e participantes validados.
- RF-05: registrar link e identificador da reunião, confirmação e resultado no SISVC.
- RF-06: operador visualizar progresso e motivo de falha sem interromper seu painel.
- RF-07: reiniciar a estação Ubuntu e recuperar fila sem perder solicitações.
- RF-08: permitir tratamento manual quando sessão expirar ou resultado da criação for incerto.
- RF-09: registrar, quando aplicável, prova do envio de convites sem revelar dados pessoais nos logs.

## Restrições propostas — DEVE
- DEVE preservar autorização e regras de conflito do SISVC.
- DEVE revalidar status e permissões ao assumir tarefa, antes de agendar.
- DEVE possuir trilha de auditoria da decisão, execução e resultado.
- DEVE lidar com indisponibilidade do Ubuntu, falha de rede e sessão expirada.
- DEVE impedir reexecução automática quando não houver prova de que a reunião não foi criada.
- DEVE manter segredos fora do repositório e preservar dados institucionais.

## Restrições propostas — NÃO PODE
- NÃO PODE publicar banco de dados ou navegador automatizado diretamente na internet.
- NÃO PODE reutilizar automaticamente credenciais de operadores sem autorização, nem contornar MFA/CAPTCHA.
- NÃO PODE marcar reunião como criada apenas porque o formulário Webex foi enviado.
- NÃO PODE disparar novas tentativas indefinidamente após falha ou potencial duplicidade.
- NÃO PODE gerar reuniões para solicitações rejeitadas/canceladas.
- NÃO PODE assumir que a instalação de produção tem a mesma stack do portfólio sem conferir.
- NÃO PODE permitir ao robô tomar o foco do painel de trabalho compartilhado como fluxo normal.

## Critérios de aceite iniciais (pendentes de alinhamento)
- AC-01: dado um chamado Webex elegível e aprovado, a fila recebe exatamente uma tarefa.
- AC-02: dado um chamado rejeitado, nenhuma tarefa Webex é criada.
- AC-03: dado Webex confirmado, o SISVC armazena link e referência da reunião com auditoria.
- AC-04: dada sessão expirada, a tarefa fica aguardando autenticação humana e não é marcada concluída.
- AC-05: dado timeout após submissão incerta, a tarefa exige reconciliação antes de repetir.
- AC-06: dado desligamento Ubuntu, tarefas persistem e podem ser retomadas após reinício.
- AC-07: dado painel operacional aberto, worker headless não assume seu navegador.

## Fora do escopo V1, salvo nova decisão
- Implementar Telegram, classificação por IA/JEV, automatização de outras plataformas.
- Prometer agendamento 24 horas por dia quando a estação é desligada ao fim do expediente.
- Remover autenticação ou validação institucional.

## Pendências que bloqueiam aprovação
Definir elegibilidade e segunda confirmação; destinatários; políticas de agendamento/reagendamento; envio real de convites; operação fora do expediente; confirmação da implantação; critérios quantitativos de qualidade.