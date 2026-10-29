# SISVC-IDEIA-001 — Agendamento automático de videoconferências no Webex via RPA no Ubuntu

- **ID:** SISVC-IDEIA-001
- **Criada em:** 2026-10-29
- **Status:** PROPOSTA — não implementada
- **Prioridade sugerida:** Média/alta (sujeita à validação operacional)
- **Tipo:** Automação / integração / RPA
- **Escopo deste registro:** documentação da ideia; nenhuma alteração de comportamento em produção

## 1. Objetivo

Automatizar o agendamento de reuniões Webex **após o operador aprovar o chamado no Telegram**, utilizando um **robô Playwright + Node.js em uma estação Ubuntu já disponível**. A aprovação no Telegram é a **única confirmação humana** do fluxo nominal; a decisão atualiza o SISVC e, se for de aprovação, inicia o agendamento sem exigir nova autorização. O robô deve configurar a reunião no navegador, adicionar os participantes autorizados, obter o link e devolvê-lo ao SISVC. Sempre que o Webex permitir, deve enviar os convites aos e-mails cadastrados.

**Restrição:** buscar uma solução sem novos custos de licença nem consumo de tokens de IA. Não pressupor disponibilidade de API Webex. Avaliar o RPA primeiro, sem descartar a API oficial como alternativa futura, caso autorizada.

## 2. Contexto atual e premissas a validar

- O repositório de referência `sisvc-interno` documenta React/Vite, Node.js/Express, PostgreSQL e deploy em Linux. **É uma versão de portfólio**, portanto confirmar a correspondência com o SISVC efetivamente instalado antes de implementar.
- O sistema já possui criação e aprovação de solicitações e armazenamento de eventos na agenda.
- A estação de trabalho disponível executa **Ubuntu**, é compartilhada com atividades leves e permanece ligada durante o expediente; costuma ser desligada ao final do dia.
- O agendamento Webex é feito pelo **navegador**, com conta institucional. Hoje as credenciais são preenchidas pelo navegador do operador e ele aciona o login; isso **não garante** que o navegador exclusivo do robô esteja autenticado.
- **Decisão registrada em 2026-10-29:** o operador recebe o pedido no Telegram e escolhe **Aprovar** ou **Recusar**. Se aprovar, o SISVC recebe a decisão e o robô é acionado; se recusar, o SISVC registra a recusa e não executa automação. **Telegram é parte integrante desta ideia**, não uma integração opcional futura.
- O bot consulta atualizações por conexão iniciada da rede interna; uma conta Telegram só pode decidir quando estiver vinculada a um operador autorizado no SISVC.
- Confirmar permissões institucionais e restrições do ambiente Webex antes de executar automação com dados reais.

## 3. Fluxo funcional proposto

1. Solicitante abre um chamado no SISVC com título, data, intervalo de horário, plataforma e e-mails de participantes.
2. O SISVC notifica o operador autorizado pelo bot Telegram, com opções **Aprovar** e **Recusar**.
3. O operador decide **uma única vez no Telegram**. O backend valida a conta vinculada, a autorização e o estado do pedido. **Recusa:** registra no SISVC e encerra sem agendamento. **Aprovação:** registra no SISVC e grava, de modo consistente, **uma única tarefa de agendamento** na fila/outbox. Não há outra etapa de aprovação humana.
4. O **worker** instalado no Ubuntu consulta periodicamente uma API interna autenticada do SISVC por HTTPS (conexão **iniciada pelo worker**, sem expor o computador ao acesso externo).
5. Ao assumir uma tarefa, o worker sinaliza `EM_EXECUCAO`. O Playwright usa um perfil de navegador **separado** para abrir o Webex e preencher os campos necessários.
6. O robô confirma a criação e recolhe o identificador e/ou link da reunião. Verificar se o Webex efetivamente enviou os convites aos participantes.
7. O worker informa o resultado ao SISVC; o backend persiste link, referência da reunião, estado, horário e trilha de auditoria.
8. O painel do SISVC exibe resultado e erros. Em caso de falha, a solicitação segue visível para intervenção humana, sem perder os dados.

### Estados sugeridos

`PENDENTE` → `EM_EXECUCAO` → `CONCLUIDO`; estados alternativos: `AGUARDANDO_LOGIN`, `FALHA_TEMPORARIA`, `REVISAR_MANUALMENTE`.

O status do agendamento no Webex deve ser **separado** do status de aprovação do chamado no SISVC.

