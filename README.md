# Agent Orchestrator

Agent Orchestrator is an open-source project designed to manage and orchestrate AI agents using both back-end services and front-end applications. It provides an automated agentic execution environment where you can create multiple agent profiles (e.g., Head Agent, Researcher, CMO) and delegate tasks to them through automated workflows.

## Features (In Progress & Planned)
- **Agent Delegation**: Delegate tasks to specialized AI agents.
- **Job Scheduler**: Create and schedule recurring agentic tasks.
- **Workflow Engine**: Drag-and-drop workflow builder supporting triggers, agent chaining, and outputs.
- **Agent Capabilities**: File reading/writing, web search, email capabilities, and image generation using NanoBanana.
- **TUI/CLI Tooling**: CLI executables to manage the installation and local agent configuration.

## Current Architecture
- **Backend Framework**: NestJS + TypeScript
- **Frontend SPA**: React (Currently served as a single placeholder HTML file by the backend for MVP)
- **Database**: PostgreSQL (via Docker Compose)
- **Testing**: Jest (TDD Approach with Unit & E2E)
- **Architecture**: 3-Tier (Controller, Service, DAL/Adapter Interfaces)

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) and Docker Compose (Optional for local PostgreSQL deployment)
- A [Google Gemini API Key](https://aistudio.google.com/)

## Installation

```bash
$ npm install
```

## Running the app

Before running the application, ensure you have set the `GEMINI_API_KEY` in your environment variables, as the default agent is the `GeminiAgent`.

```bash
# Start the PostgreSQL Database
$ docker compose up -d

# development
$ GEMINI_API_KEY="your-api-key" npm run start

# watch mode
$ GEMINI_API_KEY="your-api-key" npm run start:dev

# production mode
$ GEMINI_API_KEY="your-api-key" npm run start:prod
```

Once running, you can access the frontend dashboard container URL at `http://localhost:3000`. The API endpoints are accessible via `http://localhost:3000/api/v1/`.

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API usage

**Endpoint**: `POST /api/v1/agents/process`
**Payload**:
```json
{
  "input": "Write a short poem about automation."
}
```
