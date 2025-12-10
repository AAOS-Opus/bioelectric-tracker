# Bioelectric Tracker Feature Inventory

**Version:** 1.0
**Status:** Initial Extraction

## Authentication & Account

**Location:** `src/app/auth/*`, `src/lib/auth.ts`
**Status:** ✅ Working

### What It Does
Securely manages user access to the application using email and password.

### How To Use It
1. **Register:** Navigate to `/auth/register`, enter Name, Email, and Password.
2. **Login:** Navigate to `/auth/login`, enter credentials.
3. **Logout:** Click the user profile menu and select "Sign Out".

### Visual Location
- Login/Register pages are standalone.
- Logout is in the top-right navigation bar.

### Known Limitations
- Password reset flow not currently visible in file exploration.

---

## Dashboard Overview

**Location:** `src/components/dashboard/PerformanceDashboard.tsx`
**Status:** ✅ Working

### What It Does
The central hub displaying high-level charts, daily tasks, and phase progress.

### How To Use It
- Access via `/dashboard`.
- View "Your Progress", "Up Next", and "Daily Protocol" cards.

### Visual Location
- Main landing page after login.

---

## Wellness Journey / Phase System

**Location:** `src/components/dashboard/PhaseProgress.tsx`, `src/models/schema.ts` (Phase model)
**Status:** ⚠️ Partial

### What It Does
Tracks the user's journey through 4 standardized phases: Foundation, Integration, Optimization, and Mastery.

### How To Use It
- View current phase on the Dashboard "Current Phase" card.
- See days remaining and current focus.
- **Progression:** Currently automated based on `programStartDate` and fixed phase durations (implied by schema dates).

### Visual Location
- Dashboard top-left "Current Phase" widget.

### Known Limitations
- Manual phase override UI not clearly identified.
- Affirmations are stored in schema but "View Affirmation" UI behavior needs verification.

---

## Product Tracking

**Location:** `src/components/dashboard/ProductTracker.tsx`, `src/models/schema.ts` (ProductUsage)
**Status:** ✅ Working

### What It Does
Logs daily usage of assigned supplements/products (Detox, Mitochondrial support).

### How To Use It
1. Locate "Daily Protocol" or "Product Tracker" widget.
2. Click usage checkboxes or status circles.
3. Status updates to "Completed" or "Skipped".

### Visual Location
- Dashboard "Daily Protocol" widget.

### Related Features
- Compliance percentage on "Your Progress" card.

---

## Modality Session Logger

**Location:** `src/components/modalities/ModalitySession.tsx`
**Status:** ✅ Working

### What It Does
Records bioelectric sessions (Spooky Scalar, MWO, etc.) with duration and notes.

### How To Use It
1. Navigate to Modalities section or click "Log Session".
2. Select Modality Type.
3. Set Duration using slider.
4. Add optional notes.
5. Click "Save Session".

### Visual Location
- Dedicated Modalities page or "Up Next" widget action.

---

## Daily Progress Notes

**Location:** `src/components/dashboard/ProgressNoteForm.tsx` (Extensively reviewed)
**Status:** ✅ Working

### What It Does
A rich-text daily journal for capturing subjective experiences and tracking specific biomarkers.

### How To Use It
1. Locate "Daily Progress Note" form.
2. Type reflection in the rich text editor (supports bold, italic, lists).
3. Use the Emoji picker for mood.
4. Adjust Biomarker sliders (Energy, Sleep, etc.) from 1-10.
5. Click "Save Entry".

### Visual Location
- Dashboard or dedicated Journal tab.

### Related Features
- Biomarker Trends chart.

---

## Biomarker Tracking & Trends

**Location:** `src/components/charts/BiomarkerCharts.tsx`, `src/components/dashboard/ProgressNoteForm.tsx`
**Status:** ✅ Working

### What It Does
Visualizes trends in subjective health metrics over time (7-day or 30-day views).

### How To Use It
- **Input:** Via Progress Note Form sliders.
- **View:** Check "Biomarker Trends" chart.
- **Filter:** Toggle individual biomarkers on/off to declutter the chart.

### Visual Location
- Dashboard "Biomarker Trends" widget.

---

## Technical Settings

**Location:** `src/models/schema.ts` (NotificationSettings)
**Status:** 🚧 Stub/Backend Only

### What It Does
Manages preferences for email/SMS reminders and timezones.

### Known Limitations
- Schema exists (`NotificationSettings`), but frontend settings page component was not exhaustively explored.
