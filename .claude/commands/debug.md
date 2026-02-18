Systematically debug an issue using structured problem-solving.

## Process

1. **Reproduce the Issue**
   - What are the exact steps to reproduce?
   - What's the expected behavior?
   - What's the actual behavior?
   - Is it consistent or intermittent?
   - Environment: dev/staging/prod? OS? Browser/device?

2. **Gather Evidence**
   ```bash
   # Recent changes
   git log --oneline -20
   git diff HEAD~5..HEAD -- <suspected-files>

   # Logs
   # Check application logs, error tracking (Sentry, etc.)

   # State
   # Database state, cache state, config values
   ```

3. **Hypothesize & Test**

   Form hypotheses and test systematically:

   | Hypothesis | Test | Result |
   |------------|------|--------|
   | Data corruption | Query DB directly | |
   | Race condition | Add logging with timestamps | |
   | Config mismatch | Compare env vars | |
   | External service | Check health/response times | |
   | Memory leak | Monitor heap over time | |

4. **Common Patterns**

   **Frontend**
   - State not updating: Check immutability, re-render triggers
   - Stale data: Check cache invalidation, API response
   - Layout issues: Inspect computed styles, z-index
   - Performance: Profile with DevTools, check re-renders

   **Backend**
   - 500 errors: Check logs, exception handling
   - Slow queries: EXPLAIN ANALYZE, check indexes
   - Memory issues: Profile heap, check for leaks
   - Connection issues: Check pool, timeouts, DNS

   **Mobile**
   - Crash: Check native logs (Xcode/Android Studio)
   - ANR: Check main thread blocking
   - Memory: Profile with Instruments/Profiler

5. **Isolation Techniques**
   - [ ] Binary search through commits (git bisect)
   - [ ] Minimal reproduction case
   - [ ] Toggle feature flags
   - [ ] Compare working vs broken environment
   - [ ] Remove dependencies one by one

6. **Fix Verification**
   - [ ] Issue no longer reproduces
   - [ ] No regression in related functionality
   - [ ] Tests added to prevent recurrence
   - [ ] Root cause documented

7. **Output**
   Document:
   - Root cause analysis
   - Fix applied with reasoning
   - Prevention measures
   - Related areas to monitor

$ARGUMENTS
