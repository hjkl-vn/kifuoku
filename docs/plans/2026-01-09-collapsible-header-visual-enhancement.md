# Collapsible Header Visual Enhancement

## Problem

On mobile layout, the replay controls (range slider and replay buttons) are hidden behind the collapsible header. Users don't realize the header is interactive, leaving them stuck in study phase without knowing how to start replay.

## Solution

Add persistent visual hints to the header bar that signal expandability:

1. **Larger, accented arrow** - The expand/collapse arrow gets a colored circular background
2. **Colored bottom border** - A subtle border reinforces "there's more below"

## Design Details

### Arrow Treatment

- Increase arrow size (1.5× current or explicit larger font-size)
- Wrap in circular/rounded background using primary accent color
- White arrow icon for contrast
- Creates clear "tap target" visual

### Bottom Border

- 2-3px solid border in same accent color as arrow
- Present in both study and replay phases (consistent)
- Removed when header is expanded

## Implementation

Changes isolated to `CollapsibleHeader.jsx` and `CollapsibleHeader.module.css`:

### CSS Changes

```css
.arrow {
  /* Larger, accented arrow */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  background-color: var(--primary-color); /* or specific accent */
  color: white;
  border-radius: 50%;
}

.headerBar {
  /* Add bottom border */
  border-bottom: 2px solid var(--primary-color);
}

.headerBar[aria-expanded="true"] {
  /* Remove border when expanded */
  border-bottom: none;
}
```

### No JSX Changes Required

Existing structure already has arrow in `<span className={styles.arrow}>`.
