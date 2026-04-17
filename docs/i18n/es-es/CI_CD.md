# CI/CD

Este repositorio utiliza GitHub Actions para la integración continua, la automatización de lanzamientos y el escaneo de secretos.

## Flujos de trabajo

| Flujo de trabajo | Archivo | Disparador | Propósito |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Push + pull request en `main`, `alpha` | Ejecutar verificaciones de construcción/prueba/seguridad y, solo en push, ejecutar el trabajo de lanzamiento |
| Gitleaks | `.github/workflows/gitleaks.yml` | Push + pull request en `main`, `alpha` | Escanear commits e historial en busca de secretos filtrados |

## Trabajos de CI

### `build-and-test`

El trabajo principal de CI ejecuta estos pasos en orden:

1. `npm ci`
2. `npm rebuild --ignore-scripts=false`
3. `npm ci --prefix ui --legacy-peer-deps`
4. `npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https`
5. `npm audit signatures`
6. `npm audit --audit-level=high`
7. `npm run lint:all`
8. `npm run test:cov`
9. `npm run test:e2e`
10. `npm test --prefix ui`
11. `npm run build:all`

### `release`

El trabajo de lanzamiento es parte de `ci.yml`, no un archivo de flujo de trabajo separado.

- Se ejecuta solo en **push**
- Espera a que `build-and-test` tenga éxito
- Reconstruye el proyecto, incluyendo la CLI
- Publica con semantic-release usando Trusted Publishing de npm a través de GitHub OIDC

Para detalles sobre la política de versiones y ramas, consulta [RELEASE.md](./RELEASE.md).

## Verificación local útil

Para la mayor paridad con CI, ejecuta:

```bash
npm audit --audit-level=high
npm run lint:all
npm run test:cov
npm run test:e2e
npm test --prefix ui
npm run build:all
```

Para una iteración diaria más rápida, este conjunto más pequeño sigue siendo útil:

```bash
npm run lint:all
npm run test:all
```

## Notas

- CI valida la integridad del lockfile y las firmas de los paquetes antes del linting o las pruebas.
- Los módulos nativos se reconstruyen en CI porque las instalaciones desde la fuente utilizan configuraciones de npm endurecidas.
- Los complementos de semantic-release se instalan en tiempo de ejecución en el trabajo de lanzamiento antes de la ejecución.
