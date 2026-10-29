# SISVC-IDEIA-001 — Especificação preliminar

**Status:** RASCUNHO / NÃO APROVADA PARA CÓDIGO.
**Legenda:** CONFIRMADO = relato ou código consultado; PROPOSTO = sujeito a aprovação; PENDENTE = precisa de resposta.

## Problema e resultado esperado
O operador recebe a solicitação Webex no Telegram e escolhe **Aprovar** ou **Recusar**. Uma aprovação válida é registrada no SISVC e dispara o agendamento no Ubuntu/Webex **sem segunda confirmação humana**; uma recusa é registrada e não dispara o agendamento. O robô retorna link e estado ao SISVC, sem comprometer a operação compartilhada do Ubuntu.

## Funcionalidades propostas (a validar)
- RF-01: notificar pelo Telegram o operador cadastrado e autorizado quando houver solicitação Webex elegível.
- RF-02: receber decisão Aprovar/Recusar pelo Telegram, validando conta vinculada, identidade, permissão, estado do pedido e validade da ação.
- RF-03: na aprovação válida, atualizar estado no SISVC e criar uma única tarefa persistente de agendamento, sem segunda confirmação. Na recusa, registrar decisão no SISVC sem criar tarefa.
- RF-04: worker autenticar-se perante backend e assumir tarefas, com estados e auditoria.
- RF-05: no Webex, criar reunião com título, data, horário, fuso e participantes validados.
- RF-06: registrar link e identificador da reunião, confirmação e resultado no SISVC.
- RF-07: operador visualizar progresso e motivo de falha sem interromper seu painel.
- RF-08: reiniciar a estação Ubuntu e recuperar fila sem perder solicitações.
- RF-09: permitir tratamento manual quando sessão expirar ou resultado da criação for incerto.
- RF-10: registrar, quando aplicável, prova do envio de convites sem revelar dados pessoais nos logs.

## Restrições propostas — DEVE
- DEVE preservar autorização e regras de conflito do SISVC.
- DEVE tratar aprovação no Telegram como a única confirmação humana do fluxo nominal e refletir no SISVC o operador, a ação e o instante da decisão.
- DEVE correlacionar cada ação Telegram ao chamado correto e rejeitar comandos de contas não vinculadas/autorizadas, obsoletos ou repetidos.
- DEVE manter consistência transacional entre aprovação e criação da tarefa Webex.
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
- NÃO PODE exigir uma segunda confirmação humana rotineira após Aprovar no Telegram.
- NÃO PODE aceitar aprovação apenas por telefone enviado em mensagem ou dados de um callback sem validar operador e estado do chamado.
- NÃO PODE criar duas tarefas/reuniões por cliques duplicados no Telegram ou callbacks repetidos.
- NÃO PODE assumir que a instalação de produção tem a mesma stack do portfólio sem conferir.
- NÃO PODE permitir ao robô tomar o foco do painel de trabalho compartilhado como fluxo normal.

## Critérios de aceite iniciais (pendentes de alinhamento)
- AC-01: dado pedido Webex elegível notificado via Telegram, quando operador autorizado aprova, o SISVC registra a decisão e a fila recebe exatamente uma tarefa **sem segundo gate humano**.
- AC-02: dado pedido recusado via Telegram, o SISVC registra a recusa e nenhuma tarefa Webex é criada.
- AC-02A: dado callback repetido, expirado ou conta Telegram não autorizada, nenhuma nova decisão/tarefa indevida é criada.
- AC-03: dado Webex confirmado, o SISVC armazena link e referência da reunião com auditoria.
- AC-04: dada sessão expirada, a tarefa fica aguardando autenticação humana e não é marcada concluída.
- AC-05: dado timeout após submissão incerta, a tarefa exige reconciliação antes de repetir.
- AC-06: dado desligamento Ubuntu, tarefas persistem e podem ser retomadas após reinício.
- AC-07: dado painel operacional aberto, worker headless não assume seu navegador.

## Fora do escopo V1, salvo nova decisão
- Classificação por IA/JEV e automatização de outras plataformas. **Telegram está no escopo obrigatório** como canal da decisão de aprovação/recusa.
- Prometer agendamento 24 horas por dia quando a estação é desligada ao fim do expediente.
- Remover autenticação ou validação institucional.

## Pendências que bloqueiam aprovação
Definir critérios de elegibilidade; vinculação e permissão dos operadores Telegram; destinatários; políticas de agendamento/reagendamento; envio real de convites; operação fora do expediente; confirmação da implantação; critérios quantitativos de qualidade. **A inexistência de segunda confirmação humana já está decidida.**