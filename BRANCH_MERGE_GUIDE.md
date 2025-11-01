# Branch Merge Safety Guide

## Overview
This guide provides step-by-step instructions for safely merging branches in the INT Smart Triage AI 2.0 repository without breaking the application.

---

## Current Repository Status

**Main Branch:** `main` (7952c2d)  
**Active Branches:** 50+ copilot branches (various features and fixes)  
**Build Status:** ✅ Passing (1.10s)  
**Test Status:** ⚠️ 28/36 tests passing (8 pre-existing failures unrelated to merge)  
**Lint Status:** ⚠️ 0 errors, 70 warnings (console.log statements - acceptable for development)

---

## Pre-Merge Checklist

Before merging any branch, complete these validation steps:

### ✅ 1. Verify Current State
```bash
# Check current branch
git branch

# Check status
git status

# Fetch latest changes
git fetch --all

# View branch relationships
git log --oneline --graph --all --decorate -20
```

### ✅ 2. Ensure Clean Working Directory
```bash
# Stash any uncommitted changes
git stash

# Or commit them
git add .
git commit -m "Save work in progress"
```

### ✅ 3. Test Current Branch
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Build the application
npm run build

# Run tests
npm test
```

**Expected Results:**
- Build should complete successfully
- At least 28 tests should pass
- No critical lint errors (warnings are acceptable)

---

## Safe Merge Strategies

### Strategy 1: Merge to Main (Recommended for Feature Branches)

This is the safest approach for merging completed feature branches.

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Merge your feature branch
git merge <your-branch-name>

# 4. If conflicts occur, see "Conflict Resolution" section below

# 5. Test after merge
npm install
npm run build
npm test

# 6. If tests pass, push to main
git push origin main

# 7. If tests fail, rollback (see "Rollback Procedure" below)
```

### Strategy 2: Merge Main into Your Branch (Update Your Branch)

Use this when you want to update your feature branch with latest main changes.

```bash
# 1. Switch to your feature branch
git checkout <your-branch-name>

# 2. Fetch latest changes
git fetch origin main

# 3. Merge main into your branch
git merge origin/main

# 4. Resolve any conflicts (see "Conflict Resolution" section)

# 5. Test your branch
npm install
npm run build
npm test

# 6. Push updated branch
git push origin <your-branch-name>
```

### Strategy 3: Rebase (Advanced - for clean history)

⚠️ **Warning:** Only use if you understand rebasing and haven't shared your branch publicly.

```bash
# 1. Switch to your feature branch
git checkout <your-branch-name>

# 2. Rebase onto main
git rebase main

# 3. Resolve conflicts as they appear
# (Git will pause at each conflict - fix, then run: git rebase --continue)

# 4. Test after rebase
npm install
npm run build
npm test

# 5. Force push (only if branch is private)
git push --force-with-lease origin <your-branch-name>
```

---

## Conflict Resolution Strategy

When Git reports merge conflicts:

### Step 1: Identify Conflicts
```bash
# See which files have conflicts
git status

# Files with conflicts will show as "both modified"
```

### Step 2: Open and Resolve Each File

Conflicts look like this:
```javascript
<<<<<<< HEAD
// Your current branch code
const value = 'current';
=======
// Incoming branch code
const value = 'incoming';
>>>>>>> branch-name
```

**Resolution Options:**
1. Keep current version (remove markers and incoming code)
2. Keep incoming version (remove markers and current code)
3. Keep both (merge manually and remove markers)
4. Write new solution (remove everything and write correct code)

### Step 3: Mark as Resolved
```bash
# After fixing a file
git add <resolved-file>

# Continue merge
git merge --continue

# Or continue rebase
git rebase --continue
```

### Step 4: Test After Resolution
```bash
npm run build
npm test
```

### Step 5: Complete Merge
```bash
# If tests pass
git push origin <branch-name>
```

---

## Common Merge Conflicts and Solutions

### Conflict Type 1: Package Dependencies

