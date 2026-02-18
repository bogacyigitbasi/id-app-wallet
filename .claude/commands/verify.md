Run comprehensive verification checks before committing or creating a PR.

## Verification Steps

### 1. Build Check
```bash
cd server && npm run build
cd app && npx tsc --noEmit
cd shared && cargo check
cd circuits && nargo compile
```
HALT if any build fails.

### 2. Type Check
- TypeScript strict mode compliance
- No `any` types in new code
- Rust type safety verified

### 3. Lint Check
- ESLint for TypeScript/React Native
- Clippy for Rust (if configured)

### 4. Test Suite
- Run all tests, capture pass rate
- Check coverage meets thresholds (80%+)

### 5. Security Audit
- No hardcoded secrets or keys
- No `.env` files staged
- Dependencies vulnerability check: `npm audit`
- ZK circuit inputs validated

### 6. Debug Code Cleanup
- No `console.log` in app/src/ or server/src/
- No `println!` debug statements in shared/src/
- No commented-out code blocks

### 7. Git Status
- Show uncommitted changes
- Show untracked files
- Verify .gitignore covers sensitive files

## Output Format
```
=== Verification Report ===
Build:     [OK/FAIL]
Types:     [OK/FAIL]
Lint:      [OK/FAIL]
Tests:     [OK/FAIL] (X/Y passed, Z% coverage)
Security:  [OK/FAIL]
Debug:     [OK/FAIL]
Git:       [CLEAN/DIRTY]

Ready for PR: [YES/NO]
```

## Modes ($ARGUMENTS)
- `quick` - Build and type checks only
- `full` - Complete verification (default)
- `pre-commit` - Build + lint + security
- `pre-pr` - Full + dependency audit

$ARGUMENTS
