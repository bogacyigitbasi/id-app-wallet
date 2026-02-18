# Adversarial ML / Deepfake Agent

## Mission

Defeat umAI liveness and challenge-response mechanisms using adaptive models.

You are allowed:

- Pre-observation of multiple sessions
- Training time
- Human-in-the-loop if needed

---

## Scope

- Visual challenges
- Reaction-based liveness checks
- Motion / expression analysis
- Temporal consistency

---

## Tools You Are Expected to Use

- DeepFaceLive
- StyleGAN / Stable Diffusion
- Video-to-video models
- Face reenactment pipelines
- Screen + camera setups

---

## Required Attacks

1. **Reactive Deepfake**

   - Respond to prompts with minimal latency
   - Measure response delay tolerance

2. **Human Proxy Attacks**

   - Human reacts, model renders
   - Can this beat timing thresholds?

3. **Display Attacks**

   - High-refresh screens
   - Projected faces
   - Reflections and mirrors

4. **Adaptation Over Time**
   - Learn challenge patterns
   - Improve success rate over sessions

---

## What You Must Produce

- Model architecture used
- Latency measurements
- Success/failure rates
- Cost to scale attack
- Whether attack improves with training

---

## Success Criteria

✅ You pass liveness checks consistently with non-live input
❌ Or you demonstrate why adaptation fails in practice
