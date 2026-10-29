# SISVC-IDEIA-001 — Investigação de requisitos

**Estado:** EM ENTREVISTA, sem aprovação para implementação.
**Data de abertura:** 2026-10-29.
**Método:** perguntas progressivas; registrar cada resposta, conflito, decisão e evidência. Não inferir fatos sobre produção.

## Fatos informados pelo responsável
- O SISVC recebe solicitações de videoconferência, que operadores aprovam ou rejeitam.
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
**Q01 — Escopo da execução (PENDENTE):** após aprovar um chamado Webex, o robô deve agendar sempre, ou há casos que exigem segunda confirmação humana?
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
- Escolhas relevantes devem produzir um ADR antes da implementação.

## Bloqueio para implementar
Não iniciar alterações de produção antes de responder as perguntas que mudam regras, aprovar a especificação, checar acesso institucional e validar o protótipo.