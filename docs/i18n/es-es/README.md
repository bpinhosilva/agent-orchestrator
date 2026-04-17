# Agent Orchestrator

<p align="center">
  <img src="https://raw.githubusercontent.com/bpinhosilva/agent-orchestrator/main/docs/assets/lupy-mascot.webp" alt="Lupy, la mascota de Agent Orchestrator" width="500" />
</p>

<p align="center"><em>Lupy, la mascota del proyecto, inspirada en el perro de Bruno y su compañero durante 10 años.</em></p>

<p align="center">
  <a href="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml"><img src="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml"><img src="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml/badge.svg" alt="Gitleaks" /></a>
  <a href="https://socket.dev/npm/package/@bpinhosilva/agent-orchestrator"><img src="https://socket.dev/api/badge/npm/package/@bpinhosilva/agent-orchestrator" alt="Socket Badge" /></a>
</p>

Agent Orchestrator es una plataforma de código abierto para gestionar agentes de IA, tareas y automatización con alcance de proyecto a través de múltiples proveedores de modelos. Combina una API de NestJS, un panel de control en React, una CLI/runtime empaquetada y opciones de despliegue con Docker tanto para uso local como para entornos de producción.

## Capacidades actuales

- Ejecución de agentes multiproveedor con Google Gemini, Anthropic Claude y Ollama (local o en la nube)
- Perfiles de agentes con selección de proveedor/modelo
- Gestión de proyectos con membresía de proyecto y RBAC
- Ejecución de tareas además de programación recurrente
- Carga de archivos y flujos de trabajo de tareas respaldados por artefactos
- CLI/runtime empaquetada con gestión completa del ciclo de vida: `setup`, `run`, `restart`, `stop`, `status`, `health`, `logs`, `migrate`, `config`, `reset-password` y `rotate-secrets`
- Panel de React servido por el backend o el runtime empaquetado

## Dirección planificada

- Orquestación de flujos de trabajo más rica y encadenamiento de agentes
- Integraciones de herramientas de agentes más amplias
- Ergonomía de despliegue y runtime expandida

## Arquitectura de un vistazo

| Área | Stack |
| --- | --- |
| Backend | NestJS 11 + TypeScript 5 |
| Frontend | React SPA |
| Base de datos | PostgreSQL (producción) / SQLite vía `better-sqlite3` (local/runtime) |
| ORM | TypeORM |
| Autenticación | Tokens de acceso/actualización JWT mediante cookies httpOnly |
| Empaquetado | Paquete npm con backend, CLI y activos de UI incluidos |

## Requisitos previos

