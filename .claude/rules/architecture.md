# Architecture Rules

## Layered Architecture
- **Presentation Layer**: UI components, API controllers
- **Application Layer**: Use cases, orchestration
- **Domain Layer**: Business logic, entities
- **Infrastructure Layer**: Database, external services

Dependencies flow inward: Presentation → Application → Domain ← Infrastructure

## Component Design
- One responsibility per component/module
- Max 500 lines per file (split if larger)
- Prefer composition over inheritance
- Use dependency injection
- Interfaces at boundaries

## Data Flow
- Unidirectional data flow in UI
- Immutable data structures preferred
- Validate at system boundaries
- Transform data at edges, not in core

## API Design
- RESTful for CRUD, GraphQL for complex queries
- Version APIs from day one (/v1/)
- Pagination for all list endpoints
- Rate limiting on public endpoints

## Error Handling
- Use domain-specific error types
- Never swallow exceptions silently
- Log with context (correlation ID, user, action)
- User-friendly messages, detailed internal logs

## State Management
- Single source of truth
- State shape normalized
- Derived data computed, not stored
- Async state: loading/success/error

## Cross-Cutting Concerns
- Authentication/authorization via middleware
- Logging and monitoring via interceptors
- Caching as infrastructure concern
- Feature flags for gradual rollouts
