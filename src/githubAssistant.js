/**
 * GitHub Assistant Agent
 *
 * A modular AI assistant for GitHub repositories with 9 specialized capabilities:
 * 1. Repository Understanding
 * 2. Code Summarization
 * 3. Pull Request Review
 * 4. Refactoring Advice
 * 5. Test Coverage Analysis
 * 6. Issue Triage
 * 7. Project Planning
 * 8. Security Scanning
 * 9. CI/CD Inspection
 */

import { logger } from './logger.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Module 1: Repository Understander
 * Analyzes repository structure, technologies, and file roles
 */
export class RepoUnderstander {
  /**
   * Analyze repository structure
   * @param {string} repoPath - Path to repository
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeStructure(repoPath) {
    try {
      const structure = await this._scanDirectory(repoPath);
      const packageInfo = await this._getPackageInfo(repoPath);
      const technologies = await this._detectTechnologies(repoPath);

      return {
        success: true,
        structure,
        technologies,
        packageInfo,
        summary: this._generateSummary(structure, technologies, packageInfo),
      };
    } catch (error) {
      logger.error('Error analyzing repository structure', {
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  async _scanDirectory(dirPath, depth = 0, maxDepth = 2) {
    if (depth > maxDepth) return null;

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      const structure = {
        directories: [],
        files: [],
        total: entries.length,
      };

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules')
          continue;

        if (entry.isDirectory()) {
          structure.directories.push(entry.name);
        } else {
          structure.files.push(entry.name);
        }
      }

      return structure;
    } catch (error) {
      return null;
    }
  }

  async _getPackageInfo(repoPath) {
    try {
      const packagePath = path.join(repoPath, 'package.json');
      const content = await readFile(packagePath, 'utf8');
      const pkg = JSON.parse(content);
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
      };
    } catch (error) {
      return null;
    }
  }

  async _detectTechnologies(repoPath) {
    const technologies = [];
    const files = [
      'package.json',
      'requirements.txt',
      'Gemfile',
      'go.mod',
      'pom.xml',
    ];

    for (const file of files) {
      try {
        await stat(path.join(repoPath, file));
        if (file === 'package.json') technologies.push('Node.js/JavaScript');
        if (file === 'requirements.txt') technologies.push('Python');
        if (file === 'Gemfile') technologies.push('Ruby');
        if (file === 'go.mod') technologies.push('Go');
        if (file === 'pom.xml') technologies.push('Java/Maven');
      } catch {
        // File doesn't exist, continue
      }
    }

    return technologies;
  }

  _generateSummary(structure, technologies, packageInfo) {
    let summary = '';

    if (packageInfo) {
      summary += `Project: ${packageInfo.name} (v${packageInfo.version})\n`;
      summary += `Description: ${packageInfo.description}\n\n`;
    }

    if (technologies.length > 0) {
      summary += `Technologies: ${technologies.join(', ')}\n`;
    }

    if (structure) {
      summary += `Structure: ${structure.directories.length} directories, ${structure.files.length} files\n`;
    }

    return summary;
  }
}

/**
 * Module 2: Code Summarizer
 * Summarizes files, diffs, commits, and pull requests
 */
export class CodeSummarizer {
  /**
   * Summarize a file
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Summary result
   */
  async summarizeFile(filePath) {
    try {
      const content = await readFile(filePath, 'utf8');
      const lines = content.split('\n');
      const stats = this._getFileStats(content);
      const type = this._detectFileType(filePath);

      return {
        success: true,
        filePath,
        type,
        stats,
        summary: this._generateFileSummary(filePath, type, stats, lines),
      };
    } catch (error) {
      logger.error('Error summarizing file', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  _getFileStats(content) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
    const commentLines = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('#')
      );
    }).length;

    return {
      totalLines: lines.length,
      nonEmptyLines,
      commentLines,
      codeLines: nonEmptyLines - commentLines,
    };
  }

  _detectFileType(filePath) {
    const ext = path.extname(filePath);
    const typeMap = {
      '.js': 'JavaScript',
      '.cjs': 'CommonJS',
      '.mjs': 'ES Module',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.java': 'Java',
      '.md': 'Markdown',
      '.json': 'JSON',
      '.yml': 'YAML',
      '.yaml': 'YAML',
    };

    return typeMap[ext] || 'Unknown';
  }

