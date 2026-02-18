Deep security audit focused on umAI's critical paths: ZK proofs, key management, and WebRTC.

## Scope

### 1. Secrets Detection
- Scan for hardcoded API keys, tokens, private keys
- Check .env files are not committed
- Verify .gitignore covers all sensitive files
- Check for mnemonics or seed phrases in code

### 2. ZK Circuit Security
- Verify circuit constraints are complete (no under-constrained circuits)
- Check proof verification logic in app and server
- Validate that public inputs cannot be manipulated
- Review commitment schemes for soundness

### 3. Key Management (ios/UmAIKeyManager.swift)
- Verify Keychain usage follows Apple best practices
- Check key generation uses cryptographically secure randomness
- Validate key storage access controls
- Review key rotation and revocation flows

### 4. Server Security
- Input validation on all API endpoints
- Rate limiting on sensitive endpoints
- CORS configuration review
- WebSocket/signaling authentication
- Token service security (server/src/)

### 5. Mobile App Security
- No sensitive data in AsyncStorage/UserDefaults
- Certificate pinning for API calls
- Proper WebRTC peer authentication
- No debug/development code in release builds

### 6. Dependency Audit
```bash
cd app && npm audit
cd server && npm audit
cd shared && cargo audit 2>/dev/null || echo "Install cargo-audit: cargo install cargo-audit"
```

## Output
For each finding:
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **Location**: File:line
- **Issue**: Description
- **Impact**: What could go wrong
- **Fix**: Recommended remediation

CRITICAL and HIGH findings must be resolved before any release.

$ARGUMENTS
