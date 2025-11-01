import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  validateProjectStructure,
  runCommand,
} from '../scripts/validate-imports.js';

describe('Import Validation Script', () => {
  describe('validateProjectStructure()', () => {
    it('should validate that critical files exist', () => {
      const result = validateProjectStructure();
      assert.strictEqual(
        result,
        true,
        'All critical project files should exist'
      );
    });

    it('should validate package.json exists', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      assert.strictEqual(
        existsSync(packageJsonPath),
        true,
        'package.json should exist'
      );
    });

    it('should validate src directory exists', () => {
      const srcPath = join(process.cwd(), 'src');
      assert.strictEqual(existsSync(srcPath), true, 'src/ should exist');
    });

    it('should validate api directory exists', () => {
      const apiPath = join(process.cwd(), 'api');
      assert.strictEqual(existsSync(apiPath), true, 'api/ should exist');
    });

    it('should validate test directory exists', () => {
      const testPath = join(process.cwd(), 'test');
      assert.strictEqual(existsSync(testPath), true, 'test/ should exist');
    });

    it('should validate vite.config.js exists', () => {
      const viteConfigPath = join(process.cwd(), 'vite.config.js');
      assert.strictEqual(
        existsSync(viteConfigPath),
        true,
        'vite.config.js should exist'
      );
    });
  });

  describe('runCommand()', () => {
    it('should execute a successful command', () => {
      const result = runCommand('echo "test"', 'Test echo command');
      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.ok(result.output, 'Should have output');
    });

    it('should handle command failure gracefully', () => {
      const result = runCommand('exit 1', 'Test failing command');
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.error, 'Should have error information');
    });

    it('should return output from successful commands', () => {
      const result = runCommand('echo "hello world"', 'Test output');
      assert.ok(
        result.output.includes('hello world'),
        'Output should contain command result'
      );
    });
  });

  describe('Integration', () => {
    it('should have validate:imports script in package.json', () => {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf8')
      );
      assert.ok(
        packageJson.scripts['validate:imports'],
        'Should have validate:imports script'
      );
    });

    it('should have all required validation scripts', () => {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf8')
      );
      const requiredScripts = [
        'validate:imports',
        'format:check',
        'lint',
        'test',
        'build',
      ];

      requiredScripts.forEach((script) => {
        assert.ok(packageJson.scripts[script], `Should have ${script} script`);
      });
    });

    it('should have validation script file', () => {
      const scriptPath = join(process.cwd(), 'scripts/validate-imports.js');
      assert.strictEqual(
        existsSync(scriptPath),
        true,
        'Validation script should exist'
      );
    });

    it('should have validation documentation', () => {
      const docsPath = join(process.cwd(), 'docs/IMPORT_VALIDATION.md');
      assert.strictEqual(
        existsSync(docsPath),
        true,
        'Validation documentation should exist'
      );
    });

    it('should have scripts README', () => {
      const readmePath = join(process.cwd(), 'scripts/README.md');
      assert.strictEqual(
        existsSync(readmePath),
        true,
        'Scripts README should exist'
      );
    });
  });
});
