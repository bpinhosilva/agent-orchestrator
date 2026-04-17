# Guia Docker

Este documento é a referência definitiva para executar o Agent Orchestrator com Docker Compose.

## Visão geral

O repositório inclui três arquivos Compose:

| Arquivo | Propósito |
| --- | --- |
| `docker-compose.yml` | Stack estilo produção — PostgreSQL, API, Caddy (HTTPS) |
| `docker-compose.dev.yml` | Stack de desenvolvimento — recarregamento a quente da API, servidor dev Vite para a UI |
| `docker-compose.test.yml` | Stack de integração — verificações de migração, CLI/runtime, API, alcançabilidade da UI |

---

## Stack de produção

### Pré-requisitos

- [Docker](https://www.docker.com/) 24 ou mais recente
- Docker Compose v2 (`docker compose`, não `docker-compose`)

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto. O stack de produção requer:

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `POSTGRES_USER` | ✅ | — | Nome de usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | ✅ | — | Senha do PostgreSQL |
| `POSTGRES_DB` | ✅ | — | Nome do banco de dados PostgreSQL |
| `JWT_SECRET` | ✅ | — | Segredo de assinatura HS256 para tokens de acesso (mín. 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Segredo de assinatura HS256 para tokens de atualização (mín. 32 chars) |
| `ADMIN_EMAIL` | ✅ (seed-admin) | — | E-mail do usuário administrador (usado pelo serviço `seed-admin`) |
| `ADMIN_PASSWORD` | ✅ (seed-admin) | — | Senha do usuário administrador (usado pelo serviço `seed-admin`) |
| `ADMIN_NAME` | ❌ | `Admin` | Nome de exibição do usuário administrador |
| `DOMAIN` | ❌ | `localhost` | Nome de domínio para o virtual host e TLS do Caddy |
| `ALLOWED_ORIGINS` | ❌ | `https://localhost` | Origens CORS permitidas separadas por vírgula |

`.env` mínimo para uso local:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=agent_orchestrator

JWT_SECRET=<at-least-32-char-secret>
JWT_REFRESH_SECRET=<at-least-32-char-secret>

# Admin seed
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

> Use valores gerados aleatoriamente e fortes para `JWT_SECRET` e `JWT_REFRESH_SECRET` em qualquer ambiente que lide com dados reais.

### Configuração inicial

Execute estes comandos uma vez antes do primeiro `docker compose up`, e novamente após atualizações que alterem o esquema.

**Executar migrações pendentes:**

```bash
docker compose --profile tools run --rm migrate
```

**Popular o usuário administrador inicial:**

```bash
docker compose --profile tools run --rm seed-admin
```

As credenciais do administrador são lidas de `ADMIN_EMAIL`, `ADMIN_PASSWORD` (e opcionalmente `ADMIN_NAME`) no `.env`. Elas nunca são passadas como flags de CLI — veja [Notas de segurança](#notas-de-segurança).

### Iniciar e parar

```bash
docker compose up -d          # iniciar em segundo plano
docker compose logs -f        # acompanhar logs
docker compose down           # parar, manter volumes de dados
docker compose down -v        # parar e apagar todos os volumes (apaga o banco de dados)
```

### Atualização

```bash
docker compose down
docker compose pull            # ou reconstruir: docker compose build
docker compose --profile tools run --rm migrate
docker compose up -d
```

### Domínio personalizado e TLS

Defina `DOMAIN` e `ALLOWED_ORIGINS` no `.env`:

```bash
DOMAIN=mysite.com
ALLOWED_ORIGINS=https://mysite.com
```

O Caddy provisiona automaticamente certificados Let's Encrypt para domínios públicos. Nenhuma configuração TLS adicional é necessária.

Para `localhost`, o Caddy usa um certificado autoassinado confiável localmente. Os navegadores exibirão um aviso — clique para continuar ou adicione o certificado ao seu repositório de confiança.

### Endpoints (padrão `DOMAIN=localhost`)

| Serviço | URL |
| --- | --- |
| Painel | `https://localhost` |
| API | `https://localhost/api/v1` |

---

## Stack de desenvolvimento

```bash
npm run docker:dev
```

O stack de desenvolvimento monta sua árvore de código-fonte nos containers e habilita o recarregamento a quente tanto para a API (NestJS) quanto para a UI (Vite).

| Serviço | URL |
| --- | --- |
| UI (servidor dev Vite) | `http://localhost:5173` |
| API | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api` |
| Endpoint de saúde | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5433` |

---

## Como funciona

```
Navegador / cliente
      │
      ▼
  Caddy (portas 80 / 443)
      │
      ├─ /api/*  ──────────────────────► Serviço API (porta 3000, interno)
      │                                        │
      └─ todo o resto                          ▼
           servir arquivos estáticos    PostgreSQL (porta 5432, interno)
           (fallback index.html)
```

- **Caddy** encerra o TLS e roteia o tráfego. `/api/*` é encaminhado por proxy para a API; todos os outros caminhos são servidos a partir da build estática da UI com fallback `index.html` para roteamento no lado do cliente. Os blocos `handle` no `docker/Caddyfile` garantem que as requisições de API sejam encaminhadas por proxy antes que o fallback do SPA possa interceptá-las.
- **API** é vinculada a `HOST=0.0.0.0` dentro do container para ser alcançável por outros containers na rede Docker. A porta 3000 só é exposta à rede interna `frontend` — não é mapeada para o host.
- **PostgreSQL** está na rede `backend` que é `internal: true`. Não é acessível a partir do host.
- **Caddy** está na rede `frontend` (Caddy ↔ API) e expõe as portas 80 e 443 para o host.

---

## Serviços de tooling (`--profile tools`)

Estes serviços de execução única compartilham a imagem da API e se conectam à rede `backend`. Eles são excluídos do `docker compose up` a menos que você passe `--profile tools`.

### `migrate`

Executa migrações TypeORM pendentes contra o banco de dados de produção.

```bash
docker compose --profile tools run --rm migrate
```

### `seed-admin`

Cria um usuário administrador inicial diretamente via TypeORM. Lê as credenciais de variáveis de ambiente — não aceita flags de CLI.

```bash
docker compose --profile tools run --rm seed-admin
```

Variáveis de ambiente obrigatórias: `ADMIN_EMAIL`, `ADMIN_PASSWORD`  
Variável de ambiente opcional: `ADMIN_NAME` (padrão: `"Admin"`)

O serviço encerra com código não-zero se as credenciais estiverem ausentes ou se a criação do usuário falhar.

---

## Notas de segurança

- **Credenciais de administrador via variáveis de ambiente**: `seed-admin` lê `ADMIN_EMAIL` e `ADMIN_PASSWORD` do ambiente, não de flags de CLI. Passar segredos como argumentos de CLI os expõe na tabela de processos e no histórico do shell.
- **Rede interna**: a rede `backend` é declarada `internal: true`. O PostgreSQL não é alcançável a partir do host — apenas a partir de containers nessa rede.
- **Endereço de bind da API**: `HOST=0.0.0.0` é necessário para que a API seja alcançável pelo Caddy dentro do Docker. A porta 3000 não tem mapeamento de porta para o host, portanto não é acessível de fora da rede Docker.
- **Segredos JWT**: use valores longos gerados aleatoriamente. O comprimento mínimo aceito é de 32 caracteres. Rotacione-os com `agent-orchestrator rotate-secrets` se forem expostos.

---

## Solução de problemas

### Volume PostgreSQL desatualizado (incompatibilidade de versão)

**Sintoma**: o `db` falha na verificação de saúde com uma mensagem como:

```
FATAL: data directory was initialized by PostgreSQL version 14, which is not compatible with this version 17
```

**Solução**: apague o volume e reinicie.

```bash
docker compose down -v
docker compose --profile tools run --rm migrate
docker compose up -d
```

> `down -v` apaga todos os dados. Faça backup do que precisar primeiro.

### Container da API permanece não saudável

A API tem um `start_period` de 30 segundos antes que as falhas de verificação de saúde contem. Se ainda estiver não saudável após esse período, verifique os logs:

```bash
docker compose logs api
```

Causas comuns: `JWT_SECRET` ausente ou inválido, falha na conexão com o banco de dados, migrações pendentes bloqueando a inicialização (`CHECK_PENDING_MIGRATIONS_ON_STARTUP=true`).

### 502 Bad Gateway do Caddy

O Caddy não consegue alcançar a API. Causas prováveis:

- `HOST` não está definido como `0.0.0.0` no serviço de API — a API será vinculada a `127.0.0.1` no modo de produção por padrão, tornando-a inacessível a partir de outros containers.
- O container da API ainda não está saudável — aguarde passar pela verificação de saúde.
- Uma configuração de rede incorreta — verifique se a API está na rede `frontend`.

### Aviso de certificado do navegador no localhost

Comportamento esperado. O Caddy emite um certificado assinado localmente para `localhost`. Clique para ignorar o aviso ou adicione o certificado ao repositório de confiança do seu sistema operacional. Para domínios públicos, o Caddy provisiona automaticamente um certificado Let's Encrypt real.

### Tarefas permanecem em backlog e nunca são processadas

O agendador só processa tarefas que pertencem a projetos **ATIVOS**. Os projetos são criados com status `PLANEJAMENTO` por padrão.

Para habilitar a execução de tarefas, abra o projeto na UI e altere seu status para **Ativo**. O agendador faz polling a cada 20 segundos, portanto as tarefas devem começar a ser movimentadas em breve após a mudança.
