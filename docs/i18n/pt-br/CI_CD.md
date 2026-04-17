# CI/CD

Este repositório usa GitHub Actions para integração contínua, automação de lançamentos e varredura de segredos.

## Workflows

| Workflow | Arquivo | Gatilho | Propósito |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Push + pull request na `main`, `alpha` | Executar build/teste/verificações de segurança e, apenas no push, executar a tarefa de lançamento |
| Gitleaks | `.github/workflows/gitleaks.yml` | Push + pull request na `main`, `alpha` | Varrer commits e histórico por vazamento de segredos |

## Tarefas de CI (CI jobs)

### `build-and-test`

A tarefa principal de CI roda os seguintes passos em ordem:

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

A tarefa de lançamento (release) faz parte do `ci.yml`, não é um arquivo de workflow separado.

- Roda apenas no **push**
- Espera que a `build-and-test` seja bem-sucedida
- Reconstrói o projeto, incluindo a CLI
- Publica usando semantic-release através do npm Trusted Publishing via GitHub OIDC

Para detalhes sobre o versionamento e a política de branches, veja [RELEASE.md](./RELEASE.md).

## Verificação local útil

Para maior paridade com a CI, rode:

```bash
npm audit --audit-level=high
npm run lint:all
npm run test:cov
npm run test:e2e
npm test --prefix ui
npm run build:all
```

Para uma iteração mais rápida no dia a dia, esse conjunto reduzido ainda é útil:

```bash
npm run lint:all
npm run test:all
```

## Notas

- A CI valida a integridade do lockfile e assinaturas de pacotes antes de executar o lint ou os testes.
- Módulos nativos são reconstruídos na CI porque instalações a partir do código-fonte usam configurações endurecidas no npm.
- Os plugins do semantic-release são instalados em tempo de execução na tarefa de lançamento antes da execução.
