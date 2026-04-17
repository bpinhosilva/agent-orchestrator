# Lanzamiento

Los lanzamientos están automatizados por el trabajo de `release` dentro de `.github/workflows/ci.yml` y configurados por `.releaserc.json`.

## Política de ramas

| Rama | Tipo de lanzamiento | npm tag | Versión de ejemplo |
| --- | --- | --- | --- |
| `main` | Estable | `latest` | `1.2.0` |
| `alpha` | Prelanzamiento | `alpha` | `1.2.0-alpha.3` |

Las versiones de prelanzamiento en `alpha` reciben automáticamente el sufijo `-alpha.N` de semantic-release.

## Cuándo ocurre un lanzamiento

En los pushes a `main` o `alpha`, semantic-release inspecciona los mensajes de commit desde el último lanzamiento.

Tipos de commit dignos de lanzamiento:

- `feat:` -> minor
- `fix:` -> patch
- `perf:` -> patch
- `BREAKING CHANGE:` -> major

Tipos comunes que no generan lanzamientos, como `docs:`, `test:` y `chore:`, no publican una nueva versión por sí mismos.

## Qué actualiza semantic-release

Cuando se publica un lanzamiento, semantic-release:

1. Calcula la siguiente versión
2. Actualiza `CHANGELOG.md`
3. Publica en npm
4. Crea un lanzamiento en GitHub
5. Realiza un commit con los artefactos de lanzamiento actualizados de vuelta al repositorio

## Trusted publishing

El trabajo de lanzamiento solicita un token OIDC de GitHub (`id-token: write`) y publica en npm a través de Trusted Publishing. Esto evita almacenar tokens de acceso npm de larga duración en los secretos del repositorio.

## Si no ocurre un lanzamiento

- Si CI falla, el trabajo de lanzamiento no se ejecuta.
- Si los commits pusheados no son elegibles para lanzamiento, semantic-release sale sin publicar una versión.
- Si esperas un lanzamiento y no lo obtienes, verifica primero los mensajes de commit.

## Empujón manual de lanzamiento

Si necesitas disparar un ciclo de lanzamiento intencionalmente, pushea un commit elegible para lanzamiento:

```bash
git commit --allow-empty -m "fix: disparar lanzamiento"
git push origin alpha
```
