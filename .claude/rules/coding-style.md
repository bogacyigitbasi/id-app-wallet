# Coding Style Rules - umAI

## General
- Functions: max 50 lines
- Files: max 800 lines (prefer 200-400)
- Nesting depth: max 4 levels
- No magic numbers - use named constants
- Descriptive variable/function names (no single-letter except loop counters)

## TypeScript (app/ and server/)
- Strict mode always enabled
- No `any` type - use proper types or `unknown` with type guards
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `readonly` for data that shouldn't be mutated
- Async/await over raw promises
- Explicit return types on exported functions
- Destructure props in React components

## Rust (shared/)
- Follow Rust idioms (Result/Option, pattern matching)
- Use `clippy` suggestions
- Derive traits where applicable
- Document public API with doc comments
- Error types should implement `std::error::Error`

## Noir (circuits/)
- Clear constraint documentation
- Name all intermediate variables
- Group related constraints with comments
- Test all edge cases for circuit inputs

## Swift (ios/)
- Follow Apple's Swift API Design Guidelines
- Use value types (struct) over reference types (class) where possible
- Guard clauses for early returns
- Keychain operations must have proper error handling

## Error Handling
- Never silently swallow errors
- User-facing errors must be helpful and actionable
- Server errors must log sufficient context for debugging
- Use typed errors, not string messages
