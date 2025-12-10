# Button Design Guidelines

## Design Principles

### 1. Visual Hierarchy

Buttons follow a clear visual hierarchy to guide users:

```
Primary > Secondary > Outline > Ghost > Link
```

#### Color Usage
- Primary: Strong, brand colors for main actions
- Secondary: Softer, complementary colors
- Destructive: Red tones for dangerous actions
- Ghost/Link: Minimal styling for subtle actions

### 2. State Transitions

All buttons maintain consistent state transitions:

1. **Default** → Base state
2. **Hover** → Subtle color shift (100ms)
3. **Active/Pressed** → Slight scale reduction (50ms)
4. **Focus** → Ring outline (0ms)
5. **Loading** → Spinner animation (200ms)
6. **Success** → Green feedback (300ms)
7. **Error** → Red feedback (300ms)
8. **Disabled** → Reduced opacity (100ms)

### 3. Animation Specifications

```css
/* Base Transitions */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Press Animation */
transform: scale(0.98);
transition: transform 50ms ease;

/* Loading Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 1s linear infinite;
```

### 4. Spacing System

```
┌─────────────────────────┐
│   ┌─────────────┐      │
│   │   BUTTON    │      │
│   └─────────────┘      │
└─────────────────────────┘

Small (sm):
- Padding: 12px 16px
- Height: 32px
- Min-width: 64px

Default:
- Padding: 16px 24px
- Height: 40px
- Min-width: 80px

Large (lg):
- Padding: 20px 32px
- Height: 48px
- Min-width: 96px
```

### 5. Typography

```css
/* Button Text Styles */
font-family: system-ui, sans-serif;
font-weight: 500;
letter-spacing: 0.01em;

/* Sizes */
--button-text-sm: 14px;
--button-text-default: 16px;
--button-text-lg: 18px;
```

### 6. Accessibility Patterns

#### Focus States
```css
/* Focus Ring */
outline: none;
ring: 2px;
ring-offset: 2px;
ring-color: primary-500;
```

#### Touch Targets
- Minimum touch target: 44x44px
- Minimum spacing: 8px

### 7. Loading States

```
┌────────────────────┐
│ ○ Loading Text... │
└────────────────────┘

1. Spinner appears (0ms)
2. Text fades to loading text (150ms)
3. Spinner rotates continuously
4. Button width maintains size
```

### 8. Feedback States

#### Success
```css
background: var(--success);
transform: scale(1.02);
transition: all 300ms ease;
```

#### Error
```css
background: var(--destructive);
transform: shake 0.5s ease;
```

### 9. Icon Integration

```
Left Icon:            Right Icon:
┌────────────────┐    ┌────────────────┐
│ ○ Button Text  │    │ Button Text ○  │
└────────────────┘    └────────────────┘

Icon specs:
- Size: 16px/20px/24px (sm/default/lg)
- Spacing: 8px from text
- Alignment: Center aligned
```

### 10. Responsive Behavior

```css
/* Mobile (<768px) */
--button-height: 48px; /* Larger touch targets */
--button-font-size: 16px;

/* Tablet (>=768px) */
--button-height: 40px;
--button-font-size: 14px;

/* Desktop (>=1024px) */
--button-height: 36px;
--button-font-size: 14px;
```

### 11. Theme Variables

```css
/* Light Theme */
--button-bg-primary: #0066cc;
--button-text-primary: #ffffff;
--button-hover-primary: #0052a3;

/* Dark Theme */
--button-bg-primary: #3399ff;
--button-text-primary: #ffffff;
--button-hover-primary: #66b3ff;

/* Shared */
--button-radius: 6px;
--button-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
--button-transition: 200ms ease;
```

### 12. Motion Principles

1. **Quick Feedback** (<100ms)
   - Hover states
   - Press states
   - Focus rings

2. **Smooth Transitions** (200-300ms)
   - Loading states
   - Success/Error feedback
   - Theme changes

3. **Continuous Motion**
   - Loading spinners
   - Progress indicators

### 13. Error Prevention

1. **Double Submit Prevention**
   - Immediate disable on click
   - Re-enable after completion/error
   - Visual feedback during process

2. **Destructive Actions**
   - Red coloring
   - Confirmation dialogs
   - Undo capability when possible

### 14. Progressive Enhancement

1. Base Layer:
   - Semantic HTML
   - Basic styling
   - Click handling

2. Enhanced Layer:
   - Animations
   - Loading states
   - Advanced interactions

3. Optimal Layer:
   - Gesture support
   - Haptic feedback
   - Advanced animations
