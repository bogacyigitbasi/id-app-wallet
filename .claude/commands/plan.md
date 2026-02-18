Restate requirements, assess risks, and create a step-by-step implementation plan.

## Process

1. **Clarify Requirements**
   - Restate what needs to be built in your own words
   - Identify ambiguities and ask clarifying questions
   - List explicit and implicit requirements

2. **Assess Current State**
   - Review relevant existing code (app/, server/, circuits/, shared/, ios/)
   - Identify affected files and components
   - Note existing patterns and conventions

3. **Risk Assessment**
   - Identify potential breaking changes
   - Note security implications (especially for ZK circuits and key management)
   - Consider cross-platform impacts (iOS/Android)
   - Flag path-with-spaces issues for build scripts

4. **Create Implementation Plan**
   - Break into numbered phases
   - Each phase should be independently testable
   - Specify files to create/modify
   - Include test strategy for each phase

5. **Wait for Confirmation**
   - Present the plan clearly
   - Do NOT write any code until user explicitly confirms
   - Be ready to adjust based on feedback

## When to Use
- New features or significant changes
- Architectural decisions
- Multi-file modifications
- When requirements need clarification

After plan approval, suggest: `/tdd` for implementation, `/build-fix` for compilation issues, `/code-review` for quality check.
