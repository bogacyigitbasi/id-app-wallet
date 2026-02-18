# Testing Rules - umAI

## Coverage Targets
- General code: 80% minimum
- ZK proof logic: 100% (security critical)
- Key management: 100% (security critical)
- Server API endpoints: 90%
- React Native components: 80%

## Test-First Development
- Write failing tests before implementation
- Each test covers ONE behavior
- Test names describe the scenario: `should_reject_invalid_proof_inputs`
- Test behavior, not implementation details

## Test Structure
- Arrange: Set up test data and preconditions
- Act: Execute the code under test
- Assert: Verify expected outcomes

## What to Test
- Happy path (expected inputs produce expected outputs)
- Error cases (invalid inputs, network failures, timeouts)
- Edge cases (empty inputs, boundary values, null/undefined)
- Security paths (unauthorized access, malformed tokens)

## What NOT to Test
- Third-party library internals
- Trivial getters/setters
- Framework boilerplate (React Native navigation setup)

## Running Tests
- App: `cd app && npm test`
- Server: `cd server && npm test`
- Circuits: `cd circuits && nargo test`
- Shared: `cd shared && cargo test`

## When Tests Fail
- Fix the code, not the test (unless the test is wrong)
- Never comment out failing tests
- Never merge with failing tests
