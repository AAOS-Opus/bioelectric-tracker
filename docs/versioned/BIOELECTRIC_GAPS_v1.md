# Bioelectric Tracker — Known Gaps v1

**Generated:** 2025-12-10

## Critical Gaps (Blocking User Success)

### GAP-001: Phase Progression Mechanism

**Severity:** HIGH
**Impact:** Users may be stuck in "Foundation" phase indefinitely.

**Current State:**
User model tracks `currentPhaseNumber`, but the explicit trigger/logic for advancing (e.g., "Complete 30 days" or "Button click") is not exposed in the UI.

**Missing:**
-   Clear "Phase Complete" milestone UI.
-   "Advance to Next Phase" action.

**Proposed Solution:**
Implement a backend check on login that verifies criteria (dates/compliance) and triggers a visible "Level Up" modal.

---

## Moderate Gaps (Feature Incomplete)

### GAP-002: Notification Settings Frontend

**Severity:** MEDIUM
**Impact:** Users cannot manage their email/SMS preferences.

**Current State:**
`NotificationSettings` schema exists, but no user-facing "Settings" page was found to toggle these values.

**Proposed Solution:**
Build `src/app/dashboard/settings/notifications/page.tsx` and connect to backend.

### GAP-003: Password Reset Flow

**Severity:** MEDIUM
**Impact:** Users locked out if password forgotten.

**Current State:**
No "Forgot Password" link or email flow observed in `src/app/auth`.

**Proposed Solution:**
Implement standard SMTP-based password reset token flow.

---

## Minor Gaps (Polish Items)

### GAP-004: Empty State Interactions

**Severity:** LOW
**Impact:** Minor UX friction.

**Current State:**
Empty states are visually improved ("Start tracking"), but button connectivity to actual modals/forms needs verification across all widgets.

---

## Questions Requiring Answers

1.  **Phase Progression:** Is it strictly date-based (30 days/phase) or metric-based?
2.  **Product Assignment:** How does the admin/system decide which products a user sees in "Daily Protocol"? Is it hardcoded by Phase?
3.  **Affirmations:** Where should the "View Affirmation" feature displayed on the Phase Card actually lead? (Modal vs New Page).
