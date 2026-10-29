# SISVC-IDEIA-001 — Investigação de requisitos

**Estado:** EM ENTREVISTA, sem aprovação para implementação.
**Data de abertura:** 2026-10-29.
**Método:** perguntas progressivas; registrar cada resposta, conflito, decisão e evidência. Não inferir fatos sobre produção.

## Fatos informados pelo responsável
- O SISVC recebe solicitações de videoconferência, que operadores aprovam ou rejeitam.
- **Decisão de 2026-10-29:** o operador recebe a solicitação pelo Telegram e aprova ou recusa na própria mensagem. **Essa é a única confirmação humana do fluxo nominal**. A aprovação válida atualiza o SISVC e inicia a automação do Webex; a recusa atualiza o SISVC e não agenda.
- A integração do Telegram faz parte do fluxo obrigatório desta ideia, não de uma fase opcional futura.
- Uma aprovação no SISVC atualiza automaticamente a informação persistida do chamado.
- O agendamento de reuniões Webex é feito no navegador com conta institucional.
- Há um computador Ubuntu de uso compartilhado, com utilização leve durante o expediente e desligamento habitual ao fim do dia.
- A intenção é automatizar a criação da reunião, registrar o link no SISVC e enviar convites aos e-mails informados.
- Deseja operação com mínima interferência visual; um indicador do estado do robô é desejável.
- Preferência por ferramentas gratuitas, sem necessidade de IA.

## Fatos verificados no repositório (versão de portfólio)
- Backend Node.js/Express, frontend React/Vite, PostgreSQL, Apache e systemd.
- Existem handlers de solicitação, aprovação, rejeição e auditoria.
- O schema apresenta um campo opcional email_responsavel, mas não um cadastro estruturado de múltiplos convidados.
- O repositório é versão de portfólio: a correspondência com a instalação institucional deve ser conferida.

## Perguntas de investigação (uma de cada vez)
**Q01 — Confirmação humana (RESPONDIDA):** o operador decide no Telegram. Se aprovar, o SISVC é atualizado e a automação Webex deve começar sem nova confirmação humana; se recusar, não há agendamento. Uma falha técnica pode exigir intervenção excepcional, que não é uma segunda aprovação de rotina.
**Q02 — Destinatários:** de onde virão os e-mails dos participantes (responsável, solicitante, lista de convidados)?
**Q03 — Política de agenda:** quem escolhe conta organizadora, duração, fuso, recorrência, plataforma, sala física, conflitos e alteração/cancelamento?
**Q04 — Operação:** horário permitido, SLA, reinício, ausência de internet, fallback manual, fila acumulada e pausa operacional.
**Q05 — Identidade e segurança:** quais operadores podem autorizar automação, que dados podem ir para Webex, política de credenciais e reautenticação?
**Q06 — Interface:** onde o status será mostrado, quais estados precisam aparecer e que ações humanas serão permitidas?
**Q07 — Webex real:** como a conta agenda hoje, se dispara e-mails e onde aparece o link; autenticação adicional e restrições da organização.
**Q08 — Falha/idempotência:** quando retry é permitido, como comprovar criação, como cancelar ou reagendar sem duplicar.
**Q09 — Qualidade:** métricas, evidências, teste físico no Ubuntu, limites de latência e homologação.
**Q10 — Processo de engenharia:** confirmar o significado de 'CCD' usado pelo responsável e as regras de governança a reaproveitar do JARVIS.

## Log de decisões
- Não registrar uma hipótese como decisão; cada decisão deve identificar pergunta, resposta, data, impacto e critérios de aceite.
- O tipo de projeto está definido como RPA assistido por fila; detalhes de implementação ainda são propostas.
- **Q01 — Registrada em 2026-10-29:** Telegram é o canal da decisão humana. APROVAR = persistir aprovação no SISVC e enfileirar Webex; RECUSAR = persistir recusa e não enfileirar. **Não há aprovação em duas etapas.** A autenticação/autorização do operador pelo bot e as condições de elegibilidade precisam de definição e validação.
- Escolhas relevantes devem produzir um ADR antes da implementação.

## Bloqueio para implementar
Não iniciar alterações de produção antes de responder as perguntas que mudam regras, aprovar a especificação, checar acesso institucional e validar o protótipo.