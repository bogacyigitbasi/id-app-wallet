1:1 Streaming Agent
Quality · Security · Resilience Development Plan (MoQ-Inspired, Production-Safe)
0️⃣ Design posture (updated)

P2P first, Edge relay second

WebRTC today, MoQ tomorrow

Never trust the Edge

All media paths are replaceable

Observability > cleverness

MoQ is treated as an edge transport optimization, not a hard dependency.

1️⃣ Streaming Quality Plan (Revised)
1.1 Dual-path media architecture (critical change)
Client ↔ Client (Primary, WebRTC P2P)
Client ↔ Edge Relay (Fallback / Optimization)

Primary path

WebRTC P2P

Lowest latency

Lowest cost

Proven on hostile networks

Edge relay path

Media over QUIC (MoQ) via WebTransport

Used when:

NAT traversal fails

Recording / replay needed

AI agent interception required

Network quality degrades

This gives you MoQ benefits without MoQ fragility.

1.2 Edge “Streaming Cell” concept (adapted)

Instead of replacing SFUs outright:

Edge Cell responsibilities

Optional media relay (not mandatory)

Short rolling buffer (GOP-level)

Egress-free persistence

Protocol translation (WebRTC ⇄ MoQ)

Cloudflare primitives

Workers (WebTransport ingress)

Durable Objects (per-call coordination)

R2 (cold-ish media storage)

Cache API (PoP-local bursts)

Key change vs your doc:

Durable Objects coordinate streams — they are not assumed to be infinite fan-out broadcasters.

1.3 Quality control rules (unchanged, but enforced harder)

Audio always prioritized

Video capped at:

720p / 30fps default

Explicit downgrade ladder:

FPS ↓

Resolution ↓

Video pause

Background / mobile throttling mandatory

MoQ does not remove the need for brutal client-side policy.

2️⃣ Security Plan (MoQ-aligned, realistic)
2.1 Transport security (clarified)

WebRTC path

DTLS-SRTP

ICE + TURN fallback

TLS 1.2+

MoQ / WebTransport path

QUIC (TLS 1.3 mandatory)

Encrypted by default

No plaintext media ever allowed

Important correction:

QUIC ≠ trust. Encryption ≠ authorization.

2.2 Token-based access (kept, refined)

Tokens are mandatory for both paths.

JWT / HMAC token scope

{
"call_id": "c_123",
"user_id": "agent_7",
"role": "publisher|subscriber",
"transport": ["webrtc", "moq"],
"exp": 1700000000
}

Rules:

One token per call

TTL ≤ 2 minutes

Transport explicitly scoped

Validated before WebTransport accept

This prevents MoQ endpoints becoming an attack surface.

2.3 Media confidentiality (MoQ-safe E2EE)

For sensitive agent calls:

Payload encrypted before transport

Transport only sees:

MoQ headers

Object metadata

Payload opaque to:

Workers

Durable Objects

R2

This aligns perfectly with your “never trust the edge” stance — and works for both WebRTC Insertable Streams and MoQ.

3️⃣ Resilience Plan (corrected for reality)
3.1 Failure semantics (explicit)
Failure Behavior
P2P ICE fails Switch to TURN
TURN fails Edge relay via MoQ
PoP dies Client reconnects & resubscribes
QUIC migration Allowed only after token validation
Worker crash DO state rehydrates

Key clarification:

QUIC migrates networks, not failed PoPs.
Reconnect logic is mandatory.

3.2 Durable Object guardrails (new)

Hard constraints:

Max subscribers per DO

Max in-memory buffer (e.g. 2–3 GOPs)

Backpressure on slow consumers

Drop-on-overflow, never block ingest

This prevents DOs from becoming accidental SFUs.

3.3 TURN + Edge redundancy

TURN remains non-negotiable

At least 2 regions

DNS + health checks

Edge relay is additive, not replacement

4️⃣ Storage & Replay (MoQ strength retained)
4.1 Egress-free archival

R2 private buckets

Write-only from Worker

Signed access only

Lifecycle rules enforced

4.2 Format strategy

fMP4 fragments for interoperability

Optional MoQ-native objects for low-latency replay

No assumption that clients speak MoQ forever

This avoids format lock-in.

5️⃣ JiT Transcoding (downgraded to “experimental”)

This is where we apply discipline.

v1

❌ No live transcoding

Fixed bitrate tracks only

v2 (explicitly experimental)

Wasm-FFmpeg for:

Rare fallback

Thumbnail / preview

AI agent sampling

Strict CPU quotas

Cache-first strategy

This saves you from self-inflicted outages.

6️⃣ Observability (expanded)
6.1 Transport-aware metrics

Track separately:

WebRTC success rate

TURN usage %

MoQ relay usage %

Reconnect frequency

Time-to-first-frame (TTFF)

6.2 MoQ-specific KPIs

Object loss

QUIC stream resets

Re-subscription latency

Buffer underruns

If MoQ degrades UX, you must see it immediately.

7️⃣ Phased rollout (updated)
Phase 1 – Proven core

WebRTC P2P

TURN fallback

JWT auth

Metrics

Phase 2 – Edge assist

Cloudflare Workers ingest

Durable Object coordination

R2 archival

Phase 3 – MoQ opt-in

MoQ for replay / agents

Limited live relay

Feature-flagged

Kill switch always on
