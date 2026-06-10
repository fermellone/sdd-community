# SDD Community

SDD Community is a community-built companion for the [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai) Spec-Driven Development workflow. It helps the Gentle-AI community compare AI providers and models across SDD phase agents, so model choices can be discussed, voted on, and improved in one shared place.

## Why this exists

AI coding tools move fast, but good software still needs clear intent, explicit tradeoffs, and reviewable implementation steps. This project focuses on making the Gentle-AI SDD workflow easier to inspect, discuss, and improve as a community.

## Built for the Gentle-AI community

[Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai), created by Alan Buscaglia and the Gentleman Programming community, is an ecosystem configurator for AI coding agents. It adds persistent memory, curated skills, Spec-Driven Development workflows, MCP integrations, provider switching, and per-phase model assignment to agents such as OpenCode, Claude Code, Cursor, Gemini CLI, Codex, and others.

This project was created from inside that community. It is not a replacement for Gentle-AI; it is a community space around one of its most important decisions: which model should run each SDD phase. Gentle-AI can assign different models to different SDD phase agents—for example exploration, proposal, specification, design, tasks, implementation, verification, and archive. SDD Community makes those choices visible and comparable instead of leaving them hidden in local configuration.

## Features

- Browse SDD phases in a visual grid.
- Filter phases by AI provider.
- View provider and model data from a Postgres-compatible database.
- Compare community preferences for model choices across SDD phase responsibilities.
- Support authenticated user context with Clerk.
- Use a modern Next.js, React, Drizzle, Tailwind CSS, and Vitest stack.

## Tech stack

| Area | Tooling |
| --- | --- |
| App framework | Next.js 16, React 19 |
| Auth | Clerk |
| Database | Neon/Postgres with Drizzle ORM |
| Styling | Tailwind CSS, Base UI, shadcn-compatible components |
| Testing | Vitest, Testing Library, jsdom |
| Code quality | Biome |

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm
- A Clerk application
- A Neon or Postgres-compatible database

### Installation

```bash
pnpm install
cp .env.local.example .env.local
```

Fill in the required values in `.env.local`, then prepare the database:

```bash
pnpm db:migrate
pnpm db:seed
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server. |
| `pnpm build` | Build the production application. |
| `pnpm start` | Start the production server. |
| `pnpm test` | Run the test suite once. |
| `pnpm test:watch` | Run tests in watch mode. |
| `pnpm lint` | Run Biome checks. |
| `pnpm format` | Format files with Biome. |
| `pnpm db:generate` | Generate Drizzle migrations. |
| `pnpm db:migrate` | Apply Drizzle migrations. |
| `pnpm db:push` | Push the current schema to the database. |
| `pnpm db:studio` | Open Drizzle Studio. |
| `pnpm db:seed` | Seed local development data. |

## Project structure

```text
src/
  app/          Next.js app routes and pages
  components/   Reusable UI components
  db/           Database connection, schema, and seed logic
  lib/          Shared queries and utilities
```

## Contributing

Contributions are welcome. The best contributions are small, focused, and easy to review.

Before opening a pull request:

1. Create or pick an issue that describes the problem.
2. Keep the change scoped to one concern.
3. Run the checks locally:

```bash
pnpm lint
pnpm test
pnpm build
```

If your change affects database behavior, include the relevant Drizzle migration and mention how you tested it.

## Community expectations

- Be respectful and constructive in issues and reviews.
- Explain the problem before proposing a solution.
- Prefer clear tradeoffs over clever abstractions.
- Keep documentation updated when behavior changes.

## Credits and references

The model catalog and SDD phase framing were built with references and community material from:

- [Alan Buscaglia / Gentleman Programming](https://github.com/Gentleman-Programming)
- [RamonsDka](https://github.com/RamonsDka)

The Gentle-AI documentation was used to align this project with its SDD agent and OpenCode profile concepts, where different models can be assigned to different SDD phases. SDD Team Optimizer by RamonsDka also informed the model catalog and model-selection framing.

See [NOTICE](NOTICE) for project references and license attribution details.

## License

This project is licensed under the [MIT License](LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, as long as the original copyright and license notice are included.
