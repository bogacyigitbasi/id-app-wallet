# Git Workflow Rules

## Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `hotfix/` - Production emergency fixes
- `refactor/` - Code improvements
- `docs/` - Documentation
- `test/` - Test additions

Format: `{type}/{ticket-id}-{short-description}`
Example: `feature/PROJ-123-user-authentication`

## Commit Messages
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(auth): add OAuth2 login flow

- Implement Google OAuth provider
- Add token refresh mechanism
- Store tokens securely in keychain

Closes #123
```

## Pull Request Rules
- One logical change per PR
- Linked to issue/ticket
- Description includes: what, why, how to test
- All CI checks pass
- At least one approval required
- No merge conflicts
- Squash commits if >5 commits

## Protected Branches
- `main`: Production, requires PR + approval
- `develop`: Integration, requires PR
- Direct commits only for emergencies

## Code Review Checklist
- [ ] Logic correct and complete
- [ ] Tests included and passing
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Breaking changes noted
