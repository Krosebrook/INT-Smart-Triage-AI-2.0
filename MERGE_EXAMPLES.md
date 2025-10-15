# Branch Merge Examples

This document provides real-world examples of common merge scenarios in the INT Smart Triage AI 2.0 repository.

---

## Example 1: Merging a Feature Branch into Main

**Scenario:** You've completed a feature on branch `feature/new-triage-algo` and want to merge it into `main`.

### Step-by-Step Process

```bash
# Step 1: Validate your feature branch
git checkout feature/new-triage-algo
./scripts/validate-merge.sh

# Step 2: Update with latest main
git fetch origin main
git merge origin/main

# Step 3: Resolve any conflicts (if they occur)
# Edit conflicted files, then:
git add .
git merge --continue

# Step 4: Validate after merge
./scripts/validate-merge.sh

# Step 5: Switch to main and merge
git checkout main
git pull origin main
git merge feature/new-triage-algo

# Step 6: Final validation
./scripts/validate-merge.sh

# Step 7: Push to main
git push origin main

# Step 8: Clean up (optional)
git branch -d feature/new-triage-algo
git push origin --delete feature/new-triage-algo
```

### Expected Output

```
✓ All tests passed (35 tests)
✓ Build successful
✓ Repository is ready for merge
```

---

## Example 2: Updating Your Branch with Latest Main

**Scenario:** Your branch `feature/my-work` is out of date and you need to get the latest changes from `main`.

### Step-by-Step Process

```bash
# Step 1: Ensure main is up to date
git checkout main
git pull origin main

# Step 2: Switch to your feature branch
git checkout feature/my-work

# Step 3: Merge main into your branch
git merge main

# Step 4: Handle conflicts
# If conflicts occur:
git status  # See which files are conflicted
# Edit each file to resolve conflicts
git add <resolved-files>
git merge --continue

# Step 5: Validate
./scripts/validate-merge.sh

# Step 6: Push updated branch
git push origin feature/my-work
```

---

## Example 3: Handling Merge Conflicts

**Scenario:** You're merging `feature/branch-a` into `main` and encounter conflicts.

### Conflict in JavaScript File

**Before (Conflict Markers):**
```javascript
<<<<<<< HEAD
function processTicket(ticket) {
  return triageEngine.process(ticket);
}
=======
function processTicket(ticket, options) {
  return triageEngine.processWithOptions(ticket, options);
}
>>>>>>> feature/branch-a
```

**After (Resolved - keeping both changes):**
```javascript
function processTicket(ticket, options = {}) {
  return triageEngine.processWithOptions(ticket, options);
}
```

**Resolution Steps:**
```bash
# 1. Edit the file to resolve conflict
vim src/services/triageEngine.js

# 2. Remove conflict markers
# 3. Choose appropriate solution
# 4. Save file

# 5. Mark as resolved
git add src/services/triageEngine.js

# 6. Continue merge
git merge --continue

# 7. Validate
./scripts/validate-merge.sh
```

### Conflict in Package Files

**Scenario:** Both branches added different dependencies.

```bash
# Accept both changes, then regenerate lock file
git checkout --theirs package.json
npm install
git add package.json package-lock.json
git merge --continue
```

---

## Example 4: Merge with Pre-existing Test Failures

**Scenario:** Some tests are already failing on `main` (known issues).

### Validation Output

```bash
$ ./scripts/validate-merge.sh

✓ Git repository detected
✓ Working directory is clean
⚠ Some tests failed (35 passed, 8 failed)
  This is expected - 8 pre-existing test failures are known
✓ Acceptable test results (35 passing)
✓ Repository is ready for merge
```

### Decision Tree

1. **If test count unchanged** (still 35 passing) → Safe to merge
2. **If fewer tests pass** (e.g., 30 passing) → Investigation needed
3. **If more tests pass** (e.g., 40 passing) → Excellent! Proceed
4. **If same failures present before your changes** → Safe to ignore

### How to Check Baseline

```bash
# Before making changes
git checkout main
npm test > /tmp/baseline-tests.txt

# After your changes
git checkout feature/your-branch
npm test > /tmp/current-tests.txt

# Compare
diff /tmp/baseline-tests.txt /tmp/current-tests.txt
```

---

## Example 5: Emergency Rollback

**Scenario:** You merged a branch but discovered it broke something critical.

### Immediate Rollback (Before Deploy)

```bash
# Option 1: Revert the merge commit
git revert -m 1 HEAD
git push origin main

# Option 2: Reset to previous commit (dangerous!)
git reset --hard HEAD~1
git push --force origin main  # Use with caution!
```

### Post-Deploy Rollback

```bash
# 1. Identify the bad merge commit
git log --oneline -10

# 2. Revert it (safest)
git revert -m 1 <commit-hash>

# 3. Push immediately
git push origin main

# 4. Verify deployment
# Check application is working

# 5. Create hotfix branch to investigate
git checkout -b hotfix/investigate-merge-issue
```

---

## Example 6: Merging Multiple Feature Branches

**Scenario:** You have 3 feature branches to merge: `feature/ui-update`, `feature/api-fix`, and `feature/tests`.

### Recommended Order

1. **Smallest changes first** (least risk)
2. **Dependencies second** (foundation)
3. **Largest changes last** (most complex)

### Step-by-Step

