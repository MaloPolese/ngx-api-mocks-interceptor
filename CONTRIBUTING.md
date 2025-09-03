# Contributing to NgxMockInterceptor

First off, thanks for taking the time to contribute! 🎉

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Run tests to ensure everything is set up correctly:
```bash
pnpm test
```

## Development Workflow

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and ensure:
   - All tests pass: `pnpm test`
   - Code style is correct: `pnpm lint`
   - Build succeeds: `pnpm build`

3. Commit your changes using conventional commits:
```bash
pnpm run commit
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation if needed
3. Add tests for any new features
4. Ensure all status checks pass
5. The PR will be merged once you have the sign-off of at least one maintainer

## Commit Guidelines

We use conventional commits for our commit messages. Each commit message should be structured as follows:

```
type(scope): subject

body

footer
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

Scopes:
- lib: Changes to the library code
- demo: Changes to the demo application
- docs: Changes to documentation
- ci: Changes to CI configuration
- deps: Dependencies updates

## Release Process

Releases are automated through our GitHub Actions workflow when a new release is created in GitHub.

## Questions?

Feel free to open an issue for any questions or concerns!