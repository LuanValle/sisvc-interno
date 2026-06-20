# Segurança

## Modelo de exposição

Somente o Apache deve estar acessível pela rede. Node e PostgreSQL ficam no loopback:

```text
Rede → Apache :80/:443
       Node :3000      somente 127.0.0.1
       PostgreSQL :5432 somente 127.0.0.1
```

## Segredos e variáveis

- Use `.env` com permissão `600`.
- Versione apenas `.env.example` com valores fictícios.
- Gere `ADMIN_SESSION_SECRET` aleatório e longo.
- Não reutilize senha administrativa no banco.
- Rotacione segredos após exposição ou mudança de equipe.
- Não registre URLs de conexão em logs.

## Banco

- Use SCRAM-SHA-256.
- Restrinja `listen_addresses` ao loopback.
- Mantenha regra específica no `pg_hba.conf`.
- Não abra 5432 no firewall.
- Use usuário dedicado com o menor privilégio necessário.
- Mantenha backups criptografados e teste restauração.

## Aplicação

- Cookies administrativos são HttpOnly e SameSite=Lax.
- A sessão é assinada e possui expiração.
- Ative `APP_SECURE_COOKIE=true` sob HTTPS.
- Consultas interpoladas usam parâmetros PostgreSQL.
- O corpo JSON possui limite de tamanho.
- O Express remove o cabeçalho `X-Powered-By`.
- Cabeçalhos básicos reduzem sniffing e framing.

## Apache e systemd

- O Apache atua como limite público e termina TLS.
- O systemd executa o Node com usuário sem privilégios.
- `NoNewPrivileges`, `PrivateTmp` e `ProtectHome` reduzem acesso.
- Confirme o caminho do npm e as permissões de `/opt/sisvc`.
- Monitore journal e logs do Apache sem registrar dados pessoais.

## Proxy

- Não inclua usuário ou senha de proxy em arquivos versionados.
- Configure `NO_PROXY=localhost,127.0.0.1`.
- Revise proxies persistentes em npm e Git antes de publicar imagens ou logs.

## Arquivos proibidos no Git

- `.env` e variantes locais.
- Backups JSON, dumps SQL e bancos SQLite.
- Logs, builds, dependências e pacotes ZIP.
- Certificados, chaves privadas e tokens.
- Dados exportados de produção.

## Checklist antes de publicar

- [ ] Executar varredura por tokens, e-mails, IPs e domínios privados.
- [ ] Confirmar `git status --ignored` para backups.
- [ ] Inspecionar o histórico, não apenas o HEAD.
- [ ] Usar somente dados sintéticos.
- [ ] Executar `npm audit`.
- [ ] Revisar arquivos em `deploy/` e `docs/`.
- [ ] Confirmar ausência de `.env`, dumps e ZIPs rastreados.
- [ ] Verificar que 3000 e 5432 não estão expostos.
- [ ] Habilitar HTTPS antes de uso real.

## Limitações atuais

A autenticação usa uma única conta definida no ambiente. Uma evolução deve persistir usuários com hash de senha, rate limiting, bloqueio progressivo e trilha de alterações de acesso.
