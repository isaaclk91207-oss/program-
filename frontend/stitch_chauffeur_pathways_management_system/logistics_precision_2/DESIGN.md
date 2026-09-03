---
name: Logistics Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e1e7ff'
  surface-container-highest: '#dae2fc'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#386286'
  on-secondary: '#ffffff'
  secondary-container: '#add6ff'
  on-secondary-container: '#335d81'
  tertiary: '#0058be'
  on-tertiary: '#ffffff'
  tertiary-container: '#2170e4'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#cee5ff'
  secondary-fixed-dim: '#a1cbf4'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#1c4a6d'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fc'
  status-active: '#059669'
  status-maintenance: '#f59e0b'
  status-out-of-service: '#dc2626'
  surface-canvas: '#F8FAFC'
  border-hairline: '#E2E8F0'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: '0'
  body-base:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  table-row: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system for the Fleet Management module is rooted in **Corporate Modernism**, emphasizing reliability, institutional trust, and high-density information efficiency. The aesthetic is clinical and precise, utilizing a structured "clean-tech" approach that balances a utilitarian workspace with modern interactive refinements.

The system targets professional fleet managers and logistics coordinators who require immediate clarity and low cognitive load. The emotional response is one of **calculated control and professional authority**. Visuals are characterized by high-contrast data visualization, institutional color coding, and a rigid hierarchical structure that ensures critical metrics (vehicle health, availability, and routing) are surfaced with absolute precision.

## Colors
The color strategy prioritizes functional signaling over decorative flair. 

- **Primary Action Color:** Institutional Green (`#059669`) is reserved for primary actions, success states, and "Active" status indicators, providing a consistent anchor for fleet movement.
- **Secondary & Tertiary:** Deep Navy and Royal Blue are used for navigation, structural framing, and administrative headers.
- **Status Indicators:** A semantic trio is used for vehicle health: Green (`#059669`) for Active, Amber (`#f59e0b`) for Maintenance, and Red (`#dc2626`) for Out of Service.
- **Neutral Palette:** The background utilizes a subtle cool-gray canvas (`#F8FAFC`) to reduce eye strain during long-duration monitoring, while text remains high-contrast (`#131b2e`) for legibility.

## Typography
The system employs a dual-font strategy optimized for data-heavy environments. **Plus Jakarta Sans** provides a modern, authoritative character for headers and UI labels, while **Inter** ensures maximum legibility for dense tables and technical logs.

- **Data Tables:** Use `body-sm` for standard cell content and `body-xs` (medium weight) for secondary metadata to maximize information density.
- **Headlines:** Keep letter spacing tight on larger sizes to maintain a compact, "instrument-panel" feel.
- **Caps:** Use `label-caps` for table headers and category tags to differentiate them from actionable text.

## Layout & Spacing
The layout follows a **Fluid Grid** model designed for high-density dashboards.

- **Dashboard Layout:** A 12-column grid system is used for the main dashboard, with a sidebar navigation fixed at 240px. 
- **Information Density:** Fleet metric cards and data tables utilize a "High-Density" rhythm. Table rows are constrained to 40px height to maximize the number of visible records.
- **Responsive Behavior:** 
  - **Desktop:** Multi-pane layouts with side-by-side metric cards and a primary data table.
  - **Tablet:** Metric cards reflow to a 2x2 grid; tables gain horizontal scroll.
  - **Mobile:** Single-column stack with simplified "Mini-Cards" for vehicle status.

## Elevation & Depth
Visual hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows, maintaining a clean, professional profile.

- **Base Layer:** The `surface-canvas` provides the foundation.
- **Interactive Surfaces:** Cards and table containers use a pure white background with a 1px `border-hairline`.
- **Elevation Levels:** 
  - **Level 0 (Flat):** Tables, inputs, and secondary buttons.
  - **Level 1 (Raised):** Metric cards and primary navigation panels, using a very soft, diffused shadow (4px blur, 4% opacity).
  - **Level 2 (Overlay):** Modals and dropdown menus use a 12px blur shadow with 10% opacity to clearly separate from the data grid.

## Shapes
The shape language is **Rounded**, providing a sophisticated balance between the rigidity of data and a modern user experience.

- **Professional Cards:** Use `rounded-lg` (16px) for major dashboard components to soften the layout.
- **Utility Elements:** Buttons, input fields, and table search bars use `rounded-md` (8px) for a more precise, structural feel.
- **Status Pills:** Use `rounded-full` for status indicators (Active/Maintenance) to create high-visibility "chips" that stand out against the rectilinear grid.

## Components
- **Data Tables:** Columns must be sortable with 16px padding. Status columns utilize status pills. The "Actions" column uses subtle ghost buttons that reveal on row-hover.
- **Fleet Metric Cards:** Large-format cards featuring a `title-md` label, a `headline-lg` value, and a small sparkline or trend indicator. Use a 4px colored accent border on the left side to denote category (e.g., green for availability).
- **Status Pills:** Compact indicators with a light background (10% opacity of the status color) and a bold, solid-colored dot or text.
- **Primary Action Buttons:** Solid `#059669` background with white text and `rounded-md` corners.
- **Input Fields:** Styled with a `border-hairline` and a 2px left-accent bar that illuminates in the primary green on focus.
- **Navigation Sidebar:** Dark-themed using `secondary-color` (#00385a) for the background to provide strong contrast against the white content area.