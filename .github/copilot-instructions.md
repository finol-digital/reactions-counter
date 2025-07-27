# Reactions Counter Action

This is a TypeScript-based GitHub Action that automatically counts reactions on
GitHub Issues and updates a corresponding GitHub Project field with the count.
Please follow these guidelines when contributing:

## Code Standards

### Required Before Each Commit

- Run `npm run format:write` to ensure consistent code formatting with Prettier
- Run `npm run lint` to check for ESLint violations
- Run `npm test` to ensure all tests pass

### Development Flow

- Build: `npm run bundle` (compiles TypeScript and bundles)
- Test: `npm test` (runs Jest unit tests)
- Full check: `npm run all` (format, lint, test, coverage, package)

## Repository Structure

- `src/`: Core TypeScript source code
  - `main.ts`: Main entry point and action orchestration/execution
  - `index.ts`: Action entrypoint that calls run()
- `__fixtures__/`: Fixtures for testing, including mock Octokit responses
- `__tests__/`: Jest unit tests for all source files
- `dist/`: Compiled and bundled JavaScript output (generated)
- `action.yml`: GitHub Action metadata and interface definition
- `script/`: Release automation scripts
- `badges/`: Generated coverage and status badges

## Key Guidelines

1. Follow TypeScript strict mode and best practices
1. Use clear, descriptive variable and function names
1. Add TSDoc comments for all public methods and classes
1. Write comprehensive unit tests using Jest for all new functionality
1. Keep functions focused and manageable (generally under 50 lines)
1. Use consistent error handling with @actions/core.setFailed()
1. Validate inputs and provide meaningful error messages
1. Use @actions/core for all GitHub Actions integrations (inputs, outputs,
   logging)
1. Maintain backwards compatibility for action inputs/outputs
