# Documentation Rules

## Code Documentation

### When to Comment
- Complex algorithms (explain WHY, not WHAT)
- Non-obvious business logic
- Workarounds with links to issues
- Public API interfaces

### When NOT to Comment
- Self-explanatory code
- Obvious operations
- Outdated information (delete instead)

### Format
```typescript
/**
 * Brief description of what it does.
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws ErrorType - When this error occurs
 * @example
 * const result = myFunction('input');
 */
```

## README Requirements
Every project must have:
1. **What** - Brief description
2. **Why** - Problem it solves
3. **Quick Start** - Get running in <5 minutes
4. **Configuration** - Environment variables, options
5. **Architecture** - High-level overview
6. **Contributing** - How to contribute

## API Documentation
- OpenAPI/Swagger spec required
- Examples for each endpoint
- Error responses documented
- Authentication explained

## Architecture Documentation
- C4 diagrams for context, containers, components
- ADRs for significant decisions
- Sequence diagrams for complex flows
- Data flow diagrams

## Changelog
- Maintain CHANGELOG.md
- Follow Keep a Changelog format
- Semantic versioning
- Note breaking changes prominently
