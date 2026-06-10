# SDD Community

SDD Community is a Next.js app for exploring Spec-Driven Development phases, AI providers, and models in one shared interface. It is built to help teams compare implementation workflows, understand the SDD lifecycle, and contribute improvements around AI-assisted software delivery.

## Why this exists

AI coding tools move fast, but good software still needs clear intent, explicit tradeoffs, and reviewable implementation steps. This project focuses on making SDD workflows easier to inspect, discuss, and improve as a community.

## Features

- Browse SDD phases in a visual grid.
- Filter phases by AI provider.
- View provider and model data from a Postgres-compatible database.
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

## License

This project is licensed under the [MIT License](LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, as long as the original copyright and license notice are included.
