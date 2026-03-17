# Contributing to Agent Orchestrator

First off, thank you for considering contributing to this project!

## 1. Local Development Setup

To get your environment set up:

1. **Clone the repository:**
   ```bash
   git clone <your-fork-url>
   cd agent-orchestrator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run start:dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## 2. Branching Strategy (GitHub Flow)

We use exactly **one** long-lived branch: `main`.

1. Always create a new branch from `main` for your work.
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes locally.
3. Push to your fork and submit a Pull Request against our `main` branch.

## 3. Commit Message Conventions (Conventional Commits)

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). This project uses `husky` and `commitlint` to automatically enforce these rules when you commit.

Your commit messages MUST follow this format:
```
<type>(<optional scope>): <description>

[optional body]
```

* **`feat:`** A new feature
* **`fix:`** A bug fix
* **`docs:`** Documentation only changes
* **`style:`** Changes that do not affect the meaning of the code (white-space, formatting, etc)
* **`refactor:`** A code change that neither fixes a bug nor adds a feature
* **`perf:`** A code change that improves performance
* **`test:`** Adding missing tests or correcting existing tests
* **`chore:`** Changes to the build process or auxiliary tools and libraries such as documentation generation

**Example:**
```
feat(gemini): add support for gemini-2.5-flash-lite
```
