# Lançamento

Os lançamentos são automatizados pela tarefa `release` dentro de `.github/workflows/ci.yml` e configurados por `.releaserc.json`.

## Política de branch

| Branch | Tipo de Lançamento | Tag npm | Exemplo de versão |
| --- | --- | --- | --- |
| `main` | Estável | `latest` | `1.2.0` |
| `alpha` | Pré-lançamento | `alpha` | `1.2.0-alpha.3` |

Versões de pré-lançamento na branch `alpha` recebem automaticamente o sufixo `-alpha.N` a partir do semantic-release.

## Quando um lançamento acontece

Em pushes para `main` ou `alpha`, o semantic-release inspeciona mensagens de commit desde o último lançamento.

Tipos de commit que geram lançamento:

- `feat:` -> minor (menor)
- `fix:` -> patch (correção)
- `perf:` -> patch (correção)
- `BREAKING CHANGE:` -> major (maior)

Tipos comuns sem lançamento como `docs:`, `test:`, e `chore:` não publicam uma nova versão por si mesmos.

## O que o semantic-release atualiza

Quando um lançamento é publicado, o semantic-release:

1. Calcula a próxima versão
2. Atualiza o `CHANGELOG.md`
3. Publica para o npm
4. Cria um GitHub release
5. Faz o commit dos artefatos de lançamento atualizados de volta para o repositório

## Trusted publishing (Publicação Confiável)

A tarefa de lançamento solicita um token OIDC do GitHub (`id-token: write`) e publica para o npm através do Trusted Publishing. Isso evita o armazenamento de tokens de acesso de longa duração do npm nos segredos do repositório.

## Se um lançamento não acontecer

- Se a CI falhar, a tarefa de lançamento não roda.
- Se os commits do push não forem elegíveis para lançamento, o semantic-release encerra sem publicar uma versão.
- Se você espera um lançamento e não tiver um, cheque as mensagens de commit primeiro.

## Empurrão manual para lançamento

Se você precisar iniciar um ciclo de lançamento intencionalmente, faça o push de um commit elegível para lançamento:

```bash
git commit --allow-empty -m "fix: trigger release"
git push origin alpha
```
