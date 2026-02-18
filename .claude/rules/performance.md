# Performance Rules

## Frontend
- Bundle size budget: <200KB initial JS
- Images: WebP/AVIF, lazy load below fold
- Fonts: subset, preload critical, font-display: swap
- Animations: transform/opacity only, 60fps target
- Lists: virtualize >100 items
- No synchronous operations blocking render

## Backend
- API response time budget: p99 < 500ms
- Database queries: <100ms, use EXPLAIN
- Connection pooling required for databases
- Async for I/O operations
- Cache repeated expensive operations

## Database
- Index all foreign keys
- Composite indexes for common queries
- Avoid SELECT * (explicit columns)
- LIMIT results, paginate lists
- No N+1 queries (use JOINs or batch)

## Caching Strategy
- Cache-Control headers on static assets
- Redis/Memcached for session, frequently accessed data
- Cache invalidation strategy required
- CDN for static assets and API responses where safe

## Monitoring
- Track p50, p95, p99 latencies
- Alert on degradation, not just failures
- Profile regularly, not just when slow
- Load test before major releases
