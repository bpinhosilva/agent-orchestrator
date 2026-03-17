# Agent Orchestrator TODO List

These are features and concepts to be discussed and implemented later:

- [ ] **Database Schema:** Model schema for agents, agent profiles (head, researcher, etc.), tasks, and workflows.
- [ ] **Authentication & Authorization:** Secure the API and frontend dashboard.
- [ ] **Executable Creation:** Implement ability to run project as an executable using `npx` or `pnpm`.
- [ ] **Release Management:** Set up semantic versioning (v0.x, v1.x) and branching strategies. (Standard today for OSS is GitHub Flow or Trunk-Based Development, rather than gitflow which is considered too heavy for most modern continuous delivery workflows).
- [ ] **CI/CD Pipelines:** GitHub Actions for automated unit testing (Jest), deployment, and PR validations.
- [ ] **Task & Job Execution:** Structure the database and execution flow for tasks assigned to agents.
- [ ] **Agent Workflow Engine:** Build a drag-and-drop workflow system with node triggers, inputs, and outputs.
- [ ] **Extended Capabilities:** Add "read file", "write file", "search web", "send e-mail", and image generation (NanoBanana).
- [ ] **Full Frontend Application:** Replace static placeholder with the React administrative dashboard.
- [ ] **Metrics:** Expose system metrics (e.g., Prometheus/Grafana) to monitor application health and performance.
