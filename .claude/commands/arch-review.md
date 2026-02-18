Review software architecture for maintainability, scalability, and alignment with requirements.

## Process

1. **Context Understanding**
   - What problem does the system solve?
   - Who are the users/stakeholders?
   - What are the quality attribute requirements?
     - Performance: latency, throughput
     - Scalability: load growth expectations
     - Availability: uptime requirements (99.9%?)
     - Security: compliance, data sensitivity

2. **Architecture Views**

   **Component Diagram**
   - [ ] All major components identified
   - [ ] Clear boundaries and responsibilities
   - [ ] Dependencies flow in correct direction
   - [ ] No circular dependencies

   **Data Flow**
   - [ ] Data enters system at defined points
   - [ ] Data transformations documented
   - [ ] Data at rest and in transit protected
   - [ ] Data retention policies clear

   **Deployment View**
   - [ ] Infrastructure components mapped
   - [ ] Network topology clear
   - [ ] Scaling boundaries identified
   - [ ] Failure domains isolated

3. **Design Principles Check**

   **SOLID**
   - [ ] Single Responsibility
   - [ ] Open/Closed (extend, don't modify)
   - [ ] Liskov Substitution
   - [ ] Interface Segregation
   - [ ] Dependency Inversion

   **Clean Architecture**
   - [ ] Dependencies point inward
   - [ ] Business logic independent of frameworks
   - [ ] UI independent of business logic
   - [ ] Database is a detail, not the center

4. **Quality Attributes**

   **Maintainability**
   - [ ] Code is readable and well-documented
   - [ ] Consistent patterns across codebase
   - [ ] Testability built in
   - [ ] Low coupling, high cohesion

   **Scalability**
   - [ ] Horizontal scaling possible
   - [ ] Stateless where needed
   - [ ] Database scaling strategy
   - [ ] Caching strategy

   **Resilience**
   - [ ] Failure modes identified
   - [ ] Graceful degradation
   - [ ] Recovery procedures
   - [ ] Monitoring and alerting

5. **Technical Debt Assessment**
   - [ ] Known tech debt documented
   - [ ] Debt repayment prioritized
   - [ ] New debt justified and tracked
   - [ ] Refactoring opportunities identified

6. **Architecture Decision Records (ADRs)**
   ```markdown
   # ADR-001: [Decision Title]

   ## Status
   Proposed | Accepted | Deprecated | Superseded

   ## Context
   What is the issue we're addressing?

   ## Decision
   What is the change we're proposing?

   ## Consequences
   What becomes easier or harder?
   ```

7. **Output**
   Generate:
   - C4 diagrams (Context, Container, Component)
   - Quality attribute matrix
   - Risk register
   - ADRs for key decisions
   - Improvement roadmap

$ARGUMENTS