## 4. Arquitetura sugerida

```text
SISVC (React)
    |
    v
Backend (Node.js/Express) ---- PostgreSQL
    |       ^                     |
    |       |             decisoes + fila + auditoria
    |   Telegram Bot API (polling, conexao de saida)
    |       |
    |   Operador: APROVAR / RECUSAR (gate humano unico)
    |
    |  API interna HTTPS autenticada
    ^  worker consulta/assume somente tarefas aprovadas
    |
Worker Node.js + Playwright (Ubuntu)
    |
    v
Navegador isolado / sessão institucional Webex
    |
    v
Webex: cria reunião + participantes + convite
    |
    v
Worker informa link e resultado ao SISVC
```

**Não colocar o navegador de automação no servidor do SISVC por padrão.** O servidor mantém a fila e a fonte de verdade; o computador Ubuntu executa somente o worker do navegador.

### Componentes a desenvolver

- **Backend SISVC:** integração do bot Telegram, validação das decisões e operadores, persistência de tarefas, recuperação e reserva de trabalho, atualização de estados, armazenamento de link e erros, auditoria, autorização de acesso do worker.
- **Worker Ubuntu:** cliente da fila, Playwright, perfil persistente dedicado, observabilidade, tratamento de expiração de sessão e retentativas seguras.
- **Interface:** indicador discreto de status (`Disponível`, `Criando reunião #...`, `Criada`, `Necessita intervenção`), sem tomar foco do painel já utilizado; opção de abrir visão detalhada da execução.
- **Operação:** iniciar/reiniciar worker por `systemd`; pausar/resumir processamento; log com rotação; procedimento de reautenticação manual.

## 5. Pontos específicos do código existente

Arquivos de referência na versão de portfólio:

- `backend/api/solicitacoes.js`: inclusão de solicitação.
- `backend/api/solicitacoes/[id]/aprovar.js`: aprovação; ponto de integração com a criação da tarefa.
- `backend/api/solicitacoes/[id]/rejeitar.js`: rejeição.
- `backend/api/videoconferencias.js`: agenda.
- `backend/database/schema.sql`: esquema de persistência.
- `backend/server.js`: rotas do Express.

O esquema atual tem `solicitacoes.email_responsavel` (um e-mail opcional), `videoconferencias.link` e `audit_logs`. **Ainda não há uma lista estruturada de participantes**: modelar e validar os e-mails dos convidados antes de prometer convites a várias pessoas. Preferir tabela própria relacionada à solicitação, se necessário.

**Atenção transacional:** no handler de aprovação de referência, a criação da reunião local e a atualização do status são operações distintas. Antes de acoplar RPA, avaliar transação de banco para aprovação e registro da tarefa; garantir idempotência também sob duas aprovações concorrentes.

## 6. Resiliência, segurança e limites

- **Decisões do Telegram:** vincular conta Telegram e permissão do operador no SISVC; callbacks antigos, repetidos ou não autorizados não podem aprovar nem gerar tarefas. Rejeição não cria tarefa; aprovação válida não exige nova confirmação humana.
- **Não duplicar reuniões:** chave única por solicitação e verificação de agendamento pré-existente. Se o Webex criou a reunião, mas houve falha na captura do link, marcar `REVISAR_MANUALMENTE` e reconciliar antes de repetir.
- **Worker desligado:** manter tarefas pendentes no servidor; processar ao ligar o Ubuntu. Não afirmar disponibilidade fora do expediente.
- **Sessão:** primeiro login manual em perfil exclusivo; nunca automatizar desvio de MFA, CAPTCHA ou controles institucionais. Sessão expirada gera `AGUARDANDO_LOGIN`, não looping de senhas.
- **Isolamento:** usar Playwright headless preferencialmente para não interferir no navegador do painel/usuário. A visualização do progresso deve ser um indicador próprio, não a tomada de controle da área de trabalho.
- **Rede:** worker se conecta ao servidor interno por HTTPS, com credencial técnica de escopo mínimo; não expor Node, PostgreSQL ou serviço do worker à internet.
- **Segredos e dados:** não versionar cookies, perfil do navegador, tokens, credenciais ou dados reais de reuniões; limitar logs e proteger e-mails, links e nomes. Validar destino externo das informações.
- **Webex:** a interface, o fluxo de autenticação e a capacidade de agendamento/envio de convites podem variar por organização e podem mudar. Validar na conta institucional; respeitar políticas aplicáveis.
- **Custos:** Playwright e Node.js são gratuitos; ainda existem custos operacionais de infraestrutura e possíveis restrições/licenciamento da conta Webex existente.

