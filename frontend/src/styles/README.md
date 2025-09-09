# CSS Structure Documentation

This directory contains the organized CSS files for the pothole reporting application.

## File Structure

### `main.css`
The main entry point that imports all other CSS files in the correct order.

### `base.css`
Contains:
- CSS variables (colors, spacing, shadows, etc.)
- Base styles and resets
- Global animations and keyframes
- Accessibility features
- Focus states

### `components.css`
Contains reusable UI components:
- Button styles (primary, secondary, danger variants)
- Card components
- Form elements and validation
- Loading spinners and states
- Status badges
- Container utilities
- Pagination
- Empty states
- Toast notifications
- Progress bars

### `pages.css`
Contains page-specific styles:
- Upload page styles
- Gallery page styles
- MyReports page styles
- Profile page styles
- Pothole card styles
- Password requirements
- Anonymous reporting
- Bug/Feedback sections
- Form pages

### `responsive.css`
Contains:
- Mobile-first responsive design
- Optimized media queries
- Breakpoint-specific adjustments
- Print styles
- Accessibility considerations
- High DPI display support

## CSS Variables

The application uses CSS custom properties for consistent theming:

```css
:root {
  /* Colors */
  --color-primary: #f97316;
  --color-primary-hover: #ea580c;
  --color-secondary: #6b7280;
  --color-success: #059669;
  --color-error: #dc2626;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 0.15s ease-in-out;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

## Responsive Breakpoints

- **Mobile**: 0px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1279px
- **Large Desktop**: 1280px+

## Usage

To use these styles, import `main.css` in your component:

```jsx
import './styles/main.css';
```

## Benefits of This Structure

1. **Modularity**: Each file has a specific purpose
2. **Maintainability**: Easier to find and modify specific styles
3. **Performance**: CSS imports are optimized
4. **Scalability**: Easy to add new components or pages
5. **Consistency**: CSS variables ensure consistent theming
6. **Responsive**: Mobile-first approach with optimized media queries

## Migration Notes

The original `App.css` file has been backed up as `App.css.backup` in the `src` directory. All styles have been reorganized and optimized while maintaining the same visual appearance. 