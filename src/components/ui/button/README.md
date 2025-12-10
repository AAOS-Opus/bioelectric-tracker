# Button Design System

A comprehensive, accessible, and type-safe button system for React applications.

## Features

- 🎨 Multiple visual variants
- 📱 Responsive sizing options
- ⌛ Loading states and spinners
- ✅ Success/error feedback
- 🔍 Accessibility compliant
- 🌗 Dark mode support
- 🎯 Icon integration
- ⚡ Performance optimized

## Installation

The Button component is part of our UI system and requires the following peer dependencies:

```bash
npm install class-variance-authority lucide-react
```

## Basic Usage

```tsx
import { Button } from '@/components/ui/button';

// Simple button
<Button>Click me</Button>

// Button with loading state
<Button 
  isLoading 
  loadingText="Processing..."
>
  Submit
</Button>

// Button with icon
<Button 
  icon={<Mail className="w-4 h-4" />}
  iconPosition="left"
>
  Send Email
</Button>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `isLoading` | `boolean` | `false` | Shows loading spinner |
| `loadingText` | `string` | - | Text to show while loading |
| `icon` | `ReactNode` | - | Icon element |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon placement |
| `feedbackDuration` | `number` | `2000` | Duration of success/error state |
| `disableOnSuccess` | `boolean` | `true` | Disable after success |
| `disableOnError` | `boolean` | `false` | Disable after error |

Plus all standard HTML button attributes.

## Variants

### Primary Button
```tsx
<Button variant="default">Primary Action</Button>
```
Use for main calls-to-action and primary user flows.

### Secondary Button
```tsx
<Button variant="secondary">Secondary Action</Button>
```
Use for alternative or complementary actions.

### Destructive Button
```tsx
<Button variant="destructive">Delete</Button>
```
Use for dangerous or irreversible actions.

### Outline Button
```tsx
<Button variant="outline">Optional Action</Button>
```
Use for secondary actions that need visual separation.

### Ghost Button
```tsx
<Button variant="ghost">Subtle Action</Button>
```
Use for subtle actions in dense UIs.

### Link Button
```tsx
<Button variant="link">Learn More</Button>
```
Use for navigation-like actions.

## Sizes

### Default
```tsx
<Button size="default">Normal Size</Button>
```

### Small
```tsx
<Button size="sm">Small Size</Button>
```

### Large
```tsx
<Button size="lg">Large Size</Button>
```

### Icon Button
```tsx
<Button size="icon" icon={<Settings />} />
```

## Async Operations

The Button component handles asynchronous operations gracefully:

```tsx
<Button
  onClick={async () => {
    await saveData();
    // Button will show success state
  }}
  loadingText="Saving..."
>
  Save Changes
</Button>
```

### States:
1. Initial: Normal button state
2. Loading: Shows spinner and loading text
3. Success: Visual feedback (green background)
4. Error: Visual feedback (red background)
5. Disabled: Prevents further interaction

## Accessibility

The Button component follows WCAG AA guidelines:

- Proper ARIA attributes (`aria-busy`, `aria-disabled`)
- Keyboard navigation support
- Screen reader announcements
- Sufficient color contrast
- Focus indicators
- Touch target sizing

## Theme Support

Buttons automatically adapt to light/dark mode:

```css
/* Light mode */
--primary: #0066cc;
--primary-foreground: #ffffff;

/* Dark mode */
--primary: #3399ff;
--primary-foreground: #ffffff;
```

## Performance

The Button component is optimized for performance:

- Debounced click handling
- Memoized internal functions
- Cleanup on unmount
- Minimal re-renders
- CSS-in-JS optimizations

## Best Practices

1. **Use Semantic Variants**
   ```tsx
   // Good
   <Button variant="destructive">Delete Account</Button>
   
   // Avoid
   <Button className="bg-red-500">Delete Account</Button>
   ```

2. **Always Show Loading States**
   ```tsx
   // Good
   <Button isLoading={isSaving} loadingText="Saving...">
     Save Changes
   </Button>
   
   // Avoid
   <Button onClick={save}>Save Changes</Button>
   ```

3. **Provide Feedback**
   ```tsx
   // Good
   <Button
     onClick={async () => {
       await save();
       toast.success('Changes saved');
     }}
   >
     Save
   </Button>
   ```

4. **Use Appropriate Sizing**
   ```tsx
   // Good - Large for main CTAs
   <Button size="lg">Sign Up</Button>
   
   // Good - Small for dense UIs
   <Button size="sm">Filter</Button>
   ```

5. **Icon Usage**
   ```tsx
   // Good
   <Button icon={<Mail />}>Send Email</Button>
   
   // Avoid multiple icons
   <Button icon={<Mail />} iconPosition="right">
     <Phone /> Call
   </Button>
   ```

## Testing

Run the test suite:

```bash
npm test -- button.test.tsx
```

View Storybook documentation:

```bash
npm run storybook
```

## Contributing

1. Follow the variant system
2. Maintain accessibility
3. Add tests for new features
4. Update documentation
5. Consider performance implications
