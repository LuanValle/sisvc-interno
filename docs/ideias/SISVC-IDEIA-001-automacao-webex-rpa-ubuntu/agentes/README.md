# Agentes da SISVC-IDEIA-001

**Status:** arquitetura de agentes em planejamento; papéis documentais, **não executados**.

## Equipe enxuta proposta

| Papel | Função | Estado |
| --- | --- | --- |
| **[ORQUESTRADOR](./ORQUESTRADOR.md)** | Supervisiona outros agentes, distribui tarefas, decide aprovações internas baseadas em evidências e prepara entrega para o gate final. Não implementa nem executa deploy. | Perfil inicial registrado |
| **DESENVOLVEDOR** | Implementa pequenas tarefas aprovadas com TDD (RED/GREEN/REFACTOR), executa testes e entrega provas. | Perfil a detalhar |
| **REVISOR** | Avalia especificações, segurança, código, testes e regressões sem revisar o próprio trabalho. | Perfil a detalhar |

## Separação de decisões

- **Desenvolvimento:** o ORQUESTRADOR autoriza internamente as etapas depois de revisão independente; o proprietário só decide o deploy final.
- **Operação SISVC:** um operador **humano** autoriza ou recusa chamados pelo Telegram; uma aprovação válida dispara a tarefa Webex, sem segundo gate humano. Não confundir esse operador com o ORQUESTRADOR de desenvolvimento.
- Sem aprovação de deploy pelo proprietário, não publicar a automação em produção.

## Fluxo de trabalho proposto

```text
Investigação e especificação (SDD)
            |
      ORQUESTRADOR
            |
        DESENVOLVEDOR
    testes RED -> GREEN -> REFACTOR
            |
       REVISOR independente
            |
      ORQUESTRADOR
     /            \
CORRIGIR       PREPARAR RELEASE
                   |
         PROPRIETÁRIO: GATE DEPLOY
```

Regras de referência: `../INVESTIGACAO.md`, `../ESPECIFICACAO.md`, `../ARQUITETURA.md` e `../PLANO-TDD.md`. O JARVIS serve de referência para SDD e divisão de responsabilidades, sem importar automaticamente suas decisões específicas de produto.

**Próximo passo de projeto:** aprofundar o perfil do DESENVOLVEDOR e do REVISOR, especificar formato das tarefas e definir o orçamento/ciclos máximos de automação.