```bash
# 1. Start with smallest (feature/tests)
git checkout main
git pull origin main
git merge feature/tests
./scripts/validate-merge.sh
git push origin main

# 2. Merge second branch (feature/api-fix)
git pull origin main  # Get latest
git merge feature/api-fix
./scripts/validate-merge.sh
git push origin main

# 3. Merge largest branch (feature/ui-update)
git pull origin main
git merge feature/ui-update
./scripts/validate-merge.sh
git push origin main

# 4. Final validation
npm run build
npm test
npm run lint
```

### If Something Goes Wrong

```bash
# Revert the problematic merge
git revert -m 1 HEAD
git push origin main

# Fix the issue in a new branch
git checkout -b fix/merge-issue
# Make fixes
git push origin fix/merge-issue
# Create PR, review, merge
```

---

## Example 7: Testing a Merge Before Committing

**Scenario:** You want to see what will happen before actually merging.

### Dry Run Merge

```bash
# Create a test branch
git checkout main
git checkout -b test-merge

# Attempt merge
git merge feature/my-branch

# If successful, test everything
./scripts/validate-merge.sh
npm run build
npm test

# If it works, do the real merge
git checkout main
git merge feature/my-branch
git push origin main

# Clean up test branch
git branch -D test-merge
```

### Check What Would Be Merged

```bash
# See commits that would be merged
git log main..feature/my-branch --oneline

# See files that would change
git diff main...feature/my-branch --stat

# See actual changes
git diff main...feature/my-branch
```

---

## Example 8: Dealing with Complex Conflicts

**Scenario:** Multiple files have conflicts after merging.

### Systematic Approach

```bash
# 1. See all conflicted files
git status

# Example output:
# both modified:   src/services/triageEngine.js
# both modified:   src/components/Dashboard.js
# both modified:   package.json

# 2. Resolve one at a time, easiest first
# Start with package.json (can regenerate)
git checkout --theirs package.json
npm install
git add package.json package-lock.json

# 3. Move to code files
vim src/components/Dashboard.js
# Resolve conflicts, save file
git add src/components/Dashboard.js

# 4. Resolve complex file last
vim src/services/triageEngine.js
# Take time to understand both changes
# Combine them properly
git add src/services/triageEngine.js

# 5. Validate after each file
npm run lint
npm run build

# 6. Complete merge
git merge --continue

# 7. Final validation
./scripts/validate-merge.sh
```

---

## Example 9: Cherry-Picking Specific Changes

**Scenario:** You only want one commit from a feature branch, not the whole branch.

### Cherry-Pick Process

```bash
# 1. Find the commit you want
git log feature/other-branch --oneline

# 2. Switch to target branch
git checkout main

# 3. Cherry-pick the commit
git cherry-pick <commit-hash>

# 4. Validate
./scripts/validate-merge.sh

# 5. Push
git push origin main
```

---

## Example 10: Merge with Renamed Files

**Scenario:** Your branch renamed files that were also modified in main.

### Git Smart Merge

```bash
# Git usually handles this automatically
git merge feature/renamed-files

# If conflicts occur with renamed files:
git status  # Shows the rename and conflict

# Resolve conflict in the NEW filename
vim path/to/new-filename.js

# Mark as resolved
git add path/to/new-filename.js

# Continue
git merge --continue
```

---

## Troubleshooting Common Issues

### Issue: "You have not concluded your merge"

```bash
# Check status
git status

# Either continue:
git merge --continue

# Or abort:
git merge --abort
```

### Issue: "Updates were rejected"

```bash
# Pull first
git pull origin main

# Then push
git push origin main
```

### Issue: "Merge conflict in package-lock.json"

```bash
# Simple fix - regenerate
git checkout --ours package.json
npm install
git add package-lock.json package.json
git merge --continue
```

### Issue: Tests failing after merge

```bash
# Compare with baseline
git checkout main^  # Previous commit
npm test > /tmp/before.txt

git checkout main
npm test > /tmp/after.txt

diff /tmp/before.txt /tmp/after.txt

# If new failures, investigate
# If same failures, safe to ignore
```

---

## Best Practices Summary

1. **Always validate before and after merging**
   ```bash
   ./scripts/validate-merge.sh
   ```

2. **Keep branches small and focused**
   - Easier to merge
   - Less risk of conflicts
   - Faster to review

3. **Merge frequently**
   - Keep your branch updated with main
   - Prevents large conflict accumulation

4. **Test thoroughly**
   - Run full test suite
   - Manual testing of affected features
   - Check for regression

5. **Use descriptive commit messages**
   - Helps with troubleshooting
   - Makes history clear

6. **Clean up merged branches**
   ```bash
   git branch -d feature/merged-branch
   git push origin --delete feature/merged-branch
   ```

7. **Document complex merges**
   - Note any manual changes
   - Explain conflict resolutions
   - Update relevant documentation

---

## Quick Reference Commands

```bash
# Pre-merge validation
./scripts/validate-merge.sh

# Standard merge
git checkout main
git merge feature/branch

# Merge with strategy
git merge -X theirs feature/branch  # Prefer their changes
git merge -X ours feature/branch    # Prefer our changes

# Abort merge
git merge --abort

# Revert merge
git revert -m 1 HEAD

# See merge status
git status
git log --oneline --graph --all -10

# Compare branches
git diff main...feature/branch --stat
```

---

## Additional Resources

- Full Guide: [BRANCH_MERGE_GUIDE.md](./BRANCH_MERGE_GUIDE.md)
- Quick Start: [MERGE_QUICK_START.md](./MERGE_QUICK_START.md)
- Git Documentation: https://git-scm.com/docs/git-merge

---

**Remember:** When in doubt, test in a separate branch first, and always have a rollback plan ready!
