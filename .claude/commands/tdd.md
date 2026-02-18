Implement features using strict Test-Driven Development: RED -> GREEN -> REFACTOR.

## TDD Cycle

### RED Phase - Write Failing Tests First
1. Understand the feature/fix requirements
2. Write test(s) that describe the expected behavior
3. Run the test - verify it FAILS (this is critical)
4. If the test passes without new code, the test is wrong

### GREEN Phase - Minimal Implementation
1. Write the MINIMUM code needed to pass the test
2. Do not add extra functionality
3. Run the test - verify it PASSES
4. If it fails, fix the implementation (not the test)

### REFACTOR Phase - Clean Up
1. Improve code quality while keeping tests green
2. Remove duplication
3. Improve naming and structure
4. Run ALL tests - verify everything still passes

## Coverage Requirements
- General code: minimum 80%
- ZK circuit logic: 100% (critical path)
- Key management / crypto: 100% (security critical)
- Server API endpoints: 90%
- React Native components: 80%

## Test Commands by Component
- **App**: `cd app && npm test`
- **Server**: `cd server && npm test`
- **Circuits**: `cd circuits && nargo test`
- **Shared (Rust)**: `cd shared && cargo test`

## Rules
- NEVER skip the RED phase
- NEVER write implementation before tests
- Test behavior, not implementation details
- Each test should test ONE thing
- Use descriptive test names that explain the scenario

$ARGUMENTS
