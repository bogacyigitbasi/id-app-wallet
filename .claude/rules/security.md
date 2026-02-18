# Security Rules - umAI

## Mandatory Pre-Commit Checks
- No hardcoded secrets (API keys, passwords, tokens, private keys, mnemonics)
- All user inputs validated and sanitized
- No sensitive data in logs or error messages
- .env files never committed (verify .gitignore)

## ZK Circuit Security
- All circuit constraints must be complete (no under-constrained circuits)
- Public inputs must be validated before proof generation
- Proof verification must happen server-side, never trust client-only verification
- Commitment schemes must be reviewed for soundness before deployment

## Key Management
- Private keys stored only in platform Keychain/Keystore
- Key generation must use cryptographically secure randomness
- Never log or serialize private key material
- Key operations must be atomic (no partial state on failure)

## Server Security
- Parameterized queries only (no string concatenation for queries)
- Rate limiting on all public endpoints
- CORS whitelist specific origins (no wildcard in production)
- WebSocket connections must be authenticated
- Token validation on every authenticated request

## Mobile Security
- No sensitive data in AsyncStorage or UserDefaults
- Certificate pinning for production API endpoints
- WebRTC peer connections must be authenticated via signaling
- Strip debug code from release builds

## Incident Response
If a vulnerability is found:
1. Stop current work
2. Assess severity and impact
3. Fix critical issues immediately
4. Rotate any compromised credentials
5. Scan codebase for similar patterns
