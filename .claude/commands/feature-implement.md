Implement a new feature following structured development practices.

## Process

1. **Understand Requirements**
   - What is the user story/acceptance criteria?
   - Who are the affected users?
   - What are the edge cases?
   - What are the non-functional requirements?

2. **Design Phase**

   **Technical Design**
   - [ ] Data model changes identified
   - [ ] API contracts defined
   - [ ] Component breakdown done
   - [ ] State management planned
   - [ ] Error handling strategy

   **Dependencies**
   - [ ] External services needed?
   - [ ] New libraries required?
   - [ ] Database migrations needed?
   - [ ] Feature flags for rollout?

3. **Implementation Order**
   ```
   1. Database migrations (if any)
   2. Domain/business logic
   3. API endpoints
   4. UI components
   5. Integration/wiring
   6. Tests at each layer
   ```

4. **Development Checklist**

   **Before Coding**
   - [ ] Branch created from latest main
   - [ ] Task breakdown in TODO list
   - [ ] Tests written first (TDD) or test plan ready

   **During Coding**
   - [ ] Small, focused commits
   - [ ] Tests passing at each step
   - [ ] No console.log or debug code
   - [ ] Error handling implemented

   **After Coding**
   - [ ] Self code review
   - [ ] Tests cover happy path and edge cases
   - [ ] Documentation updated
   - [ ] Manual testing done

5. **Quality Gates**
   - [ ] All tests pass
   - [ ] No linting errors
   - [ ] Type checking passes
   - [ ] Security scan clean
   - [ ] Performance acceptable

6. **Pull Request**
   - [ ] Descriptive title and body
   - [ ] Linked to issue/ticket
   - [ ] Screenshots/recordings if UI
   - [ ] Testing instructions included
   - [ ] Breaking changes noted

$ARGUMENTS
