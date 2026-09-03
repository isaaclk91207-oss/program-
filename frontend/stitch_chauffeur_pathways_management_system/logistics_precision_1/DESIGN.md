---
name: PCCP Professional
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
  on-surface-variant: '#41474f'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#717880'
  outline-variant: '#c0c7d1'
  surface-tint: '#236391'
  primary: '#00385a'
  on-primary: '#ffffff'
  primary-container: '#00507d'
  on-primary-container: '#8ac2f5'
  inverse-primary: '#95ccff'
  secondary: '#006a63'
  on-secondary: '#ffffff'
  secondary-container: '#9deee5'
  on-secondary-container: '#0c6f67'
  tertiary: '#552b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#753e03'
  on-tertiary-container: '#faac6b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#95ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004a75'
  secondary-fixed: '#a0f1e8'
  secondary-fixed-dim: '#84d5cc'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fc'
  role-driver: '#22c55e'
  role-passenger: '#3b82f6'
  role-admin: '#8b5cf6'
  surface-canvas: '#F8FAFC'
  border-hairline: '#E2E8F0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
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
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The brand identity is rooted in **Corporate Modernism** with a focus on trust, precision, and role-based clarity. It targets a professional ecosystem of drivers, passengers, and administrators, requiring a UI that feels both authoritative and accessible. 

The aesthetic leverages a "clean-tech" approach: a clinical white and light-gray foundation punctuated by high-fidelity role-specific accents. The use of ambient radial gradients in the background provides a subtle sense of depth and modernity without distracting from functional tasks. The emotional response should be one of efficiency, reliability, and structured hierarchy.

## Colors
The palette is dominated by a neutral, high-lightness surface (`#F8FAFC`) to maintain professional focus. 

- **Primary & Secondary:** Deep, professional blues and teals used for branding and global actions.
- **Role Colors:** The system employs a functional color strategy where Emerald Green (`#22c55e`) signifies the Driver, Royal Blue (`#3b82f6`) signifies the Passenger, and Soft Violet (`#8b5cf6`) signifies the Admin. 
- **Interactive States:** Active roles utilize their specific role-color for borders and glows, while inactive states are suppressed using a 50% opacity grayscale filter.
- **Backgrounds:** Light "Ambient Background Effects" use 20-30% opacity tints of primary and surface colors to break the monotony of the white canvas.

## Typography
The system uses a dual-font strategy. **Plus Jakarta Sans** is the display face, used for all headlines, titles, and uppercase labels to provide a welcoming yet modern character. **Inter** serves as the utilitarian body face, optimized for maximum legibility in forms and dense information blocks.

Key typographic rules:
- **Headlines:** Use heavy weights (700-800) and negative letter spacing to create a compact, premium feel.
- **Body Text:** Standardizes on a 15px base for comfortable reading of technical details.
- **Hierarchy:** High contrast between `title-lg` (semi-bold) and `body-sm` (regular) helps differentiate labels from descriptive content.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a max-width container of 1000px for desktop environments. 

- **Grid:** On desktop, a 3-column grid is used for primary selection cards, collapsing to a single column on mobile. 
- **Rhythm:** An 8px-based spacing system (sm/base/xl) ensures vertical rhythm. Login forms and cards use generous internal padding (32px / 2xl) to create a premium, spacious feel.
- **Responsive Behavior:** Transitions from a centered, vertical stack on mobile to a multi-column role selection with a centered form-card on desktop. Margins double from 16px to 32px as the viewport expands.

## Elevation & Depth
Elevation is communicated through a mix of **Tonal Layers** and **Ambient Shadows**.

- **Surfaces:** The main canvas is `surface-canvas` (#F8FAFC), with primary interaction cards resting on a pure white (#FFFFFF) background.
- **Shadows:** A very soft `shadow-sm` is used for the main login card. Active role selection cards utilize a **Color-Tinted Glow** (4px spread with 20% opacity of the specific role color) to indicate focus.
- **Interactions:** Hover states on cards trigger a slight lift (-2px Y-translation) and a deeper, diffused shadow (`0 4px 12px rgba(15, 23, 42, 0.1)`), providing tactile feedback without skeuomorphism.

## Shapes
The shape language is consistently **Rounded**, leaning into a modern, friendly geometry.

- **Main Cards & Buttons:** Use `rounded-xl` (0.75rem or 12px) to soften the professional interface.
- **Inputs & Smaller UI Elements:** Standardize on `rounded-lg` (0.5rem or 8px) for a more precise, structural look.
- **Checkboxes:** Follow a tighter `rounded` (0.25rem or 4px) radius.
- **Visual Accents:** Decorative background elements and icon containers may use full `rounded-full` or large-scale circular blurs.

## Components
- **Buttons:** Primary buttons are large (12px vertical padding) with bold `title-md` typography. They should dynamically inherit the "Role Color" as their background (e.g., green for driver).
- **Role Cards:** Large, interactive buttons featuring a top-right decorative radial element, a role-specific icon in a 10% opacity tinted container, and a 1px `border-hairline`. Active cards receive a 1px solid role-color border and an outer glow.
- **Input Fields:** Styled with `surface-canvas` backgrounds and `outline-variant` borders. On focus, the background shifts to white and a 1px ring appears in the role-specific color. Icons are placed as 20px glyphs in the left-hand prefix position.
- **Checkboxes:** Small (16px), utilizing the primary blue for the checked state, paired with `body-sm` labels in `on-surface-variant`.
- **Form Card:** A distinct container with a 4px thick "Accent Line" at the top that changes color based on the selected user role, providing immediate context for the sign-in process.