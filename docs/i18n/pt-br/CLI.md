# Referência da CLI

O pacote expõe a CLI `agent-orchestrator` para configuração do runtime empacotado e gerenciamento de ciclo de vida.

- **Requisito do Node.js:** 24.0.0 ou superior
- **Instalação do pacote:** `npm install -g @bpinhosilva/agent-orchestrator`
- **Checkout do código-fonte:** compile primeiro, e depois rode `node dist/cli/index.js ...`

Para uma orientação geral sobre a configuração e o desenvolvimento do projeto, comece pelo [README.md](README.md).

## Caminhos de instalação

### Pacote publicado

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator --help
```

### Checkout do código-fonte

```bash
npm install
npm rebuild
npm run build:all
node dist/cli/index.js --help
```

O pacote publicado inclui o build do backend e o bundle da UI necessários pelo `agent-orchestrator run`. Em um checkout de código-fonte, o comando `npm run build:all` produz o mesmo layout de runtime empacotado em `dist/`.

## Comandos

| Comando | Descrição |
| --- | --- |
| `setup` | Cria ou atualiza o `.env` do runtime, configura os provedores, opcionalmente executa as migrações, e opcionalmente cria um usuário administrador |
| `run` | Inicia o servidor do orchestrator em modo desanexado após verificar se o build empacotado existe |
| `status` | Mostra o processo do orchestrator atualmente em execução |
| `logs` | Imprime as linhas mais recentes de log do orchestrator |
| `stop` | Para o processo desanexado do orchestrator após verificar se ele é o runtime esperado |
| `migrate` | Executa as migrações de banco de dados pendentes |

## Fluxos comuns

### Configuração do runtime empacotado na primeira vez

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
```

O comando `setup` inicializa um banco de dados de runtime vazio no primeiro uso e solicita que você aplique migrações pendentes após as atualizações de pacote. O comando `run` não atualiza o banco de dados automaticamente.

### Configuração não interativa

```bash
agent-orchestrator setup \
  --yes \
  --db-type postgres \
  --database-url postgresql://orchestrator:senha_orchestrator@localhost:5433/agent_orchestrator \
  --provider gemini \
  --gemini-key SUA_CHAVE \
  --skip-admin-setup
```

### Logs e desligamento

```bash
agent-orchestrator logs --lines 100
agent-orchestrator stop
```

### Migrações

```bash
agent-orchestrator migrate --yes
agent-orchestrator migrate --force --yes
```

## Principais opções

### `setup`

Flags suportadas:

- `--port <port>`
- `--db-type <sqlite|postgres>`
- `--database-url <url>`
- `--db-logging`
- `--provider <provider>` (repetível ou separada por vírgula; `gemini`, `anthropic`)
- `--gemini-key <key>`
- `--anthropic-key <key>`
- `--admin-name <name>`
- `--admin-email <email>`
- `--admin-password <password>`
- `--skip-admin-setup`
- `--regenerate-jwt-secret`
- `-y, --yes`

### `logs`

```bash
agent-orchestrator logs --lines 100
```

### `migrate`

```bash
agent-orchestrator migrate --yes
agent-orchestrator migrate --force --yes
```

## Arquivos do Runtime

O diretório padrão de runtime é `${HOME}/.agent-orchestrator` a não ser que `AGENT_ORCHESTRATOR_HOME` esteja definido.

- Diretório do Runtime: `${HOME}/.agent-orchestrator` por padrão, criado com permissões `0700`
- `.env`: `~/.agent-orchestrator/.env` por padrão, escrito com permissões `0600`
- Banco de dados SQLite: `~/.agent-orchestrator/local.sqlite` por padrão
- Arquivo PID: `~/.agent-orchestrator/pid` por padrão
- Metadados do processo: `~/.agent-orchestrator/process.json` por padrão
- Arquivo de log: `~/.agent-orchestrator/server.log` por padrão

## Notas

- `setup` aceita ambas as URLs `postgres://...` e `postgresql://...`.
- `run` requer os arquivos `dist/main.js` e `dist/ui/index.html`.
- `stop` não confia apenas no arquivo PID; ele verifica a conformidade do processo esperado e pode se recuperar de estados de runtime antigos.
- `setup` é a forma preferida de popular o usuário administrador inicial para instalações do runtime empacotado.
