# Tailwind CSS Migration Implementation Plan

## Phase 1: Foundation

### 1.1 Install Dependencies
```bash
npm install -D tailwindcss postcss autoprefixer
```

### 1.2 Create `tailwind.config.js`
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2196f3',
        success: '#4caf50',
        error: '#f44336',
        neutral: '#9e9e9e',
        stone: {
          black: '#1a1a1a',
          white: '#f5f5f5',
        }
      }
    }
  },
  plugins: []
}
```

### 1.3 Create `postcss.config.js`
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### 1.4 Update `src/index.css`
Add Tailwind directives at the top:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 1.5 Verify Build
```bash
npm run build
npm run dev
```

---

## Phase 2: Layout Shell

### 2.1 Migrate `GameLayout.jsx`
- Replace CSS module imports with Tailwind classes
- Use responsive classes: `flex flex-col lg:flex-row`
- Desktop: `lg:w-[20%]` for sidebars, `lg:w-[60%]` for board
- Add transitions: `transition-all duration-300`

### 2.2 Simplify `useBoardSize.js`
- Remove `isMobileLayout` state
- Remove `minDesktopWidth` calculation
- Keep only `vertexSize` calculation with `ResizeObserver`
- Return `{ vertexSize, containerRef }`

### 2.3 Migrate `Layout.jsx`
- Replace flex container styles with Tailwind
- `min-h-screen flex flex-col`

### 2.4 Migrate `Header.jsx`
- Navigation bar styling with Tailwind
- Responsive visibility: `hidden md:flex`

### 2.5 Migrate `Footer.jsx`
- Simple footer styling with Tailwind

### 2.6 Delete CSS Modules
- `src/styles/GameLayout.module.css`
- `src/styles/Layout.module.css`
- `src/styles/Header.module.css`
- `src/styles/Footer.module.css`

---

## Phase 3: Sidebar & Panels

### 3.1 Migrate `Sidebar.jsx`
- Desktop: visible as 20% width panel
- Tablet: slide-out drawer with hamburger toggle
- Mobile: hidden (content in BottomSheet)
- Classes: `hidden lg:block lg:w-[20%]` + drawer overlay for `md`

### 3.2 Create `BottomSheet.jsx`
New component consolidating mobile panels:
- Fixed bottom position with slide-up animation
- Contains: game info, move list, settings
- Drag handle for swipe gestures
- Classes: `fixed bottom-0 inset-x-0 md:hidden`

### 3.3 Migrate `BottomBar.jsx`
- Mobile-only fixed bottom controls
- Prev/next move buttons
- Classes: `fixed bottom-0 inset-x-0 md:hidden`

### 3.4 Delete Deprecated Components
- `src/components/RightPanel.jsx`
- `src/components/CollapsibleHeader.jsx`
- `src/components/CollapsibleBottomPanel.jsx`

### 3.5 Delete CSS Modules
- `src/styles/Sidebar.module.css`
- `src/styles/RightPanel.module.css`
- `src/styles/CollapsibleHeader.module.css`
- `src/styles/CollapsibleBottomPanel.module.css`
- `src/styles/BottomBar.module.css`

---

## Phase 4: UI Components

### 4.1 Core Components
- `Board.jsx` - board container and wrapper styling
- Buttons - replace `Buttons.module.css` with utility classes
- `ProgressBar.jsx` - progress indicator
- `RangeSlider.jsx` - range input styling

### 4.2 Phase Components
- `UploadPhase.jsx` - file upload UI
- `ReplayPhase.jsx` - replay phase controls

### 4.3 Supporting Components
- `GameInfo.jsx` - game information display
- `AnnotationToolbar.jsx` - board annotations

### 4.4 Remaining Components
- `HomePage.jsx`
- `UnderConstruction.jsx`

### 4.5 Delete CSS Modules
- `src/styles/Board.module.css`
- `src/styles/Buttons.module.css`
- `src/styles/ProgressBar.module.css`
- `src/styles/RangeSlider.module.css`
- `src/styles/UploadPhase.module.css`
- `src/styles/ReplayPhase.module.css`
- `src/styles/GameInfo.module.css`
- `src/styles/AnnotationToolbar.module.css`
- `src/styles/HomePage.module.css`
- `src/styles/UnderConstruction.module.css`
- `src/styles/App.module.css`

---

## Phase 5: Cleanup & Testing

### 5.1 Remove Styles Directory
```bash
rm -rf src/styles/
```

### 5.2 Update Tests
- Check component tests still pass
- Update any style-related test assertions

### 5.3 Responsive Testing
Test at breakpoints:
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px, 1920px

### 5.4 Final Review
- Verify all transitions are smooth
- Check board sizing works correctly
- Confirm no layout breaks at any size

---

## Files Summary

### To Create
- `tailwind.config.js`
- `postcss.config.js`
- `src/components/BottomSheet.jsx`

### To Modify
- `package.json`
- `src/index.css`
- `src/hooks/useBoardSize.js`
- `src/components/GameLayout.jsx`
- `src/components/Layout.jsx`
- `src/components/Header.jsx`
- `src/components/Footer.jsx`
- `src/components/Sidebar.jsx`
- `src/components/BottomBar.jsx`
- `src/components/Board.jsx`
- `src/components/UploadPhase.jsx`
- `src/components/ReplayPhase.jsx`
- `src/components/GameInfo.jsx`
- `src/components/AnnotationToolbar.jsx`
- `src/components/ProgressBar.jsx`
- `src/components/RangeSlider.jsx`
- `src/components/HomePage.jsx`
- `src/components/UnderConstruction.jsx`

### To Delete
- `src/components/RightPanel.jsx`
- `src/components/CollapsibleHeader.jsx`
- `src/components/CollapsibleBottomPanel.jsx`
- All 20 files in `src/styles/`
