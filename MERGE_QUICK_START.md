# Branch Merge Quick Start Guide

## TL;DR - Safe Merge in 5 Steps

### Step 1: Validate Current State
```bash
# Run validation script
./scripts/validate-merge.sh

# Or manually:
npm run lint && npm run build && npm test
```

### Step 2: Choose Your Target Branch
```bash
# Switch to the branch you want to merge INTO
git checkout main
```

### Step 3: Merge Your Source Branch
```bash
# Merge the branch you want to merge FROM
git merge <your-feature-branch>
```

### Step 4: Handle Conflicts (if any)
```bash
# See conflicted files
git status

# Fix each file manually, then:
git add <fixed-file>
git merge --continue
```

### Step 5: Validate and Push
```bash
# Validate merged code
./scripts/validate-merge.sh

# If validation passes, push
git push origin main
```

---

## Common Scenarios

### Scenario 1: Merge Feature Branch into Main

**Goal:** Merge your completed feature into the main branch

```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Merge your feature
git merge feature/my-feature

# 3. Test
npm run build && npm test

# 4. Push
git push origin main

# 5. Delete feature branch (optional)
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

### Scenario 2: Update Feature Branch with Latest Main

**Goal:** Get latest main changes into your feature branch

```bash
# 1. Switch to your feature branch
git checkout feature/my-feature

# 2. Merge main into your branch
git merge main

# 3. Test
npm run build && npm test

# 4. Push
git push origin feature/my-feature
```

### Scenario 3: Merge Multiple Feature Branches

**Goal:** Combine several feature branches

```bash
# 1. Switch to target branch
git checkout main

# 2. Merge first feature
git merge feature/feature-1
npm run build && npm test

# 3. Merge second feature
git merge feature/feature-2
npm run build && npm test

# 4. Continue for each feature...

# 5. Push when all merged and tested
git push origin main
```

---

## Conflict Resolution Cheat Sheet

### If Git Says: "Automatic merge failed"

1. **Don't Panic!** This is normal.

2. **Check what conflicted:**
   ```bash
   git status
   ```

3. **Open each conflicted file and look for:**
   ```
   <<<<<<< HEAD
   Your current code
   =======
   Incoming code
   >>>>>>> branch-name
   ```

4. **Choose what to keep:**
   - Keep HEAD version (your current code)
   - Keep incoming version (merging branch code)
   - Keep both (merge manually)
   - Write new code (best solution)

5. **Remove conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)

6. **Mark as resolved:**
   ```bash
   git add <fixed-file>
   ```

7. **Continue merge:**
   ```bash
   git merge --continue
   ```

8. **Test the result:**
   ```bash
   npm run build && npm test
   ```

---

## Emergency Rollback

### If Something Goes Wrong

#### Before Pushing:
```bash
# Abort merge in progress
git merge --abort

# Or reset to before merge
git reset --hard HEAD~1
```

#### After Pushing:
```bash
# Create revert commit
git revert HEAD
git push origin <branch-name>
```

---

## Pre-Flight Checklist

Before any merge, ensure:

- [ ] Working directory is clean (`git status`)
- [ ] Latest changes fetched (`git fetch --all`)
- [ ] Tests pass locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No uncommitted changes (or stashed)

---

## Validation Script Usage

### Quick Validation
```bash
./scripts/validate-merge.sh
```

### Expected Output
```
✓ Git repository detected
✓ Working directory is clean
✓ Current branch: main
✓ Main branch exists locally
✓ Dependencies installed
✓ Lint check passed (0 errors, 70 warnings)
✓ Build successful
✓ Build artifacts generated
⚠ Some tests failed (28 passed, 8 failed)
✓ Acceptable test results (28 passing)
✓ Repository is ready for merge
```

---

## When to Merge vs. When to Wait

### ✅ Ready to Merge When:
- All tests pass (or only known failures)
- Code review approved
- Build succeeds
- No merge conflicts (or resolved)
- Feature is complete
- Documentation updated

### ⏳ Wait Before Merging When:
- Tests are failing
- Merge conflicts are complex
- Feature is incomplete
- Breaking changes not documented
- No code review yet
- CI/CD checks failing

---

## Tips for Success

1. **Merge frequently** - Small merges are easier than big ones
2. **Test thoroughly** - Before AND after merge
3. **Communicate** - Let team know about merges
4. **Keep branches updated** - Regularly merge main into feature branches
5. **Use descriptive names** - Makes tracking easier
6. **Clean up** - Delete merged branches

---

## Troubleshooting

### "fatal: refusing to merge unrelated histories"
```bash
git merge --allow-unrelated-histories <branch-name>
```

### "You have not concluded your merge"
```bash
# Either continue:
git merge --continue

# Or abort:
git merge --abort
```

### "Updates were rejected because the tip of your current branch is behind"
```bash
# Pull first:
git pull origin <branch-name>

# Or if you're sure:
git push --force-with-lease origin <branch-name>
```

### Package lock file conflicts
```bash
# Accept both changes, then:
npm install
git add package-lock.json
git merge --continue
```

---

## Getting Help

1. **Read the full guide:** `BRANCH_MERGE_GUIDE.md`
2. **Check Git status:** `git status`
3. **View merge state:** `git log --oneline --graph --all`
4. **Test locally first:** Create a test branch to practice
5. **Ask for review:** Have someone check your merge

---

## Success Indicators

After merge, you should see:

- ✅ No merge conflicts (or all resolved)
- ✅ Build completes successfully
- ✅ At least 28 tests pass
- ✅ No new lint errors
- ✅ Application runs without errors
- ✅ All features work as expected

---

## Additional Resources

- **Detailed Guide:** `BRANCH_MERGE_GUIDE.md`
- **Git Documentation:** https://git-scm.com/docs
- **Repository Status:** Run `git log --oneline --graph --all`

---

**Remember:** When in doubt, test in a separate branch first!

```bash
# Create test branch
git checkout -b test-merge

# Try merge
git merge <source-branch>

# Test it
npm run build && npm test

# If successful, do real merge
git checkout main
git merge <source-branch>
```
