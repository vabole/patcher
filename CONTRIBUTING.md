# Contributing to Patcher

Thank you for considering contributing to Patcher!

## How to contribute

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure they pass (`npm test`)
5. Commit your changes (`git commit -am 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`

## Testing

We have a test suite that verifies the functionality of the patcher:

```bash
# Run tests
npm test

# Apply test patches
npm run test:patch

# Undo test patches
npm run test:undo
```

## Pull Request Guidelines

* Keep PRs focused on a single feature or bug fix
* Include tests for new features or bug fixes
* Update documentation if necessary
* Follow the existing code style

Thanks for your contributions!