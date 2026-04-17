# Guía Docker

Este documento es la referencia definitiva para ejecutar Agent Orchestrator con Docker Compose.

## Visión general

El repositorio incluye tres archivos Compose:

| Archivo | Propósito |
| --- | --- |
| `docker-compose.yml` | Pila de estilo producción — PostgreSQL, API, Caddy (HTTPS) |
| `docker-compose.dev.yml` | Pila de desarrollo — recarga en caliente de la API, servidor dev Vite para la UI |
| `docker-compose.test.yml` | Pila de integración — verificaciones de migración, CLI/runtime, API, accesibilidad de la UI |

---

## Pila de producción

### Requisitos previos

- [Docker](https://www.docker.com/) 24 o superior
- Docker Compose v2 (`docker compose`, no `docker-compose`)

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto. La pila de producción requiere:

| Variable | Requerida | Por defecto | Descripción |
| --- | --- | --- | --- |
| `POSTGRES_USER` | ✅ | — | Nombre de usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | ✅ | — | Contraseña de PostgreSQL |
| `POSTGRES_DB` | ✅ | — | Nombre de la base de datos PostgreSQL |
| `JWT_SECRET` | ✅ | — | Secreto de firma HS256 para tokens de acceso (mín. 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secreto de firma HS256 para tokens de actualización (mín. 32 chars) |
| `ADMIN_EMAIL` | ✅ (seed-admin) | — | Email del usuario administrador (usado por el servicio `seed-admin`) |
| `ADMIN_PASSWORD` | ✅ (seed-admin) | — | Contraseña del usuario administrador (usado por el servicio `seed-admin`) |
| `ADMIN_NAME` | ❌ | `Admin` | Nombre para mostrar del usuario administrador |
| `DOMAIN` | ❌ | `localhost` | Nombre de dominio para el virtual host y TLS de Caddy |
| `ALLOWED_ORIGINS` | ❌ | `https://localhost` | Orígenes CORS permitidos separados por comas |

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

> Usa valores largos generados aleatoriamente para `JWT_SECRET` y `JWT_REFRESH_SECRET` en cualquier entorno que maneje datos reales.

### Configuración inicial

Ejecuta estos comandos una vez antes del primer `docker compose up`, y de nuevo después de actualizaciones que modifiquen el esquema.

**Ejecutar migraciones pendientes:**

```bash
docker compose --profile tools run --rm migrate
```

**Sembrar el usuario administrador inicial:**

```bash
docker compose --profile tools run --rm seed-admin
```

Las credenciales del administrador se leen de `ADMIN_EMAIL`, `ADMIN_PASSWORD` (y opcionalmente `ADMIN_NAME`) en `.env`. Nunca se pasan como flags de CLI — ver [Notas de seguridad](#notas-de-seguridad).

### Iniciar y detener

```bash
docker compose up -d          # iniciar en segundo plano
docker compose logs -f        # seguir los logs
docker compose down           # detener, conservar volúmenes de datos
docker compose down -v        # detener y eliminar todos los volúmenes (borra la base de datos)
```

### Actualización

```bash
docker compose down
docker compose pull            # o reconstruir: docker compose build
docker compose --profile tools run --rm migrate
docker compose up -d
```

### Dominio personalizado y TLS

Configura `DOMAIN` y `ALLOWED_ORIGINS` en `.env`:

```bash
DOMAIN=mysite.com
ALLOWED_ORIGINS=https://mysite.com
```

Caddy provisiona automáticamente certificados Let's Encrypt para dominios públicos. No se requiere configuración TLS adicional.

Para `localhost`, Caddy usa un certificado autofirmado de confianza local. Los navegadores mostrarán un aviso — haz clic para continuar o añade el certificado a tu almacén de confianza.

### Endpoints (por defecto `DOMAIN=localhost`)

| Servicio | URL |
| --- | --- |
| Panel de control | `https://localhost` |
| API | `https://localhost/api/v1` |

---

## Pila de desarrollo

```bash
npm run docker:dev
```

La pila de desarrollo monta tu árbol de código fuente en los contenedores y habilita la recarga en caliente tanto para la API (NestJS) como para la UI (Vite).

| Servicio | URL |
| --- | --- |
| UI (servidor dev Vite) | `http://localhost:5173` |
| API | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api` |
| Endpoint de salud | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5433` |

---

## Cómo funciona

```
Navegador / cliente
      │
      ▼
  Caddy (puertos 80 / 443)
      │
      ├─ /api/*  ──────────────────────► Servicio API (puerto 3000, interno)
      │                                        │
      └─ todo lo demás                         ▼
           servir archivos estáticos    PostgreSQL (puerto 5432, interno)
           (fallback index.html)
```

- **Caddy** termina TLS y enruta el tráfico. `/api/*` se redirige por proxy a la API; todos los demás caminos se sirven desde la compilación estática de la UI con fallback `index.html` para el enrutamiento del lado del cliente. Los bloques `handle` en `docker/Caddyfile` garantizan que las solicitudes de API se enruten por proxy antes de que el fallback del SPA pueda interceptarlas.
- **API** se vincula a `HOST=0.0.0.0` dentro del contenedor para ser alcanzable desde otros contenedores en la red Docker. El puerto 3000 solo está expuesto a la red interna `frontend` — no está mapeado al host.
- **PostgreSQL** está en la red `backend` que es `internal: true`. No es accesible desde el host.
- **Caddy** está en la red `frontend` (Caddy ↔ API) y expone los puertos 80 y 443 al host.

---

## Servicios de herramientas (`--profile tools`)

Estos servicios de ejecución única comparten la imagen de la API y se conectan a la red `backend`. Se excluyen de `docker compose up` a menos que pases `--profile tools`.

### `migrate`

Ejecuta las migraciones TypeORM pendientes contra la base de datos de producción.

```bash
docker compose --profile tools run --rm migrate
```

### `seed-admin`

Crea un usuario administrador inicial directamente vía TypeORM. Lee las credenciales de variables de entorno — no acepta flags de CLI.

```bash
docker compose --profile tools run --rm seed-admin
```

Variables de entorno requeridas: `ADMIN_EMAIL`, `ADMIN_PASSWORD`  
Variable de entorno opcional: `ADMIN_NAME` (por defecto: `"Admin"`)

El servicio termina con código no-cero si faltan las credenciales o si la creación del usuario falla.

---

## Notas de seguridad

- **Credenciales de administrador vía variables de entorno**: `seed-admin` lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` del entorno, no de flags de CLI. Pasar secretos como argumentos de CLI los expone en la tabla de procesos y en el historial del shell.
- **Red interna**: la red `backend` se declara `internal: true`. PostgreSQL no es alcanzable desde el host — solo desde contenedores en esa red.
- **Dirección de bind de la API**: `HOST=0.0.0.0` es necesario para que la API sea alcanzable desde Caddy dentro de Docker. El puerto 3000 no tiene mapeo de puerto al host, por lo que no es accesible desde fuera de la red Docker.
- **Secretos JWT**: usa valores largos generados aleatoriamente. La longitud mínima aceptada es de 32 caracteres. Rótalos con `agent-orchestrator rotate-secrets` si alguna vez se exponen.

---

## Solución de problemas

### Volumen PostgreSQL obsoleto (incompatibilidad de versión)

**Síntoma**: `db` falla en su verificación de salud con un mensaje como:

```
FATAL: data directory was initialized by PostgreSQL version 14, which is not compatible with this version 17
```

**Solución**: borra el volumen y reinicia.

```bash
docker compose down -v
docker compose --profile tools run --rm migrate
docker compose up -d
```

> `down -v` elimina todos los datos. Haz una copia de seguridad de lo que necesites primero.

### El contenedor de la API permanece no saludable

La API tiene un `start_period` de 30 segundos antes de que los fallos de verificación de salud cuenten. Si sigue no saludable después de ese tiempo, revisa los logs:

```bash
docker compose logs api
```

Causas comunes: `JWT_SECRET` ausente o inválido, fallo en la conexión a la base de datos, migraciones pendientes bloqueando el inicio (`CHECK_PENDING_MIGRATIONS_ON_STARTUP=true`).

### 502 Bad Gateway de Caddy

Caddy no puede alcanzar la API. Causas probables:

- `HOST` no está configurado como `0.0.0.0` en el servicio de API — la API se vinculará a `127.0.0.1` en modo producción por defecto, haciéndola inalcanzable desde otros contenedores.
- El contenedor de la API aún no está saludable — espera a que pase su verificación de salud.
- Una configuración de red incorrecta — verifica que la API esté en la red `frontend`.

### Aviso de certificado del navegador en localhost

Comportamiento esperado. Caddy emite un certificado firmado localmente para `localhost`. Haz clic para ignorar el aviso o añade el certificado al almacén de confianza de tu sistema operativo. Para dominios públicos, Caddy provisiona automáticamente un certificado Let's Encrypt real.

### Las tareas permanecen en el backlog y nunca son procesadas

El planificador solo procesa tareas que pertenecen a proyectos **ACTIVOS**. Los proyectos se crean con estado `PLANIFICACIÓN` por defecto.

Para habilitar la ejecución de tareas, abre el proyecto en la UI y cambia su estado a **Activo**. El planificador hace polling cada 20 segundos, por lo que las tareas deberían empezar a moverse poco después del cambio.
