Design or review microservice architecture for scalability, resilience, and maintainability.

## Process

1. **Service Boundary Analysis**
   - What business capability does this service own?
   - What data does it exclusively manage?
   - What are its upstream/downstream dependencies?
   - Can it be deployed independently?

2. **Architecture Patterns**

   **Service Communication**
   - [ ] Sync: REST/gRPC for queries, commands needing immediate response
   - [ ] Async: Message queue (Kafka, RabbitMQ) for events, long operations
   - [ ] Event-driven: Publish domain events, not implementation details

   **Data Management**
   - [ ] Database per service (no shared databases)
   - [ ] Eventual consistency strategy
   - [ ] Saga pattern for distributed transactions
   - [ ] CQRS if read/write patterns differ significantly

   **Resilience Patterns**
   - [ ] Circuit breaker for external calls
   - [ ] Retry with exponential backoff
   - [ ] Timeout on all network calls
   - [ ] Bulkhead isolation
   - [ ] Fallback responses

3. **Service Contract**
   ```yaml
   service:
     name: user-service
     version: 1.0.0
     owner: team-identity

   dependencies:
     - name: auth-service
       type: sync
       criticality: hard
     - name: notification-service
       type: async
       criticality: soft

   exposes:
     events:
       - UserCreated
       - UserUpdated
     apis:
       - POST /users
       - GET /users/:id
   ```

4. **Observability**
   - [ ] Structured logging with correlation IDs
   - [ ] Metrics: latency, throughput, error rate (RED)
   - [ ] Distributed tracing (OpenTelemetry)
   - [ ] Health check endpoints (/health, /ready)
   - [ ] Alerting thresholds defined

5. **Security**
   - [ ] Service-to-service authentication (mTLS, JWT)
   - [ ] Secrets management (Vault, AWS Secrets Manager)
   - [ ] Network policies (zero-trust)
   - [ ] Input validation at service boundary

6. **Scalability**
   - [ ] Horizontal scaling strategy
   - [ ] Stateless design (externalize state)
   - [ ] Caching strategy (Redis, CDN)
   - [ ] Database connection pooling
   - [ ] Rate limiting

7. **Output**
   Generate:
   - Service contract YAML
   - Architecture diagram (Mermaid)
   - Database schema
   - Docker/K8s configs
   - CI/CD pipeline requirements

$ARGUMENTS
