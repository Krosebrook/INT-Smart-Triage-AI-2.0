/**
 * Unit tests for GitHub Assistant Agent
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  RepoUnderstander,
  CodeSummarizer,
  PullRequestReviewer,
  RefactoringAdvisor,
  TestCoverageAdvisor,
  IssueTriager,
  ProjectPlanner,
  SecurityScanner,
  CICDInspector,
  GitHubAssistant,
} from '../src/githubAssistant.js';

const TEST_DIR = path.join(tmpdir(), 'github-assistant-test');

// Helper to create test directory
async function setupTestDir() {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Expected error when directory doesn't exist
  }
  await mkdir(TEST_DIR, { recursive: true });
}

// Helper to create test file
async function createTestFile(filename, content) {
  const filePath = path.join(TEST_DIR, filename);
  await writeFile(filePath, content, 'utf8');
  return filePath;
}

describe('GitHub Assistant Agent', () => {
  describe('Module 1: RepoUnderstander', () => {
    let understander;

    beforeEach(async () => {
      understander = new RepoUnderstander();
      await setupTestDir();
    });

    it('should analyze repository structure', async () => {
      await createTestFile(
        'package.json',
        JSON.stringify({
          name: 'test-repo',
          version: '1.0.0',
          description: 'Test repository',
        })
      );

      const result = await understander.analyzeStructure(TEST_DIR);

      assert.strictEqual(result.success, true);
      assert.ok(result.structure);
      assert.ok(result.summary);
    });

    it('should detect technologies from package.json', async () => {
      await createTestFile('package.json', JSON.stringify({ name: 'test' }));

      const result = await understander.analyzeStructure(TEST_DIR);

      assert.strictEqual(result.success, true);
      assert.ok(result.technologies.includes('Node.js/JavaScript'));
    });

    it('should handle missing package.json', async () => {
      const result = await understander.analyzeStructure(TEST_DIR);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.packageInfo, null);
    });
  });

  describe('Module 2: CodeSummarizer', () => {
    let summarizer;

    beforeEach(async () => {
      summarizer = new CodeSummarizer();
      await setupTestDir();
    });

    it('should summarize a JavaScript file', async () => {
      const code = `// Test function
function hello() {
  return 'world';
}`;
      const filePath = await createTestFile('test.js', code);

      const result = await summarizer.summarizeFile(filePath);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.type, 'JavaScript');
      assert.ok(result.stats);
      assert.ok(result.summary);
    });

    it('should count lines correctly', async () => {
      const code = `line 1
line 2
// comment
line 4`;
      const filePath = await createTestFile('test.js', code);

      const result = await summarizer.summarizeFile(filePath);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.stats.totalLines, 4);
      assert.strictEqual(result.stats.commentLines, 1);
    });

    it('should detect file types', async () => {
      const filePath = await createTestFile('test.py', '# Python code');

      const result = await summarizer.summarizeFile(filePath);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.type, 'Python');
    });

    it('should handle file read errors', async () => {
      const result = await summarizer.summarizeFile('/nonexistent/file.js');

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Module 3: PullRequestReviewer', () => {
    let reviewer;

    beforeEach(() => {
      reviewer = new PullRequestReviewer();
    });

    it('should review code changes', async () => {
      const changes = {
        additions: 100,
        deletions: 50,
        files: ['src/test.js'],
      };

      const result = await reviewer.reviewChanges(changes);

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.issues));
      assert.ok(Array.isArray(result.suggestions));
    });

    it('should flag large PRs', async () => {
      const changes = {
        additions: 600,
        deletions: 50,
        files: [],
      };

      const result = await reviewer.reviewChanges(changes);

      assert.strictEqual(result.success, true);
      const hasWarning = result.issues.some((i) =>
        i.message.includes('Large PR')
      );
      assert.ok(hasWarning);
    });

    it('should detect missing tests', async () => {
      const changes = {
        additions: 100,
        deletions: 10,
        files: ['src/feature.js', 'src/utils.js'],
      };

      const result = await reviewer.reviewChanges(changes);

      assert.strictEqual(result.success, true);
      const hasMissingTests = result.issues.some((i) =>
        i.message.includes('test')
      );
      assert.ok(hasMissingTests);
    });

    it('should recognize good refactoring', async () => {
      const changes = {
        additions: 50,
        deletions: 150,
        files: ['src/refactor.js'],
      };

      const result = await reviewer.reviewChanges(changes);

      assert.strictEqual(result.success, true);
      assert.ok(result.suggestions.length > 0);
    });
  });

  describe('Module 4: RefactoringAdvisor', () => {
    let advisor;

    beforeEach(() => {
      advisor = new RefactoringAdvisor();
    });

    it('should analyze code for refactoring', async () => {
      const code = `function test() {
  console.log('line 1');
}`;

      const result = await advisor.analyzeCode(code, 'test.js');

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.suggestions));
    });

    it('should detect long functions', async () => {
      let longFunction = 'function longFunc() {\n';
      for (let i = 0; i < 60; i++) {
        longFunction += `  console.log('line ${i}');\n`;
      }
      longFunction += '}';

      const result = await advisor.analyzeCode(longFunction, 'test.js');

      assert.strictEqual(result.success, true);
      const hasComplexity = result.suggestions.some(
        (s) => s.type === 'complexity'
      );
      assert.ok(hasComplexity);
    });

    it('should handle clean code', async () => {
      const code = `function clean() {
  return true;
}`;

      const result = await advisor.analyzeCode(code, 'test.js');

      assert.strictEqual(result.success, true);
      assert.ok(result.summary.includes('No major'));
    });
  });

  describe('Module 5: TestCoverageAdvisor', () => {
    let advisor;

    beforeEach(async () => {
      advisor = new TestCoverageAdvisor();
      await setupTestDir();
    });

    it('should analyze test coverage', async () => {
      const sourceCode = `export function hello() { return 'world'; }
export function goodbye() { return 'bye'; }`;
      const testCode = `import { hello } from './source.js';
it('should test hello', () => {
  hello();
});`;

      const sourcePath = await createTestFile('source.js', sourceCode);
      const testPath = await createTestFile('source.test.js', testCode);

      const result = await advisor.analyzeCoverage(sourcePath, testPath);

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.suggestions));
    });

    it('should detect missing test file', async () => {
      const sourcePath = await createTestFile(
        'source.js',
        'export function test() {}'
      );

      const result = await advisor.analyzeCoverage(sourcePath, null);

      assert.strictEqual(result.success, true);
      const hasMissing = result.suggestions.some((s) => s.type === 'missing');
      assert.ok(hasMissing);
    });

    it('should detect untested functions', async () => {
      const sourceCode = `export function tested() {}
export function untested() {}`;
      const testCode = `it('should test tested', () => {
  tested();
});`;

      const sourcePath = await createTestFile('source.js', sourceCode);
      const testPath = await createTestFile('source.test.js', testCode);

      const result = await advisor.analyzeCoverage(sourcePath, testPath);

      assert.strictEqual(result.success, true);
      const hasUntested = result.suggestions.some((s) => s.type === 'untested');
      assert.ok(hasUntested);
    });
  });

  describe('Module 6: IssueTriager', () => {
    let triager;

    beforeEach(() => {
      triager = new IssueTriager();
    });

    it('should categorize bug issues', async () => {
      const issue = {
        title: 'Bug: Application crashes on startup',
        description: 'The app crashes immediately when opened',
      };

      const result = await triager.categorizeIssue(issue);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.category, 'bug');
      assert.ok(result.labels.includes('bug'));
    });

    it('should categorize feature requests', async () => {
      const issue = {
        title: 'Feature: Add dark mode',
        description: 'We should add a dark mode option',
      };

      const result = await triager.categorizeIssue(issue);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.category, 'enhancement');
    });

    it('should detect priority levels', async () => {
      const issue = {
        title: 'Critical bug: Data loss',
        description: 'Users are losing data, need urgent fix',
      };

      const result = await triager.categorizeIssue(issue);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.priority, 'priority:high');
    });

    it('should detect security issues', async () => {
      const issue = {
        title: 'Security vulnerability in authentication',
        description: 'Found a security issue',
      };

      const result = await triager.categorizeIssue(issue);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.type, 'security');
    });

    it('should suggest next steps', async () => {
      const issue = {
        title: 'Bug in login',
        description: 'Cannot log in',
      };

      const result = await triager.categorizeIssue(issue);

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.nextSteps));
      assert.ok(result.nextSteps.length > 0);
    });
  });

  describe('Module 7: ProjectPlanner', () => {
    let planner;

    beforeEach(() => {
      planner = new ProjectPlanner();
    });

    it('should create implementation plan', async () => {
      const feature = {
        title: 'User Authentication',
        description: 'Add user login and registration',
      };

      const result = await planner.createPlan(feature);

      assert.strictEqual(result.success, true);
      assert.ok(result.epic);
      assert.ok(Array.isArray(result.tasks));
      assert.ok(result.timeline);
    });

    it('should break down into tasks', async () => {
      const feature = { title: 'New Feature' };

      const result = await planner.createPlan(feature);

      assert.strictEqual(result.success, true);
      assert.ok(result.tasks.length >= 5);

      const hasDesign = result.tasks.some((t) => t.category === 'planning');
      const hasDev = result.tasks.some((t) => t.category === 'development');
      const hasTest = result.tasks.some((t) => t.category === 'testing');

      assert.ok(hasDesign);
      assert.ok(hasDev);
      assert.ok(hasTest);
    });

    it('should estimate timeline', async () => {
      const feature = { title: 'Test Feature' };

      const result = await planner.createPlan(feature);

      assert.strictEqual(result.success, true);
      assert.ok(result.timeline.totalDays);
      assert.ok(result.timeline.totalWeeks);
      assert.ok(Array.isArray(result.timeline.phases));
    });
  });

  describe('Module 8: SecurityScanner', () => {
    let scanner;

    beforeEach(() => {
      scanner = new SecurityScanner();
    });

    it('should scan code for vulnerabilities', async () => {
      const code = `const apiKey = "sk-1234567890abcdef";
console.log(apiKey);`;

      const result = await scanner.scanCode(code, 'config.js');

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.vulnerabilities));
    });

    it('should detect hardcoded secrets', async () => {
      const code = `const password = "mysecretpassword123";`;

      const result = await scanner.scanCode(code, 'auth.js');

      assert.strictEqual(result.success, true);
      const hasSecret = result.vulnerabilities.some(
        (v) => v.type === 'hardcoded-secret'
      );
      assert.ok(hasSecret);
    });

    it('should detect SQL injection risks', async () => {
      const code = `const query = "SELECT * FROM users WHERE id = " + userId;`;

      const result = await scanner.scanCode(code, 'database.js');

      assert.strictEqual(result.success, true);
      const hasSQLi = result.vulnerabilities.some(
        (v) => v.type === 'sql-injection'
      );
      assert.ok(hasSQLi);
    });

    it('should detect XSS vulnerabilities', async () => {
      const code = `element.innerHTML = userInput;`;

      const result = await scanner.scanCode(code, 'ui.js');

      assert.strictEqual(result.success, true);
      const hasXSS = result.vulnerabilities.some((v) => v.type === 'xss');
      assert.ok(hasXSS);
    });

    it('should calculate risk level', async () => {
      const code = `const safe = true;`;

      const result = await scanner.scanCode(code, 'safe.js');

      assert.strictEqual(result.success, true);
      assert.ok(result.riskLevel);
    });
  });

  describe('Module 9: CICDInspector', () => {
    let inspector;

    beforeEach(async () => {
      inspector = new CICDInspector();
      await setupTestDir();
    });

    it('should analyze CI/CD configuration', async () => {
      const config = `name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test`;

      const configPath = await createTestFile('workflow.yml', config);

      const result = await inspector.analyzeConfig(configPath);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.hasConfig, true);
    });

    it('should suggest caching when missing', async () => {
      const config = `name: CI
jobs:
  test:
    runs-on: ubuntu-latest`;

      const configPath = await createTestFile('workflow.yml', config);

      const result = await inspector.analyzeConfig(configPath);

      assert.strictEqual(result.success, true);
      const hasCacheSuggestion = result.suggestions.some((s) =>
        s.message.includes('cache')
      );
      assert.ok(hasCacheSuggestion);
    });

    it('should handle missing config file', async () => {
      const result = await inspector.analyzeConfig('/nonexistent/config.yml');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.hasConfig, false);
    });
  });

  describe('GitHubAssistant Main Class', () => {
    let assistant;

    beforeEach(async () => {
      assistant = new GitHubAssistant();
      await setupTestDir();
    });

    it('should initialize with all modules', () => {
      assert.ok(assistant.modules.repoUnderstander);
      assert.ok(assistant.modules.codeSummarizer);
      assert.ok(assistant.modules.pullRequestReviewer);
      assert.ok(assistant.modules.refactoringAdvisor);
      assert.ok(assistant.modules.testCoverageAdvisor);
      assert.ok(assistant.modules.issueTriager);
      assert.ok(assistant.modules.projectPlanner);
      assert.ok(assistant.modules.securityScanner);
      assert.ok(assistant.modules.cicdInspector);
    });

    it('should route to RepoUnderstander', async () => {
      await createTestFile('package.json', JSON.stringify({ name: 'test' }));

      const result = await assistant.processRequest(
        'What is this repo about?',
        { repoPath: TEST_DIR }
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.structure);
    });

    it('should route to CodeSummarizer', async () => {
      const filePath = await createTestFile('test.js', 'function test() {}');

      const result = await assistant.processRequest('Summarize this file', {
        filePath,
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.summary);
    });

    it('should route to PullRequestReviewer', async () => {
      const result = await assistant.processRequest('Review this PR', {
        changes: { additions: 50, deletions: 10, files: [] },
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.issues !== undefined);
    });

    it('should route to IssueTriager', async () => {
      const result = await assistant.processRequest('Categorize this issue', {
        issue: { title: 'Bug in login', description: '' },
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.category);
    });

    it('should route to ProjectPlanner', async () => {
      const result = await assistant.processRequest('Plan this feature', {
        feature: { title: 'New Dashboard' },
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.tasks);
    });

    it('should route to SecurityScanner', async () => {
      const result = await assistant.processRequest(
        'Scan for security issues',
        { code: 'const x = 1;', filePath: 'test.js' }
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.vulnerabilities !== undefined);
    });

    it('should route to CICDInspector', async () => {
      const result = await assistant.processRequest('Review our CI/CD setup', {
        configPath: '/nonexistent',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.hasConfig !== undefined);
    });

    it('should handle unknown requests', async () => {
      const result = await assistant.processRequest('Do something random', {});

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.availableModules);
    });

    it('should return available capabilities', () => {
      const capabilities = assistant.getCapabilities();

      assert.ok(Array.isArray(capabilities));
      assert.strictEqual(capabilities.length, 9);

      capabilities.forEach((cap) => {
        assert.ok(cap.id);
        assert.ok(cap.name);
        assert.ok(cap.description);
        assert.ok(Array.isArray(cap.triggers));
      });
    });

    it('should handle missing context gracefully', async () => {
      const result = await assistant.processRequest('Summarize this file', {});

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('required'));
    });
  });
});
