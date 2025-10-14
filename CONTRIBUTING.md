# Contributing to INT Smart Triage AI 2.0

Thank you for your interest in contributing! This guide will help you get started.

## Quick Start

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/INT-Smart-Triage-AI-2.0.git
cd INT-Smart-Triage-AI-2.0

# 2. Use correct Node.js version
nvm use

# 3. Install dependencies
npm install

# 4. Create a feature branch
git checkout -b feature/your-feature-name

# 5. Make your changes and validate
npm run validate

# 6. Commit and push
git add .
git commit -m "feat: your descriptive message"
git push origin feature/your-feature-name

# 7. Create a pull request on GitHub
```

## Development Guidelines

### Code Quality

Before submitting a PR, ensure:
- ✅ All tests pass (`npm test`)
- ✅ Code is formatted (`npm run format`)
- ✅ No linting errors (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ Coverage meets thresholds (`npm run test:coverage-check`)

Run everything at once:
```bash
npm run validate
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add email notification feature
fix: resolve authentication timeout issue
docs: update API documentation
test: add unit tests for validation service
```

### Testing

Write tests for new features:
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Your Feature', () => {
  it('should do something specific', () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = yourFunction(input);
    
    // Assert
    assert.strictEqual(result.expected, 'value');
  });
});
```

### Code Style

- Use **ES Modules** (`import`/`export`)
- Use **const** by default, **let** when needed, **never var**
- Use **async/await** over callbacks
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Follow existing patterns in the codebase

## Pull Request Process

1. **Update Documentation**: Update README or other docs if needed
2. **Add Tests**: Write tests for new functionality
3. **Run Validation**: Ensure `npm run validate` passes
4. **Create PR**: Write a clear description of your changes
5. **Address Feedback**: Respond to review comments promptly
6. **Keep Updated**: Rebase on `develop` if needed

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Getting Help

- 📖 Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for detailed guidelines
- 🐛 Search [existing issues](https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0/issues)
- 💬 Ask questions in issue comments
- 📧 Contact maintainers if needed

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing!** 🎉

Your efforts help make this project better for everyone.
