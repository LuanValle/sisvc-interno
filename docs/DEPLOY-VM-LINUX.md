# Deploy em VM Linux

Guia de referência para uma distribuição Linux compatível com systemd, Apache e pacotes RPM. Ajuste nomes de pacotes conforme o repositório homologado do ambiente.

## Topologia

```text
Cliente → Apache :80/:443 → Node :3000 → PostgreSQL :5432
```

Node e PostgreSQL escutam apenas em `127.0.0.1`.

## 1. Pré-requisitos

- VM Linux com acesso administrativo.
- Git, Node.js 22+, npm 10+, PostgreSQL e Apache.
- DNS de exemplo, como `app.example.com`.
- Portas 80/443 liberadas conforme a política.
- Usuário de serviço sem login interativo.

Verifique:

```bash
node --version
npm --version
git --version
psql --version
httpd -v
command -v npm
```

## 2. Proxy corporativo opcional

Use somente valores fornecidos pela equipe de rede:

```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1
```

Configure npm e Git quando necessário:

```bash
npm config set proxy "$HTTP_PROXY"
npm config set https-proxy "$HTTPS_PROXY"
git config --global http.proxy "$HTTP_PROXY"
git config --global https.proxy "$HTTPS_PROXY"
```

Não versione endereços, usuários ou senhas de proxy.

## 3. Instalar Node.js

Use o repositório homologado. Após a instalação:

```bash
node --version
npm --version
command -v npm
```

O caminho retornado por `command -v npm` deve coincidir com `ExecStart` em `deploy/sisvc.service`.

## 4. Criar usuário e instalar a aplicação

```bash
sudo useradd --system --home-dir /opt/sisvc --shell /sbin/nologin sisvc
sudo install -d -o sisvc -g sisvc -m 750 /opt/sisvc
sudo -u sisvc git clone https://github.com/LuanValle/sisvc-interno.git /opt/sisvc
cd /opt/sisvc
sudo -u sisvc npm ci
sudo -u sisvc npm run build
```

## 5. Instalar PostgreSQL

```bash
sudo dnf install postgresql-server postgresql
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

Consulte a versão aprovada antes de habilitar repositórios externos.

## 6. Criar usuário e banco

```bash
sudo -u postgres psql
```

No `psql`:

```sql
CREATE ROLE app_user LOGIN;
\password app_user
CREATE DATABASE app_db OWNER app_user;
REVOKE CONNECT ON DATABASE app_db FROM PUBLIC;
GRANT CONNECT ON DATABASE app_db TO app_user;
\q
```

## 7. Configurar autenticação

Em `postgresql.conf`:

```conf
listen_addresses = '127.0.0.1'
password_encryption = 'scram-sha-256'
```

Em `pg_hba.conf`, antes de regras genéricas:

```conf
host    app_db    app_user    127.0.0.1/32    scram-sha-256
```

Reinicie e confirme:

```bash
sudo systemctl restart postgresql
sudo -u postgres psql -Atc "SHOW password_encryption"
sudo ss -lntp | grep 5432
```

Se a senha foi criada antes da ativação de SCRAM, redefina-a com `\password app_user`.

## 8. Configurar o ambiente

```bash
cd /opt/sisvc
sudo -u sisvc cp .env.example .env
sudo chown sisvc:sisvc .env
sudo chmod 600 .env
sudo vi .env
```

Exemplo:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
TRUST_PROXY=true
DATABASE_URL=postgresql://app_user:change_me@127.0.0.1:5432/app_db
DB_SSL=false
ADMIN_USER=admin
ADMIN_PASSWORD=change_me
ADMIN_SESSION_SECRET=generate_a_random_secret_with_at_least_32_characters
APP_SECURE_COOKIE=false
VITE_API_BASE_URL=
```

Codifique caracteres especiais da senha na URL. O arquivo real nunca deve entrar no Git.

## 9. Importar dados opcionais

Use somente um backup sintético ou autorizado:

```bash
sudo install -d -o sisvc -g sisvc -m 700 /opt/sisvc/backups
sudo -u sisvc /opt/sisvc/deploy/import-current-data.sh \
  /opt/sisvc/backups/example-backup.json
```

O importador exige confirmação, executa transação e compara contagens. Para portfólio, prefira iniciar o banco vazio ou com dados fictícios.

## 10. Testar antes do systemd

```bash
cd /opt/sisvc
sudo -u sisvc npm start
curl http://127.0.0.1:3000/api/health
```

Resposta esperada:

```json
{"status":"ok","service":"sisvc"}
```

Interrompa o processo manual antes de instalar o serviço.

## 11. Configurar systemd

```bash
sudo cp deploy/sisvc.service /etc/systemd/system/sisvc.service
sudo systemctl daemon-reload
sudo systemctl enable --now sisvc
sudo systemctl status sisvc --no-pager
sudo journalctl -u sisvc -n 100 --no-pager
```

## 12. Configurar Apache

Ajuste o domínio em `deploy/apache-sisvc.conf` e copie:

```bash
sudo cp deploy/apache-sisvc.conf /etc/httpd/conf.d/sisvc.conf
sudo httpd -M | grep -E 'proxy|proxy_http|headers'
sudo apachectl configtest
sudo setsebool -P httpd_can_network_connect 1
sudo systemctl reload httpd
```

Teste com endereço reservado de documentação:

```bash
curl http://127.0.0.1:3000/api/health
curl http://192.0.2.10/api/health
curl -I http://app.example.com/
```

## 13. Firewall e TLS

- Libere somente HTTP/HTTPS.
- Não libere 3000 ou 5432.
- Em produção, configure certificado e redirecione HTTP para HTTPS.
- Com HTTPS ativo, use `APP_SECURE_COOKIE=true`.

## 14. Atualização

```bash
cd /opt/sisvc
sudo -u sisvc git pull --ff-only
sudo -u sisvc npm ci
sudo -u sisvc npm run build
sudo systemctl restart sisvc
sudo systemctl status sisvc --no-pager
```

Para falhas, consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
