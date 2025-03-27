# GitHub Reactions Counter Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that automatically counts reactions on GitHub Issues and updates
a corresponding GitHub Project field with the count. This is useful for tracking
engagement and popularity of issues in your project.

## Features

- Counts reactions on GitHub Issues
- Updates a specified field in a GitHub Project with the reaction count
- Only updates when the count has changed
- Uses GitHub's GraphQL API for efficient data fetching

## Usage

```yaml
steps:
  - name: Count Reactions
    uses: finol-digital/reactions-counter@v1
    with:
      project-url: 'https://github.com/finol-digital/Card-Game-Simulator/projects/1'
      github-token: ${{ secrets.CGS_PAT }}
      field-name: 'Reactions'
```

### Inputs

| Input          | Description                                                                                     | Required |
| -------------- | ----------------------------------------------------------------------------------------------- | -------- |
| `project-url`  | The URL of the GitHub Project to update (format: <https://github.com/org/repo/projects/number>) | Yes      |
| `github-token` | The GitHub token to use for authentication                                                      | Yes      |
| `field-name`   | The name of the field in the GitHub Project to update with the reaction count                   | Yes      |

### Outputs

| Output   | Description                        |
| -------- | ---------------------------------- |
| `status` | The status of the action execution |

## Example

Here's a complete example of how to use this action in a workflow:

```yaml
name: Update Reaction Counts

on:
  schedule:
    - cron: '0 0 * * *' # Run daily at midnight

jobs:
  update-reactions:
    runs-on: ubuntu-latest
    steps:
      - name: Count Reactions
        uses: finol-digital/reactions-counter@v1
        with:
          project-url: 'https://github.com/finol-digital/Card-Game-Simulator/projects/1'
          github-token: ${{ secrets.CGS_PAT }}
          field-name: 'Reactions'
```

## Development

### Prerequisites

- Node.js 20.x or later
- npm

### Setup

1. Clone the repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the action:

   ```bash
   npm run bundle
   ```

4. Run tests:

   ```bash
   npm test
   ```

5. Run all:

   ```bash
   npm run all
   ```

### Local Testing

You can test the action locally using the `@github/local-action` utility:

```bash
npx @github/local-action . src/main.ts .env
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
