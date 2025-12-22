---
title: UI Component Inventory
status: Draft
updated: 2025-12-21
owner: "@frontend"
---

# Current UI Building Blocks

Source directory: `src/frontend/src/components/ui`

| Component | File | Notes |
|-----------|------|-------|
| `Alert` | `alert.tsx` | Basic status surface, no Radix primitives. |
| `Button` | `button.tsx` | Uses `@radix-ui/react-slot` + CVA; variants aligned with M3 tokens. |
| `Card` | `card.tsx` | Lightweight wrapper for content groupings. |
| `Input` | `input.tsx` | Standard text input styling. |
| `Label` | `label.tsx` | Tailwind label helper. |

The current UI layer only covers simple controls. We rely on native elements elsewhere (e.g., `<select>` inside `src/frontend/src/app/dashboard/components/ShopSelector.tsx:63`), and bespoke logic would be required for overlays or interactive elements.

# Radix Adoption Targets

The following high-value components are missing and should be implemented using Radix Primitives to secure accessibility + keyboard support:

1. **Dialog / Drawer**
   - Needed for review details, AI suggestions, confirmation flows.
   - Currently no modal implementation exists (`rg -n "Dialog" src/frontend/src` returns empty).

2. **Popover / Dropdown**
   - For quick action menus and filter chips in dashboard cards.
   - No shared popover; rely on custom tooltip-like divs.

3. **Select / Combobox**
   - `ShopSelector` and upcoming filters still use native `<select>` (`ShopSelector.tsx:63`), limiting customization.

4. **Tabs**
   - Content Studio spec references tabbed flows; no shared tab component yet.

5. **Toast / Sonner bridge**
   - Worker/domain events need consistent toasts per spec §2.

6. **Tooltip**
   - Trend charts and status badges require accessible tooltips.

Each item above maps directly to a Radix primitive (`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-tooltip`). Implement wrappers under `src/components/ui/` to keep styling centralized while exposing headless flexibility.

# Next Steps

1. Create Radix-based wrappers (priority: Dialog, Popover, Select).
2. Replace existing native implementations starting with `ShopSelector`.
3. Add Storybook/Vitest coverage to lock keyboard interactions.