**File:** `package.json` or `package-lock.json`

**Solution:**
```bash
# Accept both changes, then regenerate lock file
npm install

# This will resolve dependency conflicts automatically
git add package-lock.json
```

### Conflict Type 2: Import Statements

**File:** Any `.js` file with import conflicts

**Solution:**
- Keep all unique imports
- Remove duplicate imports
- Ensure proper alphabetical ordering (optional)

Example:
```javascript
// Keep all unique imports from both branches
import { ComponentA } from './ComponentA.js';
import { ComponentB } from './ComponentB.js';
import { ComponentC } from './ComponentC.js';
```

### Conflict Type 3: Configuration Files

**Files:** `vite.config.js`, `vercel.json`, etc.

**Solution:**
- Carefully merge both configurations
- Test the build after merging
- Consult documentation for required fields

### Conflict Type 4: Documentation

**Files:** `*.md` files

**Solution:**
- Merge both documentation updates
- Ensure consistent formatting
- Remove duplicate sections

---

## Rollback Procedures

### If Merge Hasn't Been Pushed

```bash
# Abort merge in progress
git merge --abort

# Or abort rebase
git rebase --abort

# Reset to before merge
git reset --hard HEAD~1

# Verify state
git log --oneline -5
```

### If Merge Has Been Pushed

```bash
# Create revert commit (safe)
git revert HEAD

# Push revert
git push origin <branch-name>

# Or reset and force push (dangerous - only if no one else has pulled)
git reset --hard HEAD~1
git push --force origin <branch-name>
```

---

## Pre-Merge Testing Checklist

Before finalizing any merge, verify:

- [ ] **Build Success**
  ```bash
  npm run build
  # Should complete in ~1-2 seconds
  # Should output: dist/index.html, dist/client-success-portal.html, dist/demo.html
  ```

- [ ] **Lint Check**
  ```bash
  npm run lint
  # Should show 0 errors (warnings are OK)
  ```

- [ ] **Test Suite**
  ```bash
  npm test
  # Should pass at least 28 tests
  # Known failing tests: 8 security tests (pre-existing issues)
  ```

- [ ] **Manual Verification**
  ```bash
  # Start development server
  npm run dev
  
  # Visit http://localhost:3000/client-success-portal.html
  # Verify:
  # 1. Page loads without errors
  # 2. All components render
  # 3. No console errors (warnings are OK)
  # 4. Basic functionality works (create ticket, view dashboard, etc.)
  ```

- [ ] **File Integrity**
  ```bash
  # Check critical files exist
  ls -la dist/
  ls -la public/data/
  
  # Verify data files
  cat public/data/personas.json | head -20
  cat public/data/knowledge-base.json | head -20
  ```

---

## Post-Merge Verification

After successfully merging:

### 1. Verify CI/CD Pipeline
- Check GitHub Actions workflow status
- Ensure all checks pass

### 2. Verify Deployment (if applicable)
- Check Vercel deployment
- Test production URL
- Verify environment variables

### 3. Monitor for Issues
- Check error logs
- Monitor application performance
- Watch for user reports

### 4. Update Documentation
- Update CHANGELOG.md (if exists)
- Document any breaking changes
- Update deployment documentation

---

## Branch Cleanup

After successful merge to main:

```bash
# Delete local branch
git branch -d <merged-branch-name>

# Delete remote branch
git push origin --delete <merged-branch-name>

# Cleanup tracking branches
git fetch --prune
```

---

## Emergency Procedures

### If Application is Broken After Merge

1. **Immediate Action:**
   ```bash
   # Revert the merge commit
   git revert -m 1 HEAD
   git push origin main
   ```

2. **Notify Team:**
   - Alert team members
   - Document the issue
   - Create GitHub issue

3. **Investigation:**
   - Compare before/after states
   - Identify breaking changes
   - Create fix branch

4. **Recovery:**
   - Fix issues in new branch
   - Test thoroughly
   - Merge fix with caution

