# Agent Orchestrator

<p align="center">
  <img src="https://raw.githubusercontent.com/bpinhosilva/agent-orchestrator/main/docs/assets/lupy-mascot.webp" alt="Lupy, o mascote do Agent Orchestrator" width="500" />
</p>

<p align="center"><em>Lupy, o mascote do projeto, inspirado no cachorro do Bruno e companheiro de 10 anos.</em></p>

<p align="center">
  <a href="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml"><img src="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml"><img src="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml/badge.svg" alt="Gitleaks" /></a>
  <a href="https://socket.dev/npm/package/@bpinhosilva/agent-orchestrator"><img src="https://socket.dev/api/badge/npm/package/@bpinhosilva/agent-orchestrator" alt="Socket Badge" /></a>
</p>

O Agent Orchestrator é uma plataforma de código aberto para gerenciar agentes de IA, tarefas e automação com escopo de projeto em vários provedores de modelos. Ele combina uma API NestJS, um painel React, uma CLI/runtime empacotada e opções de implantação Docker para uso local e em ambientes de produção.

## Capacidades atuais

- Execução de agentes em múltiplos provedores com Google Gemini e Anthropic Claude
- Perfis de agentes com seleção de provedor/modelo
- Gerenciamento de projetos com membros e RBAC (Controle de Acesso Baseado em Funções)
- Execução de tarefas e agendamento recorrente
- Upload de arquivos e fluxos de trabalho de tarefas baseados em artefatos
- CLI/runtime empacotada para configuração, execução, status, logs, parada e migração
- Painel React servido pelo backend ou pelo runtime empacotado

## Direção planejada

- Orquestração de fluxos de trabalho mais rica e encadeamento de agentes
- Integrações mais amplas de ferramentas para agentes
- Melhorias na ergonomia de implantação e runtime

## Arquitetura em resumo

| Área | Stack |
| --- | --- |
| Backend | NestJS 11 + TypeScript 5 |
| Frontend | React SPA |
| Banco de Dados | PostgreSQL (produção) / SQLite via `better-sqlite3` (local/runtime) |
| ORM | TypeORM |
| Autenticação | Tokens de acesso/atualização JWT via cookies httpOnly |
| Empacotamento | Pacote npm com backend, CLI e assets de UI embutidos |

## Pré-requisitos

