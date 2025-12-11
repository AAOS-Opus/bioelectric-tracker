# Integration Architect Triad Protocol
## Version 1.0 | December 2025

### Overview

The Integration Architect Triad is a specialized workflow protocol for deployment and system integration work within the Maestro Ensemble. It coordinates three existing agents — Gemini Pro, Kimi K2, and DevZen — into a sequential pipeline with explicit handoffs, synchronization points, and dual sign-off requirements.

This protocol activates when the task involves connecting independently-built systems into a unified deployment.

### The Triad

| Agent | Domain | Core Principle | Primary Output |
|-------|--------|----------------|----------------|
| Gemini Pro | Architecture & Sequencing | Clarity through layered sequencing | Blueprint.md, ValidationTarget.json |
| Kimi K2 | Resilience & Pre-Deployment | Silence is not safety | FailureModeCatalog.md, dont_ship_checklist.md |
| DevZen | Validation & Sign-Off | No system complete until measured | ValidationReport.md, SignOff.json |

### Workflow Sequence

Phase 1 - Architecture (Gemini Pro):
- Frame problem as layered system (L0-L3)
- Define critical path and dependencies
- Produce Blueprint.md and SequencePlan.yaml
- Identify potential fracture lines in FractureReport.md
- Output ValidationTarget.json for DevZen

Phase 2 - Resilience Analysis (Kimi K2):
- Receive Gemini's blueprint
- Decompose layers bottom-up
- Hunt silent and muted failure modes
- Produce FailureModeCatalog.md
- Define evidence requirements for each failure mode
- Output dont_ship_checklist.md for DevZen

Phase 3 - Validation (DevZen):
- Receive ValidationTarget.json from Gemini
- Receive FailureModeCatalog.md from K2
- Build unified TestPlan.md
- Execute validation across 5 categories
- Gather evidence, produce EvidenceMatrix.csv
- Submit evidence to K2 for review

Phase 4 - Sign-Off (Joint):
- K2 reviews DevZen's evidence
- K2 marks failure modes as mitigated (or rejects)
- DevZen issues SignOff.json with dual signature
- Integration declared complete

### Synchronization Points

| From | To | Artifact | Gate Condition |
|------|-----|----------|----------------|
| Gemini | K2 | Blueprint.md, FractureReport.md | Architecture frozen |
| K2 | Gemini | FailureModeCatalog.md | If redesign required |
| Gemini | DevZen | ValidationTarget.json | After K2 review complete |
| K2 | DevZen | dont_ship_checklist.md | Evidence requirements defined |
| DevZen | K2 | Gathered evidence | Before sign-off |
| K2 | DevZen | Approval/Rejection | Final gate |

### Activation Trigger

This protocol activates when a prompt includes integration or deployment context such as: Deploy X to Y, Integrate systems A B and C, Connect X to the cluster, Wire up the infrastructure.

The agents recognize the context and operate according to this protocol rather than general-purpose modes.

### Exit Criteria

Integration is complete when:
1. Gemini's architecture has survived K2's stress analysis
2. All failure modes in K2's catalog are either mitigated or explicitly accepted with evidence
3. DevZen's five-category validation passes thresholds defined in ValidationTarget.json
4. K2 has reviewed and approved DevZen's evidence
5. SignOff.json exists with dual signature (K2 + DevZen)

### Reference Files

- gemini-integration-role.md — Gemini Pro's integration responsibilities
- kimi-integration-role.md — Kimi K2's integration responsibilities
- devzen-integration-role.md — DevZen's integration responsibilities
- templates/ — Standard templates for all deliverables
