You are a principal security architect and senior mobile systems engineer with hands-on experience in:

Mobile Secure Enclave / Android StrongBox

Zero-knowledge proof systems (Noir, MoPro, SNARKs)

Real-time video pipelines (WebRTC)

Adversarial threat modeling and red-team design

Treat the following PRD as authoritative, correct, and non-negotiable.
Do not reinterpret its guarantees, expand its claims, or “simplify” its security model.

Your job is to produce a concrete, step-by-step implementation plan that executes this PRD exactly as written.

Input

You are given the PRD below (verbatim).
Assume it has been cryptographically and architecturally reviewed.

[PASTE PRD HERE]

Hard Constraints (Must Follow)

Do NOT restate or summarize the PRD
→ Assume the reader already knows it.

Do NOT invent new guarantees
→ Only implement what the PRD explicitly claims.

Do NOT propose impossible APIs
→ No camera driver signing, no pixel attestations, no key extraction.

Every step must be buildable on iOS and Android today
→ If a step is platform-specific, call it out explicitly.

Every cryptographic step must specify:

Where it runs (device / enclave / server / proof network)

What data it sees

What it never sees

Required Output Structure

Produce the implementation plan in exactly this structure:

1. System Decomposition (Execution Units)

Break the PRD into concrete subsystems, each with:

Responsibility

Inputs

Outputs

Trust assumptions

Example format:

Mobile Capture Module

Secure Enclave Key Manager

Witness Generator

ZK Circuit Runtime

Proof Orchestrator

Verification Service

Trust Scoring Engine

2. Phase 0 — Cryptographic & Key Foundations

Step-by-step:

Device key generation (iOS vs Android)

Key storage guarantees

Public key extraction & registration

Identity provider integration (based on PRD options)

Revocation and rotation strategy (even if deferred)

Be explicit about:

APIs used

Failure modes

Platform differences

3. Phase 1 — Capture & Metadata Pipeline

Step-by-step:

Camera initialization constraints

Frame metadata extraction (exact fields from PRD)

Monotonic counters and timestamps

Motion / sensor sampling strategy

Frame indexing and buffering model

Include:

What is hashed

What is never persisted

How replay risk is minimized pre-ZK

4. Phase 2 — Witness Construction & Commitment

Step-by-step:

Metadata normalization

Poseidon hash construction

Frame Merkle tree strategy

Previous-proof chaining

Freshness salt composition

Commitment generation

Clarify:

Memory usage

On-device timing expectations

What happens on partial failure

5. Phase 3 — Secure Enclave / StrongBox Signing

Step-by-step:

Message layout to be signed

Enclave signing flow

Signature format

Error handling (lockout, throttling, failure)

Anti-replay guarantees

Explicitly state:

Why keys never leave hardware

Why this step is non-negotiable

6. Phase 4 — ZKP Circuit Implementation (Noir)

Step-by-step:

Circuit inputs (public vs private)

Constraint mapping to PRD guarantees

Signature verification inside circuit

Chain continuity constraints

Frame range constraints

Performance optimization techniques

Include:

Circuit size estimates

Expected proving time

Mobile constraints

7. Phase 5 — Proof Generation Strategy

Split into:

MVP: Fully on-device

Phase 2: Distributed proving (if enabled)

For each:

Execution flow

Latency budget

Failure fallback

Security invariants that must not be violated

8. Phase 6 — Transport & Session Binding

Step-by-step:

Session establishment

Proof ↔ WebRTC stream binding

Network replay protection

MITM resistance

Proof delivery guarantees

9. Phase 7 — Verification & Trust Scoring

Step-by-step:

Proof verification flow

Chain verification

Freshness validation

Attestation ingestion

Trust score computation

Degradation handling

Map explicitly to the PRD’s trust matrix.

10. Phase 8 — Attack Handling & Detection

For each attack class in the PRD:

How it is detected

How trust is degraded

What the user sees

How recovery works

No new attacks. Only those listed in the PRD.

11. Phase 9 — Performance, Battery & Thermal Controls

Step-by-step:

Heartbeat interval tuning

Adaptive degradation logic

Device capability detection

Emergency fallback modes

12. Phase 10 — Testing & Validation Plan

Define:

Replay simulations

Virtual camera attempts

Network manipulation tests

Thermal throttling tests

Proof chain break tests

Explain:

What success looks like

What failure looks like

13. Deliverables Checklist

End with:

SDK components

APIs exposed to integrators

Internal services required

What must exist before pilot launch

Tone & Output Rules

Be precise, not verbose

Use numbered steps, not prose

If something is hard or risky, say so explicitly

Never claim “this proves photons”

Assume the reader will build exactly what you write

Final Instruction

If a step cannot be built exactly as described in the PRD, you must stop and explain why — do not invent alternatives.

Why this prompt works

It forces execution, not ideation

It locks the model to your PRD’s guarantees

It prevents overclaiming

It produces something a senior engineer can actually implement

If you want, next I can:

Generate a Claude-optimized version (slightly different phrasing)

Generate a ChatGPT-optimized version

Run this prompt against your PRD myself and give you the full plan

Just tell me which one.

Generate a Claude-optimized version and make it copyable

Below is a Claude-optimized master prompt, tuned for Claude Code / Claude Opus-class models.
It is copy-paste ready, explicit, execution-biased, and designed to suppress hand-waving, re-interpretation, and PRD drift.

Claude responds best when:

Role authority is explicit

Constraints are concrete and repeated

Output structure is rigid

Overclaiming is explicitly forbidden

This prompt reflects that.

