Review UI/UX implementation for accessibility, performance, and design consistency.

## Process

1. **Identify UI Files**
   - React/React Native components
   - Style files (CSS, Tailwind, styled-components)
   - Navigation/routing
   - State management for UI

2. **Accessibility (A11y) Audit**
   - [ ] Semantic HTML elements used correctly
   - [ ] ARIA labels on interactive elements
   - [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
   - [ ] Touch targets >= 44x44px (mobile)
   - [ ] Focus states visible and logical
   - [ ] Screen reader compatible
   - [ ] Keyboard navigation works
   - [ ] No information conveyed by color alone

3. **Performance**
   - [ ] Images optimized (WebP, lazy loading)
   - [ ] No unnecessary re-renders (memo, useMemo, useCallback)
   - [ ] Bundle size reasonable
   - [ ] Animations use transform/opacity (not layout properties)
   - [ ] Lists virtualized for large datasets
   - [ ] No blocking operations in render

4. **Design Consistency**
   - [ ] Design tokens/theme used (not hardcoded values)
   - [ ] Spacing follows 4px/8px grid
   - [ ] Typography scale consistent
   - [ ] Component variants follow design system
   - [ ] Dark/light mode supported if applicable
   - [ ] Responsive breakpoints consistent

5. **UX Patterns**
   - [ ] Loading states for async operations
   - [ ] Error states with recovery actions
   - [ ] Empty states with guidance
   - [ ] Confirmation for destructive actions
   - [ ] Feedback for user actions (toast, haptic)
   - [ ] Offline state handling

6. **Report**
   For each issue:
   - Severity: CRITICAL | HIGH | MEDIUM | LOW
   - Component/file location
   - Description with screenshot reference if visual
   - Suggested fix with code example

$ARGUMENTS
