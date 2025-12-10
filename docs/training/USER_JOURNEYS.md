# Bioelectric Tracker User Journeys

## Journey 1: First-Time User Setup

**Goal:** New user registers and accesses the dashboard for the first time.

**Steps:**
1.  **Landing:** User arrives at the application root `/`.
2.  **Registration:** Clicks "Register" or "Sign Up".
3.  **Input:** Enters Name, Email, and Password (min 8 characters).
4.  **Submission:** Submits form.
5.  **Redirect:** Automatically redirected to `/dashboard`.
6.  **Orientation:** Views the "Welcome [Name]" message and "Current Phase" card (defaulting to Phase 1: Foundation).

**Decision Points:**
-   None explicitly during registration (standard flow).

**Success Criteria:**
-   User is authenticated (session created).
-   User lands on Dashboard.
-   Database record created for User.

---

## Journey 2: Daily Check-In (Quick)

**Goal:** Existing user logs daily wellness quickly.

**Steps:**
1.  **Login:** User logs in at `/auth/login`.
2.  **Review Protocol:** Checks "Daily Protocol" or "Today's Tasks" widget to see assigned supplements/products.
3.  **Log Product:** Clicks checkboxes for supplements taken (e.g., "Detox Protocol").
4.  **Check Progress:** Glances at "Your Progress" compliance percentage.
5.  **Exit:** Logs out or closes tab.

**Time Required:** < 2 minutes.

---

## Journey 3: Logging a Modality Session

**Goal:** User tracks a specific bioelectric healing session (e.g., Spooky Scalar).

**Steps:**
1.  **Access:** From Dashboard, locates "Up Next" or navigates to "Modalities".
2.  **Initiate:** Clicks "Log Session" or "Add Entry".
3.  **Configure:**
    *   Selects Type: "Spooky Scalar" or "MWO".
    *   Sets Duration: Drags slider to e.g., "60 minutes".
    *   Adds Notes: "Felt deep relaxation."
4.  **Save:** Clicks "Save Session".
5.  **Verification:** Dashboard updates "Sessions this week" count.

---

## Journey 4: Deep Dive Reflection

**Goal:** User documents detailed physical and emotional state.

**Steps:**
1.  **Access:** Opens "Daily Progress Note".
2.  **Narrative:** Writes 50-100 words in the rich text editor about mood, physical sensations, or detox symptoms.
3.  **Biomarkers:**
    *   Rates Energy (1-10).
    *   Rates Sleep Quality (1-10).
    *   Adds a custom biomarker (e.g., "Headache Intensity") if needed.
4.  **Save:** Clicks "Save Entry".
5.  **Review:** Checks "Biomarker Trends" chart to see how today compares to the last 7 days.

---

## Journey 5: Phase Progression

**Goal:** User advances from "Foundation" to "Integration".

**Current Understanding:**
-   **Trigger:** Currently appears to be time-based (`programStartDate` vs current date) or compliance-based (streak).
-   **Mechanism:** System calculates `currentPhaseNumber` on login/dashboard load.
-   **User Action:** User primarily focuses on maintaining compliance (green streaks) to ensure they are ready for the next phase.
-   **Feedback:** "Current Phase" card updates to show new Phase Name and Focus area.
