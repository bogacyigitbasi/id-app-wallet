Review uncommitted code changes for security vulnerabilities, code quality, and best practices.

## Process

1. **Get Changes**
   ```bash
   git diff HEAD
   git diff --cached
   git status
   ```

2. **Security Review (CRITICAL - check first)**
   - [ ] No hardcoded secrets, API keys, or tokens
   - [ ] No private keys or mnemonics in code
   - [ ] SQL injection prevention (parameterized queries)
   - [ ] XSS prevention (sanitized output)
   - [ ] Input validation at all boundaries
   - [ ] ZK proof verification logic is correct
   - [ ] Key management follows secure patterns
   - [ ] No sensitive data in logs or error messages
   - [ ] WebRTC/signaling security checks

3. **Code Quality**
   - [ ] Functions under 50 lines
   - [ ] Files under 800 lines
   - [ ] Nesting depth <= 4 levels
   - [ ] No code duplication
   - [ ] Consistent naming conventions
   - [ ] TypeScript types properly defined (no `any`)
   - [ ] Error handling is comprehensive
   - [ ] No console.log in production code

4. **Architecture**
   - [ ] Changes follow existing patterns
   - [ ] No tight coupling between components
   - [ ] Clean separation: app/ | server/ | circuits/ | shared/
   - [ ] API contracts maintained

5. **Report**
   For each issue found:
   - Severity: CRITICAL | HIGH | MEDIUM | LOW
   - File and line number
   - Description of issue
   - Suggested fix

   **Block commit if CRITICAL or HIGH issues found.**

$ARGUMENTS
