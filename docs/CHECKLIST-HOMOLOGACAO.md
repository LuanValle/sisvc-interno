# Checklist de homologação

## Código e dependências

- [ ] `npm ci` conclui sem alterar o lockfile.
- [ ] `npm audit` não apresenta vulnerabilidades conhecidas.
- [ ] `npm test` é aprovado.
- [ ] `npm run build` gera `frontend/dist`.
- [ ] Nenhum segredo, backup ou dado real está versionado.

## Backend e banco

- [ ] `GET /api/health` retorna status `ok`.
- [ ] A aplicação conecta ao banco com usuário dedicado.
- [ ] O schema é criado em banco vazio.
- [ ] PostgreSQL usa SCRAM-SHA-256.
- [ ] PostgreSQL escuta somente no loopback.
- [ ] Criação de solicitação é persistida.
- [ ] Registros duplicados são bloqueados.
- [ ] Aprovação cria o evento relacionado.
- [ ] Rejeição registra o motivo.
- [ ] Edição, conclusão e reabertura funcionam.
- [ ] Exclusão/cancelamento exige confirmação.
- [ ] Auditoria registra ações administrativas.

## Frontend

- [ ] Login válido redireciona ao painel.
- [ ] Login inválido apresenta mensagem segura.
- [ ] Formulário valida campos obrigatórios.
- [ ] Agenda lista e filtra eventos.
- [ ] Paginação e busca funcionam.
- [ ] Build não depende do servidor de desenvolvimento.
- [ ] Rotas React carregam após atualização da página.

## systemd

- [ ] Serviço executa com usuário sem privilégios.
- [ ] `.env` possui permissão restrita.
- [ ] Serviço inicia no boot.
- [ ] Reinício automático foi verificado.
- [ ] Encerramento envia SIGTERM.
- [ ] Logs aparecem no journal sem dados sensíveis.

## Apache e rede

- [ ] `apachectl configtest` retorna `Syntax OK`.
- [ ] Página padrão não intercepta o VirtualHost.
- [ ] Apache encaminha `/api/health`.
- [ ] Frontend responde pelo domínio de homologação.
- [ ] Portas 3000 e 5432 não estão expostas.
- [ ] SELinux permite somente a conexão necessária.
- [ ] Logs de acesso e erro estão separados.
- [ ] HTTPS e cookie `Secure` estão alinhados.

## Backup e recuperação

- [ ] Backup fica fora do Git.
- [ ] Importação foi testada com dados sintéticos.
- [ ] Contagens foram comparadas.
- [ ] Restauração foi executada em ambiente descartável.
- [ ] Retenção e descarte estão documentados.

## Evidências

Registre data, versão, responsável pelo teste e resultado sem anexar credenciais, dados pessoais ou dumps.
