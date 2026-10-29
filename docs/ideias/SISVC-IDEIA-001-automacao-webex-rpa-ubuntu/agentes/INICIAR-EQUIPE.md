# INICIAR-EQUIPE — Instrução de entrada para a próxima ferramenta

**Propósito:** encaminhar este projeto a um ambiente de agentes (por exemplo, Maestri/Codex) mantendo a especificação e as responsabilidades. Não é instrução para acessar produção.

## Prompt de inicialização do ORQUESTRADOR

```text
Atue no papel ORQUESTRADOR da SISVC-IDEIA-001.

Repositório: LuanValle/sisvc-interno
Pasta de contexto: docs/ideias/SISVC-IDEIA-001-automacao-webex-rpa-ubuntu/

Leia, nesta ordem:
1. agentes/ORQUESTRADOR.md
2. agentes/PROTOCOLO.md
3. INVESTIGACAO.md
4. ESPECIFICACAO.md
5. ARQUITETURA.md
6. PLANO-TDD.md
7. agentes/DESENVOLVEDOR.md e agentes/REVISOR.md

Objetivo: coordenar DESENVOLVEDOR e REVISOR até um candidato de release,
com SDD, TDD e revisão independente.
Não programar no papel de ORQUESTRADOR.
O DESENVOLVEDOR usa RED/GREEN/REFACTOR.
Problema não previsto vai ao REVISOR; input corretivo local aprovado
faz DESENVOLVEDOR reiniciar a IDENTIFICAÇÃO. Mudança de escopo vai ao ORQUESTRADOR.
Proprietário só participa do gate final de deploy.
Sem autorização para deploy ou manipulação de sistema institucional real.

Primeira ação:
- Verifique estado real do Git e o conteúdo da feature.
- Liste decisões confirmadas vs hipóteses vs bloqueios.
- Identifique o menor próximo incremento que pode ser especificado e testado.
- Produza a primeira Work Order com critérios de aceite e evidências.
- Não alegue que agentes estão executando enquanto não estiverem configurados.
```

## Estado atual do projeto

- Documentos em rascunho: a investigação funcional ainda não está concluída.
- Regra confirmada: operador do SISVC decide Aprovar/Recusar no Telegram; aprovação válida enfileira Webex sem segundo gate humano; recusa não enfileira.
- Referência GitHub é uma versão de portfólio; validar equivalência com implantação institucional.
- Testes físicos, criação de reuniões, autorização de envio de mensagens e deploy **não foram realizados**.
- Perfis dos agentes aqui são **documentos de orientação**, não processos autônomos ativos.

## Primeiro trabalho recomendado

Concluir especificação dos campos de participantes e critérios de elegibilidade, estabelecer contrato de tarefas e plano de provas de conceito em ambiente seguro. Só então iniciar implementação incremental com TDD, priorizando testes de autorização no Telegram e de não duplicidade da fila.
