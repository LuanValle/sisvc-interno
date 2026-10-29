# Equipe de agentes — SISVC-IDEIA-001

**Estado:** perfis e protocolo documentados em 2026-10-29. **Nenhum agente foi ativado ou executou código**.

## Equipe enxuta de três papéis

| Perfil | Responsabilidade | Autoridade |
| --- | --- | --- |
| [**ORQUESTRADOR**](./ORQUESTRADOR.md) | Supervisiona a equipe, delega tarefas, verifica evidências, aprova etapas internas e prepara release | Não implementa nem publica |
| [**DESENVOLVEDOR**](./DESENVOLVEDOR.md) | Identifica e implementa tarefas aprovadas com RED → GREEN → REFACTOR, testa e entrega evidências | Escreve só dentro da Work Order |
| [**REVISOR**](./REVISOR.md) | Revisão independente; aprova input corretivo **local** ou escala mudança de escopo | Não corrige código nem publica |

## Como trabalhar

Leia [PROTOCOLO.md](./PROTOCOLO.md) para o fluxo, Work Orders, revisão, correções e gate final. Para transferir a execução ao Maestri/Codex ou outro ambiente de agentes, comece por [INICIAR-EQUIPE.md](./INICIAR-EQUIPE.md), que contém a instrução de inicialização do ORQUESTRADOR.

```text
ORQUESTRADOR ── especifica/delega ──> DESENVOLVEDOR
                                          |
                                    TDD + evidências
                                          |
                                          v
                                    REVISOR independente
                                    /                \
                      input local corretivo         revisão aprovada
                                 |                        |
                         reIDENTIFICAR + TDD              v
                                 |                 ORQUESTRADOR
                                 +<-- REVISOR       aprova etapa
                                                         |
                                                    release candidata
                                                         |
                                                  HUMANO: gate deploy
```

**Problema imprevisto:** DESENVOLVEDOR para alterações fora do escopo e consulta REVISOR. REVISOR pode aprovar o novo input local e devolver à **IDENTIFICAÇÃO** do DESENVOLVEDOR. Se mudar escopo/arquitetura/segurança, escala ao ORQUESTRADOR. Correções são limitadas e registradas.

## Governança

- **Autonomia interna:** proprietário não participa de microaprovações de desenvolvimento; ORQUESTRADOR assume coordenação com revisão independente.
- **Último gate humano:** somente o proprietário autoriza ou recusa deploy final; ausência de testes reais ou bloqueios não podem ser omitidos.
- **Operação do SISVC:** o **operador humano no Telegram**, e não qualquer agente de desenvolvimento, decide Aprovar/Recusar um chamado Webex. Aprovação valida e enfileira a tarefa; recusa não agenda.
- **Limites:** nenhum agente controla Webex institucional ou produção por ser descrito aqui. A configuração, permissões, testes de ambiente e integração com ferramentas continuam pendentes.
- **Fontes de verdade:** [investigação](../INVESTIGACAO.md), [especificação](../ESPECIFICACAO.md), [arquitetura](../ARQUITETURA.md) e [TDD](../PLANO-TDD.md), sempre distinguindo decisões confirmadas de hipóteses.

**Próximo passo:** usar INICIAR-EQUIPE.md para configurar a orquestração e concluir pendências de especificação antes da implementação.
