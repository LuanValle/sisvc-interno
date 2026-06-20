# Troubleshooting

## npm ou Git bloqueados pelo proxy

**Sintomas:** timeout, falha de DNS ou conexão recusada.

```bash
env | grep -i proxy
npm config get proxy
git config --global --get http.proxy
```

Configure o proxy autorizado e inclua `localhost,127.0.0.1` em `NO_PROXY`. Nunca publique credenciais de proxy.

## PostgreSQL usa peer ou ident

**Sintoma:** `password authentication failed` mesmo com a senha correta.

Revise a primeira regra correspondente em `pg_hba.conf`:

```conf
host app_db app_user 127.0.0.1/32 scram-sha-256
```

Reinicie o serviço após a alteração.

## password_encryption continua md5

```sql
SHOW password_encryption;
```

Confirme o arquivo carregado e reinicie. Se a senha foi criada antes da mudança, redefina-a:

```text
\password app_user
```

## Caractere especial quebra DATABASE_URL

Uma senha com `@`, `#`, `/` ou `:` precisa de URL encoding. Gere a URL com ferramenta segura ou prefira uma senha aleatória já adequada a URI. Não imprima a URL em logs.

## Apache mostra a página padrão

```bash
sudo apachectl configtest
sudo httpd -S
sudo tail -n 100 /var/log/httpd/sisvc_error.log
```

Confirme `ServerName`, carregamento do VirtualHost e módulos `proxy`/`proxy_http`.

## Node funciona em localhost, mas não pela rede

Esse é o desenho esperado: Node deve escutar apenas em localhost. A rede acessa o Apache. Verifique:

```bash
curl http://127.0.0.1:3000/api/health
curl http://app.example.com/api/health
sudo setsebool -P httpd_can_network_connect 1
sudo ss -lntp | grep -E ':80|:3000'
```

## systemd não inicia

```bash
sudo systemctl status sisvc --no-pager
sudo journalctl -u sisvc -n 100 --no-pager
sudo systemctl cat sisvc
sudo -u sisvc test -r /opt/sisvc/.env
command -v npm
```

Causas frequentes:

- `.env` ausente ou sem permissão;
- caminho do npm incorreto;
- build não gerado;
- banco indisponível;
- variável obrigatória ausente.

## Banco sem permissão

```bash
psql "$DATABASE_URL" -c 'SELECT current_user, current_database();'
```

Confirme propriedade do banco, permissão de conexão e autenticação no `pg_hba.conf`.

## Schema ausente

A aplicação aplica `backend/database/schema.sql` na inicialização. Verifique logs e permissões de criação:

```bash
sudo journalctl -u sisvc -n 100 --no-pager
psql "$DATABASE_URL" -c '\dt'
```

## Health check falha

```bash
curl -v http://127.0.0.1:3000/api/health
sudo systemctl status sisvc --no-pager
sudo ss -lntp | grep 3000
```

O endpoint de health confirma o processo HTTP. Teste operações reais para validar também o banco.

## Diagnóstico por camadas

1. PostgreSQL aceita conexão?
2. Node inicia manualmente?
3. Health check local responde?
4. systemd mantém o processo ativo?
5. Apache encaminha requisições?
6. Firewall e DNS permitem acesso?
7. O navegador recebe frontend e API pela mesma origem?