- [Node.js](https://nodejs.org/) 24 o superior
- npm
- [Docker](https://www.docker.com/) y Docker Compose (opcional)
- Al menos una clave de API de proveedor o servidor de modelo local para ejecutar agentes:
  - [Clave de API de Google Gemini](https://aistudio.google.com/)
  - [Clave de API de Anthropic](https://console.anthropic.com/)
  - [Ollama](https://ollama.com/) ejecutándose localmente (sin clave) o un endpoint Ollama en la nube

## Inicio rápido

Elige el camino que mejor se adapte a cómo quieres usar el proyecto:

- **CLI/runtime empaquetada**: la forma más rápida de ejecutar la aplicación localmente como una herramienta instalada
- **Checkout de código fuente**: el mejor camino para el desarrollo y la contribución

### Opción A: CLI/runtime empaquetada

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
```

`setup` puede crear el `.env` del runtime, ejecutar migraciones, sembrar un usuario administrador y avisarte para aplicar las migraciones pendientes después de las actualizaciones del paquete. `run` no actualiza la base de datos automáticamente. El directorio personal por defecto del runtime es `~/.agent-orchestrator`, o `${AGENT_ORCHESTRATOR_HOME}` si lo configuras explícitamente.

Para un uso más profundo de la CLI, consulta [CLI.md](CLI.md).

### Opción B: checkout de código fuente

```bash
git clone https://github.com/bpinhosilva/agent-orchestrator.git
cd agent-orchestrator
npm install
npm rebuild --ignore-scripts=false
npm run build:all
```

> **Nota**: El repositorio utiliza `ignore-scripts=true` en `.npmrc` para el endurecimiento de la cadena de suministro. Después de `npm install`, ejecuta `npm rebuild --ignore-scripts=false` para que los módulos nativos como `bcrypt` y `better-sqlite3` se compilen realmente.

Si quieres usar el comportamiento de la CLI empaquetada desde un checkout de código fuente, ejecuta el punto de entrada construido directamente:

```bash
node dist/cli/index.js --help
```

## Configurar el runtime

La aplicación carga la configuración desde:

- `${AGENT_ORCHESTRATOR_HOME}/.env` cuando `AGENT_ORCHESTRATOR_HOME` está configurado
- `.env` en la raíz del proyecto/paquete en caso contrario

Ejemplo de `.env`:

```bash
# Obligatorio
JWT_SECRET="reemplaza-con-un-secreto-de-al-menos-32-caracteres"
JWT_REFRESH_SECRET="reemplaza-con-otro-secreto-de-al-menos-32-caracteres"

# Claves de proveedor (opcional hasta que quieras ejecutar agentes)
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""

# Ollama (local por defecto; define OLLAMA_HOST y OLLAMA_API_KEY para uso en la nube)
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_API_KEY=""

# Base de datos
DB_TYPE=sqlite
DATABASE_URL=

# Runtime
HOST=127.0.0.1
PORT=15789
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SCHEDULER_ENABLED=true
DB_LOGGING=false
SERVE_STATIC_UI=true
CHECK_PENDING_MIGRATIONS_ON_STARTUP=false
LOG_LEVEL=error
```

## Configuración de la base de datos

### SQLite

SQLite es la opción local/runtime por defecto cuando `DATABASE_URL` no está configurada. El archivo de la base de datos reside en:

- `local.sqlite` en la raíz del proyecto/paquete, o
- `${AGENT_ORCHESTRATOR_HOME}/local.sqlite` cuando el home del runtime está configurado

> **Importante — el servidor de desarrollo y el runtime de la CLI usan bases de datos distintas por defecto.**
> `npm run dev` usa `./local.sqlite` en la raíz del proyecto. `node dist/cli/index.js` (o el binario `agent-orchestrator`) usa `~/.agent-orchestrator/local.sqlite`.
> Para ejecutar comandos de la CLI contra la base de datos del servidor de desarrollo, define `AGENT_ORCHESTRATOR_HOME`:
>
> ```bash
> AGENT_ORCHESTRATOR_HOME=$(pwd) node dist/cli/index.js reset-password
> ```

### PostgreSQL

Usa PostgreSQL configurando `DATABASE_URL` o `DB_TYPE=postgres`:

```bash
export DATABASE_URL="postgresql://orchestrator:orchestrator_password@localhost:5433/agent_orchestrator"
```

### Inicializar el esquema

Ejecuta las migraciones antes del primer inicio de la aplicación:

```bash
npm run migration:run
```

Crea el usuario administrador inicial si quieres iniciar sesión a través del panel de control:

```bash
npm run seed:admin
```

Si usas la CLI empaquetada, `agent-orchestrator setup` puede realizar ambos pasos por ti.

## Ejecutar la aplicación

### Desarrollo local

```bash
npm run dev
```

Esto inicia:

- Servidor de desarrollo de UI: `http://localhost:5173` (accesible desde su red local)
- API: `http://localhost:3000/api/v1` (accesible desde su red local)
- Swagger UI: `http://localhost:3000/api` (solo para entornos de no producción)
- Endpoint de salud: `http://localhost:3000/health`

Por defecto, los servidores de desarrollo se vinculan a `0.0.0.0`, permitiendo el acceso desde otros dispositivos en la misma red utilizando la dirección IP local de su máquina.

Si solo quieres la API en modo watch:

```bash
npm run start:dev
```

### Modo empaquetado/runtime

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
agent-orchestrator logs --lines 50
agent-orchestrator restart
agent-orchestrator stop
```

Al ejecutar la aplicación empaquetada o una construcción de producción con la UI estática habilitada, el panel de control se sirve desde `http://localhost:15789` por defecto.

## Docker

El repositorio incluye tres puntos de entrada de Compose:

Todas las pilas de Compose requieren las variables de base de datos en `.env`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` y `POSTGRES_TEST_DB` para la pila de integración. La pila de producción también acepta `DOMAIN` (por defecto: `localhost`) y `ALLOWED_ORIGINS` (por defecto: `https://localhost`) para despliegues con dominio personalizado.

| Archivo | Propósito |
| --- | --- |
| `docker-compose.yml` | Pila de estilo producción con PostgreSQL, API y UI servida por Caddy |
| `docker-compose.dev.yml` | Pila de desarrollo con recarga en caliente de API y servidor de desarrollo Vite para UI |
| `docker-compose.test.yml` | Pila de integración para verificaciones de migración, CLI/runtime, API y UI |

### Pila de estilo producción

**Paso 1: Crea el `.env`** — copia el ejemplo en la raíz del repositorio y rellena con tus valores:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=agent_orchestrator

JWT_SECRET=<secreto-de-al-menos-32-chars>
JWT_REFRESH_SECRET=<secreto-de-al-menos-32-chars>

# Para seed-admin:
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

**Paso 2: Ejecuta las migraciones**

```bash
docker compose --profile tools run --rm migrate
```

**Paso 3: Crea el usuario administrador** — las credenciales se leen de `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`, nunca de flags de línea de comandos.

```bash
docker compose --profile tools run --rm seed-admin
```

**Paso 4: Inicia la pila**

```bash
docker compose up -d
```

Accede en `https://localhost` (el navegador mostrará un aviso sobre el certificado autofirmado — haz clic en continuar).

**Detener:**

```bash
docker compose down      # detener, conservar datos
docker compose down -v   # detener y borrar todos los datos (incluido el volumen de PostgreSQL)
```

**Dominio personalizado:**

```bash
DOMAIN=misitioweb.com
ALLOWED_ORIGINS=https://misitioweb.com
```

Caddy provisiona automáticamente certificados Let's Encrypt para dominios públicos reales.

En esta pila, la UI es servida por **Caddy**, no por la aplicación Nest. Docker establece explícitamente `SERVE_STATIC_UI=false` para que el backend solo sirva la API.

### Pila de desarrollo

```bash
npm run docker:dev
```

Endpoints:

- UI: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- PostgreSQL: `localhost:5433`

### Pila de integración

Usa `docker-compose.test.yml` cuando quieras ejercitar juntos el comportamiento de migración, los flujos de CLI/runtime empaquetados, el inicio de la API y la accesibilidad de la UI.

```bash
npm run docker:test
docker compose -f docker-compose.test.yml --profile tools run --rm migrate
docker compose -f docker-compose.test.yml --profile tools run --rm cli
```

Endpoints:

- UI: `https://localhost:8444`
- API: `https://localhost:8444/api/v1`

## Flujo de trabajo de desarrollo

| Tarea | Comando |
| --- | --- |
| Iniciar API + UI | `npm run dev` |
| Iniciar solo API | `npm run start:dev` |
| Lint API + UI | `npm run lint:all` |
| Ejecutar pruebas API + UI + E2E | `npm run test:all` |
| Ejecutar cobertura | `npm run test:cov` |
| Ejecutar pruebas E2E | `npm run test:e2e` |
| Construir backend + salida del paquete UI | `npm run build:all` |
| Aplicar migraciones | `npm run migration:run` |

## Modelo de autenticación y acceso

- Los tokens de acceso y de actualización son emitidos por el servicio de autenticación y transportados mediante **cookies httpOnly**
- Los roles del sistema son **`admin`** y **`user`**
- Los roles de membresía del proyecto son **`owner`** y **`member`**
- Las rutas están protegidas por defecto; usa `@Public()` para puntos finales públicos
- El estrangulamiento global por defecto es `60/min`, con límites más estrictos en los puntos finales de autenticación

## Documentos útiles

- [Referencia de CLI](CLI.md)
- [Guía Docker](DOCKER.md)
- [Pipeline de CI/CD](CI_CD.md)
- [Proceso de lanzamiento](RELEASE.md)
- [Guía de contribución](../../../CONTRIBUTING.md)

## Resolución de problemas

- **Errores de módulos nativos después de instalar**: ejecuta `npm rebuild`
- **`JWT_SECRET` rechazado**: debe tener al menos 32 caracteres
- **La ejecución del agente falla inmediatamente**: confirma que `GEMINI_API_KEY` y/o `ANTHROPIC_API_KEY` están configuradas
- **Problemas de esquema/inicio**: ejecuta `npm run migration:run`
- **Necesitas deshacer la última migración**: ejecuta `npm run migration:revert`
- **Necesitas restablecer la contraseña de un usuario**: usa `agent-orchestrator reset-password` — esto también revoca todas las sesiones activas de ese usuario. Si el servidor de desarrollo (`npm run dev`) está en ejecución, la CLI apunta a una base de datos distinta por defecto; usa `AGENT_ORCHESTRATOR_HOME=$(pwd) node dist/cli/index.js reset-password`
- **Necesitas rotar los secretos JWT** (p. ej., tras una filtración de credenciales): usa `agent-orchestrator rotate-secrets` — esto regenera `JWT_SECRET` y `JWT_REFRESH_SECRET`, invalida todas las sesiones activas y reinicia el servidor automáticamente si está en ejecución

- **Las tareas permanecen en el backlog y no se ejecutan**: el planificador solo procesa tareas de proyectos con estado **Activo**. Los proyectos se crean con estado `Planificación` por defecto. Cambia el estado del proyecto a **Activo** en la interfaz para habilitar la ejecución de tareas.

## Licencia

Consulta [LICENSE](../../../LICENSE).