📌 Claude-Optimized Master Prompt

(Copy-paste exactly as is)

ROLE & OPERATING MODE (NON-NEGOTIABLE)

You are acting as a Principal Security Architect and Senior Mobile Systems Engineer with direct, hands-on experience in:

iOS Secure Enclave & Android StrongBox

DeviceCheck / Play Integrity attestation

Zero-Knowledge Proof systems (Noir, MoPro, SNARKs)

Mobile-constrained cryptography

WebRTC real-time media pipelines

Adversarial threat modeling and red-team analysis

You are not a product manager, marketer, or researcher.

You are executing an already-reviewed security architecture.

AUTHORITATIVE INPUT

You are given a Product Requirements Document (PRD) below.

Treat this PRD as:

Cryptographically correct

Architecturally sound

Non-negotiable

Do NOT:

Re-explain it

Re-summarize it

Re-interpret its guarantees

“Improve” its threat model

Add new claims

Remove constraints

Your task is pure execution planning.

OBJECTIVE

Generate a step-by-step, engineering-executable implementation plan that builds exactly what the PRD specifies.

The output must be detailed enough that:

A senior mobile engineer could start implementing immediately

A security reviewer could audit the plan

No impossible APIs or magical assumptions are introduced

HARD CONSTRAINTS (FAIL IF VIOLATED)

Do NOT restate or summarize the PRD

Do NOT invent new security guarantees

Do NOT claim camera-sensor attestation or signed drivers

Do NOT place private keys inside ZK circuits

Do NOT include raw frame pixels in proofs

Everything must be buildable on iOS + Android today

Every cryptographic step must specify:

Where it runs (device / enclave / server / proof network)

What data it sees

What data it never sees

If any requirement in the PRD is impossible to implement as written, STOP and explain why instead of inventing an alternative.

REQUIRED OUTPUT STRUCTURE

(Follow exactly — do not add or remove sections)

1. System Decomposition (Execution Units)

Break the system into concrete, implementable subsystems, each with:

Responsibility

Inputs

Outputs

Trust assumptions

Examples:

Mobile Capture Module

Secure Enclave Key Manager

Witness Generator

ZK Circuit Runtime

Proof Orchestrator

Verification Service

Trust Scoring Engine

2. Phase 0 — Cryptographic & Identity Foundations

Step-by-step:

Device key generation (iOS vs Android)

Secure storage guarantees

Public key extraction and format

Identity provider integration (pluggable per PRD)

Revocation and rotation mechanics

Explicitly note:

Platform differences

Failure modes

What breaks trust vs what degrades it

3. Phase 1 — Capture & Metadata Pipeline

Step-by-step:

Camera initialization constraints

Metadata extraction (only fields listed in PRD)

Monotonic counters and timestamps

Sensor sampling (motion, exposure, etc.)

Frame indexing and buffering model

State clearly:

What is hashed

What is ephemeral

What is never persisted

4. Phase 2 — Witness Construction & Commitments

Step-by-step:

Metadata normalization

Poseidon hash construction

Frame Merkle tree strategy

Previous-proof chaining

Freshness salt composition

Commitment generation

Include:

Memory footprint expectations

Timing expectations on mobile

Partial-failure handling

5. Phase 3 — Secure Enclave / StrongBox Signing

Step-by-step:

Exact message structure to be signed

Enclave / StrongBox signing flow

Signature encoding

Rate limiting, lockouts, and failures

Anti-replay guarantees

Explicitly state:

Why keys never leave hardware

Why this step cannot be bypassed

6. Phase 4 — ZKP Circuit Implementation (Noir)

Step-by-step:

Public vs private inputs

Constraint mapping to PRD guarantees

Signature verification inside the circuit

Proof chaining constraints

Frame-range commitments

Mobile performance optimizations

Include:

Circuit size estimates

Expected proving times

Known mobile bottlenecks

7. Phase 5 — Proof Generation Strategy

Split into:

MVP: Fully on-device proving

Phase 2: Distributed proving (if enabled)

For each:

Execution flow

Latency budget

Security invariants

Fallback behavior

8. Phase 6 — Transport & Session Binding

Step-by-step:

Session establishment

Proof ↔ WebRTC stream binding

Replay protection

MITM resistance

Failure handling

9. Phase 7 — Verification & Trust Scoring

Step-by-step:

Proof verification

Chain verification

Freshness validation

Attestation ingestion

Trust score computation

Degradation handling

Map explicitly to the PRD’s trust matrix.

10. Phase 8 — Attack Handling & Detection

For each attack class listed in the PRD:

Detection mechanism

Trust impact

User-visible behavior

Recovery path

Do not introduce new attack classes.

11. Phase 9 — Performance, Battery & Thermal Controls

Step-by-step:

Heartbeat tuning

Adaptive degradation

Device capability detection

Emergency fallback modes

12. Phase 10 — Testing & Validation Plan

Define:

Replay attack simulations

Virtual camera attempts

Network manipulation tests

Thermal throttling tests

Proof-chain break tests

Clarify:

Success criteria

Failure signals

13. Final Deliverables Checklist

List:

SDK components

APIs exposed to integrators

Internal services required

Prerequisites for pilot deployment

OUTPUT STYLE RULES

Use numbered steps, not prose

Be explicit, not verbose

State risks clearly

Never claim absolute truth or sensor-level proof

Assume engineers will implement exactly what you write

FINAL INSTRUCTION

If a step cannot be implemented exactly as described in the PRD using current mobile platforms, explicitly say so and explain the blocker.
Do not invent workarounds.
