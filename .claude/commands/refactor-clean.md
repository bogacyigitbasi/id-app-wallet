Safely identify and remove dead code with test verification.

## Process

1. **Analyze Dead Code**
   - Find unused exports and files
   - Find unused dependencies in package.json
   - Find unused TypeScript types/interfaces
   - Check for unreachable code paths

2. **Categorize Findings**
   - **SAFE**: Unused test utilities, commented code, unused imports
   - **CAUTION**: Unused components, unused API routes
   - **DANGER**: Config files, entry points, native modules

3. **For Each Safe Deletion**
   - Run tests BEFORE deletion
   - Apply the deletion
   - Run tests AFTER deletion
   - Rollback if tests fail

4. **Report**
   - Items cleaned
   - Items skipped (with reason)
   - Test results before/after

## Rules
- Never delete without running tests first
- Never delete native module bridges (app/ios/, app/android/)
- Never delete ZK circuit files without explicit confirmation
- Preserve all .env.example files
- Keep build scripts even if they appear unused

$ARGUMENTS