### If Merge Gets Stuck

```bash
# If merge is taking too long or errors
git merge --abort

# Or for rebase
git rebase --abort

# Then try alternative strategy
```

---

## Recommended Workflow for This Repository

Based on the repository structure, here's the recommended workflow:

### For Individual Contributors

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. **Make Changes and Test**
   ```bash
   # Make changes
   git add .
   git commit -m "Add feature"
   
   # Test locally
   npm run build
   npm test
   ```

3. **Keep Branch Updated**
   ```bash
   # Regularly merge main into your branch
   git fetch origin main
   git merge origin/main
   ```

4. **Create Pull Request**
   - Push branch to GitHub
   - Create PR to main
   - Wait for review and CI checks

5. **Merge When Ready**
   - Squash and merge (recommended)
   - Or regular merge if history is clean

### For Repository Maintainers

1. **Review PRs Carefully**
   - Check code quality
   - Verify tests pass
   - Test locally if needed

2. **Merge Strategy**
   - Use "Squash and Merge" for clean history
   - Use "Rebase and Merge" for linear history
   - Use "Create Merge Commit" for preserving branch history

3. **Post-Merge Actions**
   - Verify deployment
   - Monitor for issues
   - Clean up old branches

---

## Tools and Resources

### Git Commands Quick Reference

```bash
# View all branches
git branch -a

# Switch branches
git checkout <branch-name>

# Create and switch
git checkout -b <new-branch>

# View commit history
git log --oneline --graph --all

# Compare branches
git diff main..<branch-name>

# See what would be merged
git merge --no-commit --no-ff <branch-name>
git merge --abort  # Then abort to check

# View merge conflicts
git diff --name-only --diff-filter=U
```

### Testing Commands

```bash
# Quick validation
npm run lint && npm run build && npm test

# Detailed test output
npm test -- --reporter=spec

# Run specific test file
npm test test/integration.test.js
```

### Debugging

```bash
# View file at specific commit
git show <commit-hash>:<file-path>

# Compare file between branches
git diff main:<file> <branch>:<file>

# Find when something broke
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
# Then test each commit git provides
```

---

## Frequently Asked Questions

### Q: Which branches should I merge?

**A:** Start with branches that:
- Have passing tests
- Are up to date with main
- Have clear, focused changes
- Are no longer actively being worked on

### Q: Should I merge or rebase?

**A:**
- **Merge:** Default choice, preserves history, easier to understand
- **Rebase:** For cleaner history, but more complex, only if comfortable with it

### Q: What if tests fail after merge?

**A:** 
1. Check if tests failed before merge (baseline)
2. If new failures, revert merge and investigate
3. Fix issues in separate branch
4. Re-merge when fixed

### Q: How do I merge multiple branches?

**A:** 
1. Merge them one at a time
2. Test after each merge
3. Start with smallest/simplest changes
4. End with largest/most complex changes

### Q: Can I merge branches with conflicts?

**A:** Yes, but:
1. Understand what each branch changes
2. Have test suite ready
3. Be prepared to resolve conflicts carefully
4. Test thoroughly after resolution

---

## Conclusion

Safe branch merging requires:
1. ✅ Clean working directory
2. ✅ Up-to-date local branches
3. ✅ Passing tests before merge
4. ✅ Careful conflict resolution
5. ✅ Thorough testing after merge
6. ✅ Quick rollback if needed

**Remember:** It's always safer to merge small, focused changes frequently than large, complex changes rarely.

**When in doubt:**
- Test locally first
- Create backup branch
- Ask for review
- Merge during low-traffic times

---

## Support

For questions or issues:
1. Check this guide first
2. Review Git documentation
3. Test in isolated branch
4. Ask team for help
5. Document lessons learned

---

**Last Updated:** 2025-10-15  
**Repository:** Krosebrook/INT-Smart-Triage-AI-2.0  
**Maintainer:** Development Team
