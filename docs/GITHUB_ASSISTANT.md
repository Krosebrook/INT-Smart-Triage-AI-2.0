# GitHub Assistant Agent Documentation

## Overview

The GitHub Assistant Agent is a modular AI-powered assistant embedded in the INT Smart Triage AI 2.0 platform. It provides 9 specialized capabilities to help developers work more efficiently with GitHub repositories.

## Capabilities

### 1. 📘 Repository Understander

**Purpose**: Analyze and explain repository structure, key components, technologies used, and file roles.

**Triggers**:

- "What is this repo about?"
- "Explain the structure"
- "Where is X implemented?"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "What is this repo about?",
  "context": {
    "repoPath": "/path/to/repository"
  }
}
```

**Response**:

```json
{
  "success": true,
  "structure": {
    "directories": ["src", "api", "test"],
    "files": ["package.json", "README.md"],
    "total": 5
  },
  "technologies": ["Node.js/JavaScript"],
  "packageInfo": {
    "name": "my-project",
    "version": "1.0.0",
    "description": "Project description"
  },
  "summary": "Project: my-project (v1.0.0)..."
}
```

### 2. 🧾 Code Summarizer

**Purpose**: Summarize specific files, diffs, commits, or pull requests in concise natural language.

**Triggers**:

- "Summarize this file"
- "Explain changes here"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Summarize this file",
  "context": {
    "filePath": "/path/to/file.js"
  }
}
```

**Response**:

```json
{
  "success": true,
  "filePath": "/path/to/file.js",
  "type": "JavaScript",
  "stats": {
    "totalLines": 100,
    "codeLines": 75,
    "commentLines": 15,
    "nonEmptyLines": 90
  },
  "summary": "File: file.js (JavaScript)..."
}
```

### 3. 👀 Pull Request Reviewer

**Purpose**: Review pull requests for quality, logic, testing, readability, and best practices.

**Triggers**:

- "Review this PR"
- "Any issues in this code?"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Review this PR",
  "context": {
    "changes": {
      "additions": 150,
      "deletions": 30,
      "files": ["src/feature.js", "test/feature.test.js"]
    }
  }
}
```

**Response**:

```json
{
  "success": true,
  "issues": [
    {
      "severity": "warning",
      "message": "Large PR: Consider breaking into smaller changes",
      "line": null
    }
  ],
  "suggestions": [],
  "summary": "Pull Request Review\nChanges: +150 -30..."
}
```

### 4. 🧠 Refactoring Advisor

**Purpose**: Suggest improvements to code, structure, duplication, naming, and logic.

**Triggers**:

- "How can this be improved?"
- "Suggest refactors"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "How can this be improved?",
  "context": {
    "code": "function longFunction() { ... }",
    "filePath": "src/utils.js"
  }
}
```

**Response**:

```json
{
  "success": true,
  "suggestions": [
    {
      "type": "complexity",
      "message": "Consider breaking down long function",
      "line": 45
    }
  ],
  "summary": "Found 1 refactoring opportunities..."
}
```

### 5. 🧪 Test Coverage Advisor

**Purpose**: Check if code has adequate tests and suggest or generate test cases.

**Triggers**:

- "Are there enough tests?"
- "Generate tests for this function"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Are there enough tests?",
  "context": {
    "sourceFile": "src/feature.js",
    "testFile": "test/feature.test.js"
  }
}
```

**Response**:

```json
{
  "success": true,
  "suggestions": [
    {
      "type": "untested",
      "message": "Function 'calculateTotal' lacks test coverage",
      "priority": "medium"
    }
  ],
  "summary": "Test Coverage Analysis..."
}
```

### 6. 🔄 Issue Triager

**Purpose**: Auto-categorize issues and suggest labels or next steps.

**Triggers**:

- "Categorize this issue"
- "What's next for this issue?"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Categorize this issue",
  "context": {
    "issue": {
      "title": "Bug: Application crashes on startup",
      "description": "The app crashes immediately when opened"
    }
  }
}
```

**Response**:

```json
{
  "success": true,
  "labels": ["bug", "priority:high"],
  "category": "bug",
  "priority": "priority:high",
  "type": null,
  "nextSteps": [
    "Reproduce the issue",
    "Add error logs or screenshots",
    "Identify affected version"
  ],
  "summary": "Issue: Bug: Application crashes on startup..."
}
```

### 7. 🧱 Project Planner

**Purpose**: Break down user goals into epics, features, tasks, or technical implementation plans.

**Triggers**:

- "Plan this feature"
- "Create roadmap"
- "How should I build X?"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Plan this feature",
  "context": {
    "feature": {
      "title": "User Authentication",
      "description": "Add login and registration"
    }
  }
}
```

**Response**:

```json
{
  "success": true,
  "epic": {
    "title": "User Authentication",
    "description": "Add login and registration",
    "goal": "Implement User Authentication",
    "stakeholders": ["Engineering", "Product"]
  },
  "tasks": [
    {
      "id": 1,
      "title": "Technical design",
      "category": "planning",
      "effort": "medium"
    },
    ...
  ],
  "timeline": {
    "totalDays": 17,
    "totalWeeks": 4,
    "phases": [...]
  },
  "summary": "Project Plan: User Authentication..."
}
```

### 8. 🔐 Security Scanner

**Purpose**: Detect insecure patterns, secrets, or risky code (static check).

**Triggers**:

- "Scan for security issues"
- "Any hardcoded secrets?"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Scan for security issues",
  "context": {
    "code": "const apiKey = 'sk-1234567890abcdef';",
    "filePath": "src/config.js"
  }
}
```

**Response**:

```json
{
  "success": true,
  "vulnerabilities": [
    {
      "severity": "high",
      "type": "hardcoded-secret",
      "message": "Potential hardcoded secret or API key",
      "line": 1
    }
  ],
  "riskLevel": "high",
  "summary": "Security Scan Results: 1 potential issues..."
}
```

### 9. ⚙️ CI/CD Inspector

**Purpose**: Evaluate GitHub Actions or pipeline files, suggest optimizations.

**Triggers**:

- "Review our CI setup"
- "Why is our build slow?"

**Example**:

```javascript
POST /api/github-assistant
{
  "request": "Review our CI setup",
  "context": {
    "configPath": ".github/workflows/main.yml"
  }
}
```

**Response**:

```json
{
  "success": true,
  "hasConfig": true,
  "suggestions": [
    {
      "type": "optimization",
      "message": "Add cache to speed up builds",
      "priority": "medium"
    }
  ],
  "summary": "CI/CD Analysis..."
}
```

## API Reference

### Base URL

```
/api/github-assistant
```

### GET /api/github-assistant

Returns available capabilities and agent information.

**Response**:

```json
{
  "success": true,
  "capabilities": [...],
  "version": "1.0.0",
  "description": "GitHub Assistant Agent with 9 modular capabilities"
}
```

### POST /api/github-assistant

Process a request using the appropriate module.

**Request Body**:

```json
{
  "request": "string (required) - Natural language description of what you want",
  "context": {
    "repoPath": "string (optional) - Path to repository",
    "filePath": "string (optional) - Path to file",
    "code": "string (optional) - Code content to analyze",
    "changes": "object (optional) - PR changes information",
    "issue": "object (optional) - Issue information",
    "feature": "object (optional) - Feature to plan",
    "configPath": "string (optional) - Path to CI/CD config",
    "sourceFile": "string (optional) - Source file path",
    "testFile": "string (optional) - Test file path"
  }
}
```

**Response**:

```json
{
  "success": true/false,
  "...": "Module-specific response fields",
  "summary": "Human-readable summary"
}
```

## Usage Examples

### From JavaScript/Node.js

```javascript
// Get capabilities
const response = await fetch('/api/github-assistant');
const data = await response.json();
console.log(data.capabilities);

// Analyze repository structure
const result = await fetch('/api/github-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request: 'What is this repo about?',
    context: { repoPath: process.cwd() },
  }),
});
const analysis = await result.json();
console.log(analysis.summary);

// Review code for security issues
const securityCheck = await fetch('/api/github-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request: 'Scan for security issues',
    context: {
      code: sourceCode,
      filePath: 'src/config.js',
    },
  }),
});
const securityResult = await securityCheck.json();
if (securityResult.riskLevel === 'high') {
  console.warn('Security issues found!', securityResult.vulnerabilities);
}
```

### From CLI (curl)

```bash
# Get capabilities
curl https://your-app.vercel.app/api/github-assistant

# Summarize a file
curl -X POST https://your-app.vercel.app/api/github-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Summarize this file",
    "context": {
      "filePath": "/path/to/file.js"
    }
  }'

# Categorize an issue
curl -X POST https://your-app.vercel.app/api/github-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Categorize this issue",
    "context": {
      "issue": {
        "title": "Feature request: Add dark mode",
        "description": "Users want a dark mode option"
      }
    }
  }'
```

### From Python

```python
import requests

# Get capabilities
response = requests.get('https://your-app.vercel.app/api/github-assistant')
data = response.json()
print(f"Available capabilities: {len(data['capabilities'])}")

# Plan a feature
response = requests.post(
    'https://your-app.vercel.app/api/github-assistant',
    json={
        'request': 'Plan this feature',
        'context': {
            'feature': {
                'title': 'User Dashboard',
                'description': 'Create a dashboard for users'
            }
        }
    }
)
plan = response.json()
print(f"Timeline: {plan['timeline']['totalWeeks']} weeks")
for task in plan['tasks']:
    print(f"- {task['title']} ({task['effort']})")
```

## Integration with Agent Runtime

The GitHub Assistant Agent is registered in the agent runtime system:

```json
{
  "id": "github-assistant",
  "codename": "Navigator",
  "name": "GitHub Assistant Agent",
  "status": "registered"
}
```

Check agent status:

```bash
npm run agents:status -- --agent github-assistant
```

## Error Handling

The agent returns structured error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "availableModules": ["List", "of", "modules"] // Only for unclear requests
}
```

Common error scenarios:

- Missing required context fields
- File not found
- Invalid input format
- Request type unclear

## Best Practices

1. **Be Specific**: Provide clear, specific requests for better results
2. **Include Context**: Always provide relevant context fields
3. **Check Success**: Always check the `success` field in responses
4. **Handle Errors**: Implement proper error handling for failed requests
5. **Use Summaries**: The `summary` field provides human-readable output

## Performance Considerations

- File operations are asynchronous
- Large files may take longer to process
- Cache responses when appropriate
- Use pagination for large result sets

## Security Notes

- Never expose sensitive code or secrets in API requests
- The agent performs static analysis only
- Security scans are heuristic-based, not exhaustive
- Always validate security findings manually

## Contributing

To extend the GitHub Assistant Agent:

1. Add new module class in `src/githubAssistant.js`
2. Register module in `GitHubAssistant` constructor
3. Add pattern matching in `processRequest()`
4. Write comprehensive unit tests
5. Update this documentation

## Support

For issues or questions:

- Check existing tests in `test/githubAssistant.test.js`
- Review agent registry at `agents/registry.json`
- See main README for general project information

## Version History

### 1.0.0 (2026-01-08)

- Initial release with 9 modular capabilities
- Full API endpoint implementation
- Comprehensive test coverage
- Integration with agent runtime system
