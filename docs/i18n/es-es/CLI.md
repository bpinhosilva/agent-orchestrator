# Referencia de CLI

El paquete expone la CLI `agent-orchestrator` para la configuración del runtime empaquetado y la gestión del ciclo de vida.

- **Requisito de Node.js:** 24.0.0 o posterior
- **Instalación empaquetada:** `npm install -g @bpinhosilva/agent-orchestrator`
- **Checkout de código fuente:** construye primero, luego ejecuta `node dist/cli/index.js ...`

Para la configuración general del proyecto y la guía de desarrollo, comienza con [README.md](README.md).

## Rutas de instalación

### Paquete publicado

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator --help
```

### Checkout de código fuente

```bash
npm install
npm rebuild
npm run build:all
node dist/cli/index.js --help
```

El paquete publicado incluye la construcción del backend y el paquete de la UI requeridos por `agent-orchestrator run`. En un checkout de código fuente, `npm run build:all` produce el mismo diseño de runtime empaquetado bajo `dist/`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `setup` | Crea o actualiza el `.env` del runtime, configura proveedores, opcionalmente ejecuta migraciones y opcionalmente crea un usuario administrador |
| `run` | Inicia el servidor del orquestador en modo separado después de verificar que existe la construcción empaquetada |
| `restart` | Reinicia el servidor del orquestador (inteligente: detiene si está en ejecución, luego inicia) |
| `status` | Muestra el proceso del orquestador que se está ejecutando actualmente |
| `logs` | Imprime las líneas de registro más recientes del orquestador |
| `stop` | Detiene el proceso del orquestador separado después de verificar que es el runtime esperado |
| `migrate` | Ejecuta las migraciones de base de datos pendientes |

## Flujos comunes

### Primera configuración del runtime empaquetado

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator restart
agent-orchestrator status
```

`setup` inicializa una base de datos de runtime empaquetada vacía en el primer uso y te pide que apliques las migraciones pendientes después de las actualizaciones del paquete. `run` no actualiza la base de datos automáticamente.

### Configuración no interactiva

```bash
agent-orchestrator setup \
  --yes \
  --db-type postgres \
  --database-url postgresql://orchestrator:orchestrator_password@localhost:5433/agent_orchestrator \
  --provider gemini \
  --gemini-key TU_CLAVE \
  --skip-admin-setup
```

### Registros, reinicio y apagado

```bash
agent-orchestrator logs --lines 100
agent-orchestrator restart
agent-orchestrator stop
```

### Migraciones

```bash
agent-orchestrator migrate --yes
agent-orchestrator migrate --force --yes
```

## Opciones clave

### `setup`

Banderas soportadas:

- `--port <puerto>`
- `--db-type <sqlite|postgres>`
- `--database-url <url>`
- `--db-logging`
- `--provider <proveedor>` (repetible o separado por comas; `gemini`, `anthropic`)
- `--gemini-key <clave>`
- `--anthropic-key <clave>`
- `--admin-name <nombre>`
- `--admin-email <email>`
- `--admin-password <contraseña>`
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

## Archivos de runtime

El home por defecto del runtime es `${HOME}/.agent-orchestrator` a menos que `AGENT_ORCHESTRATOR_HOME` esté configurado.

- Directorio de runtime: `${HOME}/.agent-orchestrator` por defecto, creado con modo `0700`
- `.env`: `~/.agent-orchestrator/.env` por defecto, escrito con modo `0600`
- Base de datos SQLite: `~/.agent-orchestrator/local.sqlite` por defecto
- Archivo PID: `~/.agent-orchestrator/pid` por defecto
- Metadatos del proceso: `~/.agent-orchestrator/process.json` por defecto
- Archivo de registro: `~/.agent-orchestrator/server.log` por defecto

## Notas

- `setup` acepta tanto URLs `postgres://...` como `postgresql://...`.
- `run` requiere tanto `dist/main.js` como `dist/ui/index.html`.
- `stop` no confía solo en el archivo PID; verifica la forma del proceso esperado y puede recuperarse de estados de runtime obsoletos.
- `setup` es la forma preferida de sembrar el usuario administrador inicial para instalaciones de runtime empaquetadas.
