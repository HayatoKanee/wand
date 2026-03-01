# Contributing to Wand

Thanks for your interest in contributing to Wand! This guide will help you get set up and familiar with the project.

## Prerequisites

- **Node.js** 20+
- **pnpm** 10+

## Setup

```bash
# Clone the repo
git clone https://github.com/HayatoKanee/wand.git
cd wand

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
packages/
  core/                 # Domain types, ports, orchestration engine
  react/                # React hooks (useWand), components (WandProvider, WandFeed), primitives
  adapter-anthropic/    # Anthropic Claude adapter
  adapter-openai/       # OpenAI adapter
  devtools/             # Inspector, logger, scene replay
examples/               # Example applications
```

## Development

```bash
# Run all packages in dev/watch mode
pnpm dev

# Type-check all packages
pnpm typecheck

# Run tests in watch mode
pnpm test
```

The monorepo uses [Turborepo](https://turbo.build/) for task orchestration and [Changesets](https://github.com/changesets/changesets) for versioning.

## Making Changes

1. **Fork** the repository and create a branch from `main`
2. Make your changes
3. Add or update **tests** for your changes
4. Run `pnpm build && pnpm test && pnpm typecheck` to verify everything passes
5. Open a **pull request** against `main`

## Code Style

- **TypeScript strict mode** — no `any` types
- Exports via **barrel files** (`index.ts`)
- Use **interfaces** for public API shapes
- Keep the core package **framework-agnostic** (no React imports)

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) style:

```
feat(react): add useWand hook
fix(core): handle empty scene gracefully
docs: update README quick start
chore: bump dependencies
```

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Link related issues if applicable

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