- [Node.js](https://nodejs.org/) 24 ou mais recente
- npm
- [Docker](https://www.docker.com/) e Docker Compose (opcional)
- Pelo menos uma chave de API de provedor para executar agentes:
  - [Chave de API do Google Gemini](https://aistudio.google.com/)
  - [Chave de API da Anthropic](https://console.anthropic.com/)

## Início rápido

Escolha o caminho que corresponde a como você deseja usar o projeto:

- **CLI/runtime empacotada**: maneira mais rápida de rodar o app localmente como uma ferramenta instalada
- **Checkout do código-fonte**: melhor caminho para desenvolvimento e contribuição

### Opção A: CLI/runtime empacotada

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
```

`setup` pode criar o `.env` de runtime, rodar migrações, popular um usuário administrador e solicitar que você aplique migrações pendentes após atualizações do pacote. `run` não atualiza o banco de dados automaticamente. O diretório padrão do runtime é `~/.agent-orchestrator`, ou `${AGENT_ORCHESTRATOR_HOME}` se você o definir explicitamente.

Para um uso mais aprofundado da CLI, veja [CLI.md](CLI.md).

### Opção B: checkout do código-fonte

```bash
git clone https://github.com/bpinhosilva/agent-orchestrator.git
cd agent-orchestrator
npm install
npm rebuild
npm run build:all
```

> **Nota**: O repositório usa `ignore-scripts=true` no `.npmrc` para segurança da cadeia de suprimentos. Após o `npm install`, rode `npm rebuild --ignore-scripts=false` para que os módulos nativos como `bcrypt` e `better-sqlite3` sejam de fato compilados.

Se você quiser usar o comportamento da CLI empacotada a partir de um checkout de código-fonte, rode o entrypoint compilado diretamente:

```bash
node dist/cli/index.js --help
```

## Configurar o runtime

O app carrega a configuração de:

- `${AGENT_ORCHESTRATOR_HOME}/.env` quando `AGENT_ORCHESTRATOR_HOME` estiver definido
- `.env` na raiz do projeto/pacote caso contrário

Exemplo de `.env`:

```bash
# Obrigatório
JWT_SECRET="substitua-por-um-segredo-com-pelo-menos-32-caracteres"

# Chaves de provedor (opcional até você querer executar agentes)
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""

# Banco de Dados
DB_TYPE=sqlite
DATABASE_URL=

# Runtime
PORT=15789
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SCHEDULER_ENABLED=true
DB_LOGGING=false
SERVE_STATIC_UI=true
CHECK_PENDING_MIGRATIONS_ON_STARTUP=false
```

## Configuração do Banco de Dados

### SQLite

SQLite é a opção padrão local/runtime quando `DATABASE_URL` não está definido. O arquivo do banco de dados fica em:

- `local.sqlite` na raiz do projeto/pacote, ou
- `${AGENT_ORCHESTRATOR_HOME}/local.sqlite` quando o diretório do runtime está definido

### PostgreSQL

Use o PostgreSQL definindo `DATABASE_URL` ou `DB_TYPE=postgres`:

```bash
export DATABASE_URL="postgresql://orchestrator:senha_orchestrator@localhost:5433/agent_orchestrator"
```

### Inicializar o esquema

Execute as migrações antes de iniciar o aplicativo pela primeira vez:

```bash
npm run migration:run
```

Crie o usuário administrador inicial se desejar fazer login pelo painel:

```bash
npm run seed:admin
```

Se você usar a CLI empacotada, `agent-orchestrator setup` pode realizar ambos os passos para você.

## Executar o aplicativo

### Desenvolvimento local

```bash
npm run dev
```

Isso inicia:

- Servidor de desenvolvimento da UI: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api` (apenas fora de produção)
- Endpoint de saúde: `http://localhost:3000/health`

Se você quiser apenas a API no modo watch:

```bash
npm run start:dev
```

### Modo empacotado/runtime

```bash
agent-orchestrator run
agent-orchestrator status
agent-orchestrator logs --lines 50
agent-orchestrator stop
```

Ao executar o aplicativo empacotado ou uma build de produção com UI estática ativada, o painel é servido em `http://localhost:15789` por padrão.

## Docker

O repositório disponibiliza três entrypoints Compose:

Todos os stacks Compose agora requerem as variáveis de banco de dados no arquivo `.env` do projeto: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, e `POSTGRES_TEST_DB` para o stack de integração.

| Arquivo | Propósito |
| --- | --- |
| `docker-compose.yml` | Stack estilo produção com PostgreSQL, API, e UI servida via Caddy |
| `docker-compose.dev.yml` | Stack de desenvolvimento com recarregamento a quente da API e servidor dev Vite para a UI |
| `docker-compose.test.yml` | Stack de integração para verificação de migrações, CLI/runtime, API e alcançabilidade da UI |

### Stack estilo produção

```bash
npm run docker:up
docker compose run --rm api dist/cli/index.js migrate --yes
```

Endpoints:

- UI: `https://localhost` ou `https://agent-orchestrator.localhost`
- API: `https://localhost/api/v1` ou `https://agent-orchestrator.localhost/api/v1`

Neste stack, a UI é servida pelo **Caddy**, não pelo app Nest. O Docker define explicitamente `SERVE_STATIC_UI=false` para que o backend sirva apenas a API.

### Stack de desenvolvimento

```bash
npm run docker:dev
```

Endpoints:

- UI: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- PostgreSQL: `localhost:5433`

### Stack de integração

Use `docker-compose.test.yml` quando você quiser testar o comportamento da migração, fluxos da CLI/runtime empacotada, inicialização da API e alcançabilidade da UI juntos.

```bash
npm run docker:test
docker compose -f docker-compose.test.yml --profile tools run --rm migrate
docker compose -f docker-compose.test.yml --profile tools run --rm cli
```

Endpoints:

- UI: `https://localhost:8444` ou `https://agent-orchestrator.localhost:8444`
- API: `https://localhost:8444/api/v1` ou `https://agent-orchestrator.localhost:8444/api/v1`

## Fluxo de desenvolvimento

| Tarefa | Comando |
| --- | --- |
| Iniciar API + UI | `npm run dev` |
| Iniciar apenas API | `npm run start:dev` |
| Lint API + UI | `npm run lint:all` |
| Rodar testes API + UI + E2E | `npm run test:all` |
| Rodar cobertura | `npm run test:cov` |
| Rodar testes E2E | `npm run test:e2e` |
| Build do pacote backend + UI | `npm run build:all` |
| Aplicar migrações | `npm run migration:run` |

## Modelo de autenticação e acesso

- Tokens de acesso e atualização são emitidos pelo serviço de autenticação e transportados via **cookies httpOnly**
- Regras de sistema são **`admin`** e **`user`**
- Regras de membro de projeto são **`owner`** e **`member`**
- As rotas são protegidas por padrão; use `@Public()` para endpoints públicos
- O limitador global tem o padrão de `60/min`, com limites mais rígidos em endpoints de autenticação

## Documentação útil

- [Referência da CLI](CLI.md)
- [Pipeline de CI/CD](CI_CD.md)
- [Processo de Lançamento](RELEASE.md)
- [Guia de Contribuição](../../../CONTRIBUTING.md)

## Solução de problemas

- **Erros de módulo nativo após a instalação**: rode `npm rebuild`
- **`JWT_SECRET` rejeitada**: precisa ter pelo menos 32 caracteres
- **A execução do agente falha imediatamente**: confirme que `GEMINI_API_KEY` e/ou `ANTHROPIC_API_KEY` estão definidos
- **Problemas no esquema/inicialização**: rode `npm run migration:run`
- **Precisa desfazer a última migração**: rode `npm run migration:revert`

## Licença

Veja a [LICENSE](../../../LICENSE).
