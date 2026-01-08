# GitHub Assistant Agent - Quick Reference

## Quick Start

```bash
# Get capabilities
GET /api/github-assistant

# Process a request
POST /api/github-assistant
{
  "request": "What is this repo about?",
  "context": { "repoPath": "/path/to/repo" }
}
```

## Module Triggers

| Module                      | Trigger Examples                                 | Required Context         |
| --------------------------- | ------------------------------------------------ | ------------------------ |
| **Repository Understander** | "What is this repo about?", "Explain structure"  | `repoPath`               |
| **Code Summarizer**         | "Summarize this file", "Explain this code"       | `filePath`               |
| **PR Reviewer**             | "Review this PR", "Any issues in this code?"     | `changes`                |
| **Refactoring Advisor**     | "How can this be improved?", "Suggest refactors" | `code`, `filePath`       |
| **Test Coverage**           | "Are there enough tests?", "Generate tests"      | `sourceFile`, `testFile` |
| **Issue Triager**           | "Categorize this issue", "What label?"           | `issue`                  |
| **Project Planner**         | "Plan this feature", "Create roadmap"            | `feature`                |
| **Security Scanner**        | "Scan for security issues", "Any secrets?"       | `code`, `filePath`       |
| **CI/CD Inspector**         | "Review CI setup", "Why is build slow?"          | `configPath`             |

## Common Patterns

### Analyze a File

```javascript
{
  "request": "Summarize this file",
  "context": { "filePath": "/path/to/file.js" }
}
```

### Review Changes

```javascript
{
  "request": "Review this PR",
  "context": {
    "changes": {
      "additions": 100,
      "deletions": 20,
      "files": ["src/feature.js", "test/feature.test.js"]
    }
  }
}
```

### Check Security

```javascript
{
  "request": "Scan for security issues",
  "context": {
    "code": "const key = 'secret123';",
    "filePath": "config.js"
  }
}
```

### Plan Feature

```javascript
{
  "request": "Plan this feature",
  "context": {
    "feature": {
      "title": "User Authentication",
      "description": "Add login system"
    }
  }
}
```

### Triage Issue

```javascript
{
  "request": "Categorize this issue",
  "context": {
    "issue": {
      "title": "Bug: App crashes",
      "description": "Crashes on startup"
    }
  }
}
```

## Response Format

All responses follow this pattern:

```json
{
  "success": true,
  "...": "module-specific fields",
  "summary": "Human-readable summary"
}
```

## Error Responses

```json
{
  "success": false,
  "error": "Error message"
}
```

## CLI Examples

```bash
# Get capabilities
curl https://your-app.vercel.app/api/github-assistant

# Analyze repo
curl -X POST https://your-app.vercel.app/api/github-assistant \
  -H "Content-Type: application/json" \
  -d '{"request":"What is this repo about?","context":{"repoPath":"/repo"}}'

# Check security
curl -X POST https://your-app.vercel.app/api/github-assistant \
  -H "Content-Type: application/json" \
  -d '{"request":"Scan for security issues","context":{"code":"...","filePath":"file.js"}}'
```

## Testing

```bash
# Run all tests
npm test

# Run GitHub Assistant tests only
npm test -- test/githubAssistant.test.js

# Check agent status
npm run agents:status -- --agent github-assistant
```

## Key Features

✅ 9 specialized modules
✅ Smart request routing
✅ Comprehensive error handling
✅ REST API endpoint
✅ Full test coverage
✅ Integrated with agent runtime

## Links

- [Full Documentation](./GITHUB_ASSISTANT.md)
- [API Reference](./GITHUB_ASSISTANT.md#api-reference)
- [Usage Examples](./GITHUB_ASSISTANT.md#usage-examples)
- [Agent Registry](../agents/registry.json)