  _generateFileSummary(filePath, type, stats, lines) {
    let summary = `File: ${path.basename(filePath)} (${type})\n`;
    summary += `Lines: ${stats.totalLines} total, ${stats.codeLines} code, ${stats.commentLines} comments\n`;

    // Extract first comment block or description
    const firstNonEmpty = lines.find((line) => line.trim().length > 0);
    if (firstNonEmpty && firstNonEmpty.includes('/**')) {
      summary += '\nDescription found in file header.\n';
    }

    return summary;
  }
}

/**
 * Module 3: Pull Request Reviewer
 * Reviews PRs for quality, logic, testing, and best practices
 */
export class PullRequestReviewer {
  /**
   * Review code changes
   * @param {Object} changes - Code changes to review
   * @returns {Promise<Object>} Review result
   */
  async reviewChanges(changes) {
    try {
      const issues = [];
      const suggestions = [];

      // Check for common issues
      if (changes.additions > 500) {
        issues.push({
          severity: 'warning',
          message: 'Large PR: Consider breaking into smaller changes',
          line: null,
        });
      }

      if (changes.deletions > changes.additions * 2) {
        suggestions.push({
          type: 'positive',
          message: 'Good refactoring: More deletions than additions',
        });
      }

      // Check for test files
      const hasTests = changes.files?.some(
        (f) => f.includes('.test.') || f.includes('.spec.')
      );
      if (!hasTests && changes.additions > 50) {
        issues.push({
          severity: 'warning',
          message: 'No test files found in changes',
          line: null,
        });
      }

      return {
        success: true,
        issues,
        suggestions,
        summary: this._generateReviewSummary(changes, issues, suggestions),
      };
    } catch (error) {
      logger.error('Error reviewing changes', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  _generateReviewSummary(changes, issues, suggestions) {
    let summary = 'Pull Request Review\n';
    summary += `Changes: +${changes.additions} -${changes.deletions}\n`;

    if (issues.length > 0) {
      summary += `\nIssues (${issues.length}):\n`;
      issues.forEach((issue) => {
        summary += `  - [${issue.severity}] ${issue.message}\n`;
      });
    }

    if (suggestions.length > 0) {
      summary += `\nSuggestions (${suggestions.length}):\n`;
      suggestions.forEach((suggestion) => {
        summary += `  - ${suggestion.message}\n`;
      });
    }

    return summary;
  }
}

/**
 * Module 4: Refactoring Advisor
 * Suggests code improvements
 */
export class RefactoringAdvisor {
  /**
   * Analyze code for refactoring opportunities
   * @param {string} code - Code to analyze
   * @param {string} _filePath - File path for context (unused but kept for API consistency)
   * @returns {Promise<Object>} Refactoring suggestions
   */
  async analyzeCode(code, _filePath) {
    try {
      const suggestions = [];
      const lines = code.split('\n');

      // Check for long functions
      const functionPattern = /function\s+\w+|=>\s*{/g;
      let inFunction = false;
      let functionLength = 0;

      lines.forEach((line, idx) => {
        if (functionPattern.test(line)) {
          inFunction = true;
          functionLength = 0;
        }
        if (inFunction) functionLength++;
        if (line.includes('}') && inFunction && functionLength > 50) {
          suggestions.push({
            type: 'complexity',
            message: 'Consider breaking down long function',
            line: idx + 1,
          });
          inFunction = false;
        }
      });

      // Check for code duplication patterns
      const codeBlocks = this._extractCodeBlocks(lines);
      const duplicates = this._findDuplicates(codeBlocks);

      if (duplicates.length > 0) {
        suggestions.push({
          type: 'duplication',
          message: `Found ${duplicates.length} potential duplicate code blocks`,
          line: null,
        });
      }

      return {
        success: true,
        suggestions,
        summary: this._generateRefactoringSummary(suggestions),
      };
    } catch (error) {
      logger.error('Error analyzing code', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  _extractCodeBlocks(lines) {
    const blocks = [];
    let currentBlock = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('//')) {
        currentBlock.push(trimmed);
      }
      if (trimmed === '}' && currentBlock.length > 3) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    });

    return blocks;
  }

  _findDuplicates(blocks) {
    const seen = new Map();
    const duplicates = [];

    blocks.forEach((block) => {
      if (seen.has(block)) {
        duplicates.push(block);
      } else {
        seen.set(block, true);
      }
    });

    return duplicates;
  }

  _generateRefactoringSummary(suggestions) {
    if (suggestions.length === 0) {
      return 'No major refactoring opportunities found.';
    }

    let summary = `Found ${suggestions.length} refactoring opportunities:\n`;
    suggestions.forEach((suggestion) => {
      const location = suggestion.line ? ` (line ${suggestion.line})` : '';
      summary += `  - [${suggestion.type}] ${suggestion.message}${location}\n`;
    });

    return summary;
  }
}

/**
 * Module 5: Test Coverage Advisor
 * Checks test coverage and suggests test cases
 */
export class TestCoverageAdvisor {
  /**
   * Analyze test coverage
   * @param {string} sourceFile - Source file path
   * @param {string} testFile - Test file path
   * @returns {Promise<Object>} Coverage analysis
   */
  async analyzeCoverage(sourceFile, testFile) {
    try {
      await this._fileExists(sourceFile);
      const testExists = testFile ? await this._fileExists(testFile) : false;

      const suggestions = [];

      if (!testExists) {
        suggestions.push({
          type: 'missing',
          message: 'No test file found',
          priority: 'high',
        });
      } else {
        const sourceFunctions = await this._extractFunctions(sourceFile);
        const testCases = await this._extractTestCases(testFile);

        const coverage = this._calculateCoverage(sourceFunctions, testCases);

        if (coverage.percentage < 70) {
          suggestions.push({
            type: 'insufficient',
            message: `Coverage is ${coverage.percentage}% (target: 70%)`,
            priority: 'medium',
          });
        }

        coverage.untested.forEach((fn) => {
          suggestions.push({
            type: 'untested',
            message: `Function '${fn}' lacks test coverage`,
            priority: 'medium',
          });
        });
      }

      return {
        success: true,
        suggestions,
        summary: this._generateCoverageSummary(suggestions),
      };
    } catch (error) {
      logger.error('Error analyzing coverage', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async _fileExists(filePath) {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async _extractFunctions(filePath) {
    try {
      const content = await readFile(filePath, 'utf8');
      const functionPattern =
        /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
      const functions = [];
      let match;

      while ((match = functionPattern.exec(content)) !== null) {
        functions.push(match[1] || match[2]);
      }

      return functions;
    } catch {
      return [];
    }
  }

  async _extractTestCases(filePath) {
    try {
      const content = await readFile(filePath, 'utf8');
      const testPattern = /(?:it|test)\s*\(\s*['"`](.+?)['"`]/g;
      const tests = [];
      let match;

      while ((match = testPattern.exec(content)) !== null) {
        tests.push(match[1]);
      }

      return tests;
    } catch {
      return [];
    }
  }

  _calculateCoverage(functions, testCases) {
    if (functions.length === 0) {
      return { percentage: 100, untested: [] };
    }

    const untested = functions.filter((fn) => {
      return !testCases.some((test) =>
        test.toLowerCase().includes(fn.toLowerCase())
      );
    });

    const percentage = Math.round(
      ((functions.length - untested.length) / functions.length) * 100
    );

    return { percentage, untested };
  }

  _generateCoverageSummary(suggestions) {
    if (suggestions.length === 0) {
      return 'Test coverage appears adequate.';
    }

    let summary = `Test Coverage Analysis:\n`;
    suggestions.forEach((suggestion) => {
      summary += `  - [${suggestion.priority}] ${suggestion.message}\n`;
    });

    return summary;
  }
}

/**
 * Module 6: Issue Triager
 * Auto-categorizes issues and suggests labels
 */
export class IssueTriager {
  /**
   * Categorize an issue
   * @param {Object} issue - Issue object with title and description
   * @returns {Promise<Object>} Categorization result
   */
  async categorizeIssue(issue) {
    try {
      const text = `${issue.title} ${issue.description || ''}`.toLowerCase();

      const labels = [];
      const category = this._detectCategory(text);
      const priority = this._detectPriority(text);
      const type = this._detectType(text);

      labels.push(category);
      if (priority) labels.push(priority);
      if (type) labels.push(type);

      const nextSteps = this._suggestNextSteps(category, priority, type);

      return {
        success: true,
        labels,
        category,
        priority,
        type,
        nextSteps,
        summary: this._generateTriageSummary(issue, labels, nextSteps),
      };
    } catch (error) {
      logger.error('Error categorizing issue', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  _detectCategory(text) {
    if (
      text.includes('bug') ||
      text.includes('error') ||
      text.includes('crash')
    ) {
      return 'bug';
    }
    if (
      text.includes('feature') ||
      text.includes('enhancement') ||
      text.includes('add')
    ) {
      return 'enhancement';
    }
    if (
      text.includes('document') ||
      text.includes('readme') ||
      text.includes('doc')
    ) {
      return 'documentation';
    }
    if (text.includes('test') || text.includes('coverage')) {
      return 'testing';
    }
    return 'general';
  }

  _detectPriority(text) {
    if (
      text.includes('critical') ||
      text.includes('urgent') ||
      text.includes('asap')
    ) {
      return 'priority:high';
    }
    if (text.includes('important') || text.includes('soon')) {
      return 'priority:medium';
    }
    if (text.includes('nice to have') || text.includes('eventually')) {
      return 'priority:low';
    }
    return null;
  }

  _detectType(text) {
    if (text.includes('security') || text.includes('vulnerability')) {
      return 'security';
    }
    if (text.includes('performance') || text.includes('slow')) {
      return 'performance';
    }
    if (
      text.includes('ui') ||
      text.includes('ux') ||
      text.includes('interface')
    ) {
      return 'ui/ux';
    }
    return null;
  }

  _suggestNextSteps(category, priority, type) {
    const steps = [];

    if (category === 'bug') {
      steps.push('Reproduce the issue');
      steps.push('Add error logs or screenshots');
      steps.push('Identify affected version');
    } else if (category === 'enhancement') {
      steps.push('Define acceptance criteria');
      steps.push('Estimate effort');
      steps.push('Review with team');
    } else if (category === 'documentation') {
      steps.push('Identify documentation gaps');
      steps.push('Assign to technical writer');
    }

    if (type === 'security') {
      steps.unshift('Security review required');
    }

    return steps;
  }

  _generateTriageSummary(issue, labels, nextSteps) {
    let summary = `Issue: ${issue.title}\n`;
    summary += `Labels: ${labels.join(', ')}\n`;

    if (nextSteps.length > 0) {
      summary += '\nNext Steps:\n';
      nextSteps.forEach((step, idx) => {
        summary += `  ${idx + 1}. ${step}\n`;
      });
    }

    return summary;
  }
}

/**
 * Module 7: Project Planner
 * Breaks down features into epics, tasks, and implementation plans
 */
export class ProjectPlanner {
  /**
   * Create implementation plan
   * @param {Object} feature - Feature description
   * @returns {Promise<Object>} Implementation plan
   */
  async createPlan(feature) {
    try {
      const epic = this._defineEpic(feature);
      const tasks = this._breakdownTasks(feature);
      const timeline = this._estimateTimeline(tasks);

      return {
        success: true,
        epic,
        tasks,
        timeline,
        summary: this._generatePlanSummary(epic, tasks, timeline),
      };
    } catch (error) {
      logger.error('Error creating plan', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  _defineEpic(feature) {
    return {
      title: feature.title || 'New Feature',
      description: feature.description || '',
      goal: `Implement ${feature.title}`,
      stakeholders: ['Engineering', 'Product'],
    };
  }

  _breakdownTasks(_feature) {
    const tasks = [];

    // Standard tasks for any feature
    tasks.push({
      id: 1,
      title: 'Technical design',
      category: 'planning',
      effort: 'medium',
      dependencies: [],
    });

    tasks.push({
      id: 2,
      title: 'Backend implementation',
      category: 'development',
      effort: 'high',
      dependencies: [1],
    });

    tasks.push({
      id: 3,
      title: 'Frontend implementation',
      category: 'development',
      effort: 'high',
      dependencies: [1],
    });

    tasks.push({
      id: 4,
      title: 'Write tests',
      category: 'testing',
      effort: 'medium',
      dependencies: [2, 3],
    });

    tasks.push({
      id: 5,
      title: 'Documentation',
      category: 'documentation',
      effort: 'low',
      dependencies: [2, 3],
    });

    tasks.push({
      id: 6,
      title: 'Code review and deployment',
      category: 'deployment',
      effort: 'low',
      dependencies: [4, 5],
    });

    return tasks;
  }

  _estimateTimeline(tasks) {
    const effortMap = {
      low: 1,
      medium: 3,
      high: 5,
    };

    const totalDays = tasks.reduce((sum, task) => {
      return sum + (effortMap[task.effort] || 1);
    }, 0);

    return {
      totalDays,
      totalWeeks: Math.ceil(totalDays / 5),
      phases: [
        { name: 'Planning', days: 3 },
        { name: 'Development', days: 10 },
        { name: 'Testing', days: 3 },
        { name: 'Deployment', days: 1 },
      ],
    };
  }

  _generatePlanSummary(epic, tasks, timeline) {
    let summary = `Project Plan: ${epic.title}\n`;
    summary += `Estimated Duration: ${timeline.totalWeeks} weeks (${timeline.totalDays} days)\n\n`;

    summary += 'Tasks:\n';
    tasks.forEach((task) => {
      summary += `  ${task.id}. ${task.title} (${task.effort} effort)\n`;
    });

    summary += '\nPhases:\n';
    timeline.phases.forEach((phase) => {
      summary += `  - ${phase.name}: ${phase.days} days\n`;
    });

    return summary;
  }
}

/**
 * Module 8: Security Scanner
 * Detects insecure patterns and potential vulnerabilities
 */
export class SecurityScanner {
  /**
   * Scan code for security issues
   * @param {string} code - Code to scan
   * @param {string} filePath - File path for context
   * @returns {Promise<Object>} Security scan results
   */
  async scanCode(code, filePath) {
    try {
      const vulnerabilities = [];
      const lines = code.split('\n');

      // Check for hardcoded secrets
      lines.forEach((line, idx) => {
        if (this._containsSecret(line)) {
          vulnerabilities.push({
            severity: 'high',
            type: 'hardcoded-secret',
            message: 'Potential hardcoded secret or API key',
            line: idx + 1,
          });
        }
      });

      // Check for SQL injection risks
      if (
        code.includes('query') &&
        code.includes('+') &&
        code.includes('SELECT')
      ) {
        vulnerabilities.push({
          severity: 'high',
          type: 'sql-injection',
          message: 'Potential SQL injection vulnerability',
          line: null,
        });
      }

      // Check for XSS risks
      if (
        code.includes('innerHTML') ||
        code.includes('dangerouslySetInnerHTML')
      ) {
        vulnerabilities.push({
          severity: 'medium',
          type: 'xss',
          message: 'Potential XSS vulnerability with innerHTML',
          line: null,
        });
      }

      // Check for insecure dependencies
      if (filePath.includes('package.json')) {
        vulnerabilities.push({
          severity: 'info',
          type: 'dependency-check',
          message: 'Run npm audit to check dependencies',
          line: null,
        });
      }

      return {
        success: true,
        vulnerabilities,
        riskLevel: this._calculateRiskLevel(vulnerabilities),
        summary: this._generateSecuritySummary(vulnerabilities),
      };
    } catch (error) {
      logger.error('Error scanning code', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  _containsSecret(line) {
    const secretPatterns = [
      /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      /password\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i,
      /[a-f0-9]{32,}/i, // Potential hash/key
    ];

    return secretPatterns.some((pattern) => pattern.test(line));
  }

  _calculateRiskLevel(vulnerabilities) {
    const highCount = vulnerabilities.filter(
      (v) => v.severity === 'high'
    ).length;
    const mediumCount = vulnerabilities.filter(
      (v) => v.severity === 'medium'
    ).length;

    if (highCount > 0) return 'high';
    if (mediumCount > 0) return 'medium';
    return vulnerabilities.length > 0 ? 'low' : 'none';
  }

  _generateSecuritySummary(vulnerabilities) {
    if (vulnerabilities.length === 0) {
      return 'No obvious security issues found.';
    }

    let summary = `Security Scan Results: ${vulnerabilities.length} potential issues\n`;

    const byType = {};
    vulnerabilities.forEach((vuln) => {
      byType[vuln.type] = (byType[vuln.type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
      summary += `  - ${type}: ${count}\n`;
    });

    return summary;
  }
}

/**
 * Module 9: CI/CD Inspector
 * Evaluates pipeline configurations and suggests optimizations
 */
export class CICDInspector {
  /**
   * Analyze CI/CD configuration
   * @param {string} configPath - Path to CI config file
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeConfig(configPath) {
    try {
      const exists = await this._fileExists(configPath);

      if (!exists) {
        return {
          success: true,
          hasConfig: false,
          suggestions: [
            {
              type: 'setup',
              message: 'No CI/CD configuration found',
              priority: 'low',
            },
          ],
        };
      }

      const content = await readFile(configPath, 'utf8');
      const suggestions = [];

      // Check for caching
      if (!content.includes('cache')) {
        suggestions.push({
          type: 'optimization',
          message: 'Add cache to speed up builds',
          priority: 'medium',
        });
      }

      // Check for parallel jobs
      if (!content.includes('parallel') && !content.includes('matrix')) {
        suggestions.push({
          type: 'optimization',
          message: 'Consider parallel jobs for faster execution',
          priority: 'low',
        });
      }

      // Check for test coverage reporting
      if (!content.includes('coverage')) {
        suggestions.push({
          type: 'quality',
          message: 'Add test coverage reporting',
          priority: 'medium',
        });
      }

      return {
        success: true,
        hasConfig: true,
        suggestions,
        summary: this._generateCICDSummary(suggestions),
      };
    } catch (error) {
      logger.error('Error analyzing CI/CD config', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async _fileExists(filePath) {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  _generateCICDSummary(suggestions) {
    if (suggestions.length === 0) {
      return 'CI/CD configuration looks good.';
    }

    let summary = 'CI/CD Analysis:\n';
    suggestions.forEach((suggestion) => {
      summary += `  - [${suggestion.priority}] ${suggestion.message}\n`;
    });

    return summary;
  }
}

/**
 * Main GitHub Assistant Agent
 * Coordinates all modules based on user input
 */
export class GitHubAssistant {
  constructor() {
    this.modules = {
      repoUnderstander: new RepoUnderstander(),
      codeSummarizer: new CodeSummarizer(),
      pullRequestReviewer: new PullRequestReviewer(),
      refactoringAdvisor: new RefactoringAdvisor(),
      testCoverageAdvisor: new TestCoverageAdvisor(),
      issueTriager: new IssueTriager(),
      projectPlanner: new ProjectPlanner(),
      securityScanner: new SecurityScanner(),
      cicdInspector: new CICDInspector(),
    };
  }

  /**
   * Process user request and route to appropriate module
   * @param {string} request - User's request
   * @param {Object} context - Additional context (file paths, repo info, etc.)
   * @returns {Promise<Object>} Response from appropriate module
   */
  async processRequest(request, context = {}) {
    try {
      const normalizedRequest = request.toLowerCase();

      // Module 1: Repository Understanding
      if (
        this._matchesPattern(normalizedRequest, [
          'what is this repo',
          'explain the structure',
          'where is',
          'what does this project do',
          'analyze repository',
        ])
      ) {
        return await this.modules.repoUnderstander.analyzeStructure(
          context.repoPath || process.cwd()
        );
      }

      // Module 2: Code Summarization
      if (
        this._matchesPattern(normalizedRequest, [
          'summarize',
          'explain this file',
          'what does this do',
          'describe',
        ])
      ) {
        if (context.filePath) {
          return await this.modules.codeSummarizer.summarizeFile(
            context.filePath
          );
        }
        return {
          success: false,
          error: 'File path required for summarization',
        };
      }

      // Module 9: CI/CD Inspection (check before PR review to avoid "review" collision)
      if (
        this._matchesPattern(normalizedRequest, [
          'ci/cd',
          'ci setup',
          'pipeline',
          'github actions',
          'workflow',
          'build slow',
          'deployment',
        ])
      ) {
        return await this.modules.cicdInspector.analyzeConfig(
          context.configPath || '.github/workflows/main.yml'
        );
      }

      // Module 3: Pull Request Review
      if (
        this._matchesPattern(normalizedRequest, [
          'review this pr',
          'review pr',
          'pr review',
          'check this pr',
          'any issues',
          'code review',
        ])
      ) {
        return await this.modules.pullRequestReviewer.reviewChanges(
          context.changes || { additions: 0, deletions: 0, files: [] }
        );
      }

      // Module 4: Refactoring Advice
      if (
        this._matchesPattern(normalizedRequest, [
          'refactor',
          'improve',
          'how can this be better',
          'suggest improvements',
        ])
      ) {
        if (context.code && context.filePath) {
          return await this.modules.refactoringAdvisor.analyzeCode(
            context.code,
            context.filePath
          );
        }
        return {
          success: false,
          error: 'Code and file path required for refactoring advice',
        };
      }

      // Module 5: Test Coverage
      if (
        this._matchesPattern(normalizedRequest, [
          'test coverage',
          'are there enough tests',
          'generate tests',
          'test this',
        ])
      ) {
        return await this.modules.testCoverageAdvisor.analyzeCoverage(
          context.sourceFile,
          context.testFile
        );
      }

      // Module 6: Issue Triage
      if (
        this._matchesPattern(normalizedRequest, [
          'categorize',
          'triage',
          'what label',
          'issue type',
        ])
      ) {
        if (context.issue) {
          return await this.modules.issueTriager.categorizeIssue(context.issue);
        }
        return {
          success: false,
          error: 'Issue information required for triage',
        };
      }

      // Module 7: Project Planning
      if (
        this._matchesPattern(normalizedRequest, [
          'plan',
          'roadmap',
          'how to build',
          'break down',
          'create tasks',
        ])
      ) {
        return await this.modules.projectPlanner.createPlan(
          context.feature || { title: request }
        );
      }

      // Module 8: Security Scanning
      if (
        this._matchesPattern(normalizedRequest, [
          'security',
          'scan',
          'vulnerability',
          'hardcoded secret',
          'security issues',
        ])
      ) {
        if (context.code && context.filePath) {
          return await this.modules.securityScanner.scanCode(
            context.code,
            context.filePath
          );
        }
        return {
          success: false,
          error: 'Code and file path required for security scan',
        };
      }

      // No match found
      return {
        success: false,
        error: 'Unable to determine request type. Please be more specific.',
        availableModules: [
          'Repository Understanding',
          'Code Summarization',
          'Pull Request Review',
          'Refactoring Advice',
          'Test Coverage',
          'Issue Triage',
          'Project Planning',
          'Security Scanning',
          'CI/CD Inspection',
        ],
      };
    } catch (error) {
      logger.error('Error processing request', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if request matches any pattern
   * @private
   */
  _matchesPattern(request, patterns) {
    return patterns.some((pattern) => request.includes(pattern));
  }

  /**
   * Get available capabilities
   * @returns {Array<Object>} List of capabilities
   */
  getCapabilities() {
    return [
      {
        id: 1,
        name: 'Repository Understander',
        description:
          'Analyze and explain repository structure, technologies, and file roles',
        triggers: ['what is this repo', 'explain structure', 'where is X'],
      },
      {
        id: 2,
        name: 'Code Summarizer',
        description: 'Summarize files, diffs, commits, or pull requests',
        triggers: ['summarize', 'explain this file'],
      },
      {
        id: 3,
        name: 'Pull Request Reviewer',
        description:
          'Review PRs for quality, logic, testing, and best practices',
        triggers: ['review this PR', 'any issues'],
      },
      {
        id: 4,
        name: 'Refactoring Advisor',
        description: 'Suggest improvements to code structure and logic',
        triggers: ['how can this be improved', 'suggest refactors'],
      },
      {
        id: 5,
        name: 'Test Coverage Advisor',
        description: 'Check test coverage and suggest test cases',
        triggers: ['are there enough tests', 'generate tests'],
      },
      {
        id: 6,
        name: 'Issue Triager',
        description: 'Auto-categorize issues and suggest labels',
        triggers: ['categorize this issue', 'what label'],
      },
      {
        id: 7,
        name: 'Project Planner',
        description: 'Break down features into tasks and implementation plans',
        triggers: ['plan this feature', 'create roadmap'],
      },
      {
        id: 8,
        name: 'Security Scanner',
        description: 'Detect insecure patterns, secrets, or risky code',
        triggers: ['scan for security', 'any hardcoded secrets'],
      },
      {
        id: 9,
        name: 'CI/CD Inspector',
        description: 'Evaluate pipelines and suggest optimizations',
        triggers: ['review CI setup', 'why is build slow'],
      },
    ];
  }
}

// Export default instance
export default new GitHubAssistant();
