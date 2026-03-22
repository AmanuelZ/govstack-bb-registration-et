# Contributing to govstack-bb-registration-et

Thank you for your interest in contributing to the Ethiopian GovStack Registration Building Block reference implementation.

## Getting Started

### Prerequisites

- Node.js 18+ (20 recommended)
- Docker Compose v2+
- Git

### Development Setup

```bash
git clone https://github.com/AmanuelZ/govstack-bb-registration-et.git
cd govstack-bb-registration-et
npm install
cp .env.example .env
docker compose up postgres redis mock-fayda -d
npx prisma db push
npm run db:seed
npm run dev
```

## Ways to Contribute

- Report bugs via GitHub Issues
- Improve workflow logic and Ethiopian business rules
- Add Amharic translations for eForm labels
- Improve test coverage (target: 80%+)
- Improve documentation and API examples

## Code Style

- **TypeScript strict mode** with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
- **ESM modules** with `.js` extension on all imports
- **ESLint + Prettier** enforced in CI
- Run `npm run lint` and `npm run format:check` before committing

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ESIC code validation to manufacturing permit
fix: correct late penalty calculation for leap years
docs: update Fayda integration guide
test: add shareholder percentage validation tests
chore: update prisma to v5.23
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write code and tests
4. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
5. Submit a PR targeting `main`
6. Maintainer review within 5 business days

## Test Requirements

- All existing tests must pass
- New features must include unit tests
- Workflow determinant changes must include test cases for each rule
- Target 80%+ line coverage

## GovStack Alignment

Contributions must maintain compliance with the [GovStack Registration Building Block specification](https://govstack.gitbook.io/bb-registration). If your change affects:

- Application lifecycle states, reference Reg BB 3.2
- Task processing, reference Reg BB 3.3
- Document handling, reference Reg BB 3.4
- Fee integration, reference Reg BB 3.5

## Ethiopian Context

Business logic changes should reference the relevant Ethiopian legislation:

- **Commercial Code**: Proclamation 1243/2021 (entity types, capital requirements, shareholder rules)
- **Trade License**: Proclamation 685/2010 (renewal fees, fiscal year, late penalties)
- **Manufacturing**: Investment Proclamation 1180/2020, ESIA Proclamation 299/2002

## License

All contributions are licensed under MIT. By submitting a PR, you agree that your contributions will be licensed under the same terms.