## 7. Plano de implementação (proposto)

**Fase 0 — Levantamento**
- Verificar a versão implantada do SISVC, acesso do Ubuntu à API interna, regras de rede, fuso horário da agenda e campos disponíveis.
- Confirmar como o Webex institucional agenda reuniões, informa participantes e envia convites.
- Definir aprovação operacional para uso de dados reais.

**Fase 1 — Prova de conceito local (sem produção)**
- Instalar Node.js e Playwright na estação Ubuntu; criar perfil de navegador exclusivo.
- Fazer login manual com a conta autorizada.
- Criar **uma reunião fictícia** pelo navegador, capturar link e registrar logs de sucesso/erro.
- Testar execução headless sem interferir no painel do operador.

**Fase 2 — Bot Telegram, fila e API**
- Integrar o bot para notificar e receber Aprovar/Recusar por polling, com autenticação/autorização vinculada ao cadastro interno do operador.
- Criar tabela de tarefas com status, tentativas, `solicitacao_id` único, referência Webex, timestamps e erro resumido.
- Adicionar endpoints internos autenticados para reservar tarefa, enviar heartbeat e reportar resultado.
- Integrar a criação da tarefa à aprovação **recebida pelo Telegram**, com garantias transacionais e de idempotência; a recusa atualiza o chamado sem tarefa.

**Fase 3 — Integração de ponta a ponta**
- Normalizar e validar destinatários de e-mail.
- Worker busca tarefa, cria reunião, registra resultado e link no SISVC.
- Exibir status de automação na interface; garantir que operadores possam intervir manualmente.

**Fase 4 — Robustez**
- Testar desligamento/reinício do Ubuntu, perda de rede, expiração de sessão, mudanças de interface, duplicidades e conflitos de horário.
- Configurar `systemd`, política de retentativas, alertas, auditoria e procedimento de recuperação.
- Homologar antes de habilitar agendamento automático para todos os chamados.

## 8. Critérios de aceite (para implementação futura)

- [ ] Aprovação feita por operador autorizado no Telegram atualiza o SISVC e registra exatamente uma tarefa persistente, sem segundo gate humano.
- [ ] Recusa feita pelo Telegram atualiza o SISVC e **não** gera tarefa de Webex.
- [ ] Repetir ações ou simular conta Telegram não autorizada não altera indevidamente o chamado.
- [ ] Um pedido Webex válido gera uma reunião e o SISVC recebe o link correto.
- [ ] Convites são enviados apenas aos e-mails validados e autorizados, com resultado verificável.
- [ ] O worker pode rodar sem tomar controle do navegador usado no painel.
- [ ] A interface mostra situação atual e identifica falhas que exigem ação humana.
- [ ] Desligar o Ubuntu não perde solicitações pendentes.
- [ ] Retentativas e eventos concorrentes não geram reuniões duplicadas.
- [ ] Sessão expirada não causa tentativas descontroladas de login.
- [ ] A trilha de auditoria permite rastrear solicitação, operador, tarefa e resultado.
- [ ] Funcionalidades das demais plataformas de videoconferência permanecem inalteradas.

## 9. Pendências para decisão

1. O SISVC instalado corresponde ao modelo Node.js/PostgreSQL deste repositório?
2. Quais campos e quais e-mails devem ser enviados ao Webex (responsável, solicitante, convidados)?
3. Qual é o fuso horário oficial a usar para criar reuniões?
4. O Webex institucional envia os convites automaticamente ao agendar pelo navegador?
5. Quais solicitações da plataforma Webex são elegíveis para envio ao operador e execução automática **após sua decisão no Telegram**? Não existe segunda confirmação humana de rotina.
6. Quem poderá reautenticar o perfil dedicado quando a sessão Webex expirar?

## 10. Fora do escopo desta ideia

- Implantação imediata; este arquivo é apenas planejamento.
- IA/JEV, roteamento de intenções por modelos e contratação de novos serviços pagos. **Integração Telegram está no escopo** desta ideia.
- Automação para Teams, Zoom ou outras plataformas.

**Próxima ação recomendada:** concluir a investigação de regras do Telegram, elegibilidade e destinatários; depois executar a Fase 0 e validar uma criação fictícia no Webex do Ubuntu antes de conectar o robô à decisão do operador.
