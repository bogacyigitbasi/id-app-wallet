Audit and optimize performance across the stack.

## Process

1. **Establish Baseline**
   - Current response times (p50, p95, p99)
   - Throughput (requests/second)
   - Resource utilization (CPU, memory, I/O)
   - Error rates

2. **Frontend Performance**

   **Core Web Vitals**
   - [ ] LCP < 2.5s (Largest Contentful Paint)
   - [ ] FID < 100ms (First Input Delay)
   - [ ] CLS < 0.1 (Cumulative Layout Shift)
   - [ ] TTFB < 800ms (Time to First Byte)

   **Optimizations**
   - [ ] Bundle size analysis (webpack-bundle-analyzer)
   - [ ] Code splitting / lazy loading
   - [ ] Image optimization (format, sizing, lazy load)
   - [ ] Font loading strategy (preload, font-display)
   - [ ] Critical CSS inlined
   - [ ] Resource hints (preconnect, prefetch)
   - [ ] Service worker caching

3. **Backend Performance**

   **Profiling**
   - [ ] CPU profiling (flame graphs)
   - [ ] Memory profiling (heap snapshots)
   - [ ] I/O profiling (async operations)
   - [ ] Database query analysis

   **Optimizations**
   - [ ] N+1 query elimination
   - [ ] Query optimization (indexes, EXPLAIN)
   - [ ] Connection pooling
   - [ ] Caching layer (Redis, in-memory)
   - [ ] Async processing for heavy operations
   - [ ] Pagination for large result sets

4. **Database Performance**

   **Analysis**
   ```sql
   -- Slow query log
   -- Index usage statistics
   -- Table/index bloat
   -- Lock contention
   ```

   **Optimizations**
   - [ ] Missing indexes identified
   - [ ] Unused indexes removed
   - [ ] Query rewrites for efficiency
   - [ ] Proper data types
   - [ ] Vacuum/analyze scheduled

5. **Infrastructure**
   - [ ] Horizontal scaling capacity
   - [ ] Auto-scaling policies
   - [ ] CDN configuration
   - [ ] Load balancer health checks
   - [ ] Resource right-sizing

6. **Caching Strategy**
   - [ ] Cache-Control headers
   - [ ] CDN caching rules
   - [ ] Application cache (Redis)
   - [ ] Database query cache
   - [ ] Cache invalidation strategy

7. **Output**
   Report:
   - Current vs target metrics
   - Identified bottlenecks with evidence
   - Prioritized optimization recommendations
   - Implementation plan with expected impact
   - Monitoring queries/dashboards

$ARGUMENTS
