---
name: XP Flow Technical Dashboard
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d4e4fa'
  on-surface: '#0d1c2d'
  on-surface-variant: '#45464d'
  inverse-surface: '#233143'
  inverse-on-surface: '#e9f1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0d1c2d'
  surface-variant: '#d4e4fa'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 12px
  margin-page: 24px
  padding-card: 16px
  stack-compact: 8px
---

## Brand & Style

The design system is engineered for high-utility, data-dense environments where clarity and speed of information processing are paramount. It targets technical stakeholders and product owners who require an immediate, high-fidelity overview of complex pipelines. 

The aesthetic is **Modern Corporate** with a heavy influence from **Minimalism** and **Technical Utilitarianism**. It prioritizes function over form, utilizing a strict grid and low-decoration philosophy to reduce cognitive load. The emotional response is one of control, precision, and reliability. 

Key stylistic principles:
- **High Information Density:** Minimal whitespace between functional groups; maximized screen real estate for data tables and charts.
- **Clear Borders:** Structural elements are defined by crisp, low-contrast borders rather than heavy shadows.
- **Functional Decoration:** Color and weight are used exclusively to convey status or hierarchy, never for purely aesthetic purposes.

## Colors

The palette is strictly functional. The neutral scale (Slates and Grays) forms the foundation of the UI to ensure that status indicators remain the most prominent visual elements.

- **Primary/Neutral:** Used for structural elements, navigation, and primary text. 
- **Success (Green):** Indicates healthy pipeline states, completed deployments, and stable environments.
- **Danger (Red):** Reserved for "Serve da Te" (Manual Actions) and critical failures requiring immediate intervention. This is the most visually aggressive color in the system.
- **Warning (Orange):** Denotes blocked states, escalations, or pending approvals.
- **Info (Blue):** General status, in-progress transitions, and non-critical metadata.

In **Dark Mode**, surfaces use a deep charcoal/slate base (`#0F172A`) to reduce eye strain during long-term monitoring, while **Light Mode** uses a clean, high-contrast white/gray background for maximum legibility in office environments.

## Typography

This design system utilizes a dual-font strategy to distinguish between descriptive content and technical data points.

- **Sans-Serif (Hanken Grotesk):** Used for all UI labels, navigation menus, and titles. It provides a modern, clean interface that feels professional and approachable.
- **Monospace (JetBrains Mono):** Used for all variable data, including timestamps, issue IDs, commit hashes, and numerical metrics. This ensures that characters align vertically in tables, making it easier to scan lists of technical data.

**Hierarchy Rules:**
- Keep font sizes small (13px-14px for body) to maintain high data density.
- Use uppercase Monospace for table headers and section labels to create a "technical blueprint" feel.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid grid**. Sidebars and inspector panels have fixed widths (240px and 320px respectively) while the main data area fluidly expands.

- **Base Unit:** A strict 4px grid governs all spacing.
- **Density:** Components use "Compact" spacing as the default. Vertical margins between table rows are minimized to 8px to ensure more data is visible above the fold.
- **Breakpoints:**
  - **Desktop (1440px+):** Full 12-column grid visibility.
  - **Tablet (1024px):** Sidebars collapse into icon-only rails.
  - **Mobile:** Not prioritized for this technical tool, but follows a single-column stack with 16px side margins.

## Elevation & Depth

To maintain a "flat" professional look, this design system avoids heavy drop shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Primary surface color.
- **Level 1 (Cards/Panels):** Defined by a 1px solid border (`#E2E8F0` in light, `#1E293B` in dark).
- **Level 2 (Popovers/Modals):** Subtle 4px blur shadow with 5% opacity to provide just enough separation from the underlying data.

In Dark Mode, elevation is communicated by slightly lightening the surface color of the container rather than adding a shadow.

## Shapes

The shape language is "Soft" yet disciplined. 

- **Components:** Buttons, inputs, and cards use a 4px (0.25rem) corner radius. This provides a slight modern touch without sacrificing the "serious" architectural feel of the dashboard.
- **Status Tags:** Use the same 4px radius for consistency. Avoid pill shapes unless used for user avatars.
- **Icons:** Use 20px bounding boxes with a 1.5px or 2px stroke weight to match the precision of the JetBrains Mono typeface.

## Components

### Buttons & Inputs
- **Primary Action:** Solid fill with white text.
- **Secondary/Technical:** Ghost style with 1px border.
- **Manual Action (Danger):** Strong red background, used sparingly for critical user intervention.
- **Inputs:** Squared-off corners (4px), 1px border, monospace text for data entry.

### Status Indicators (Chips)
Small, rectangular tags with a low-opacity background tint and a high-contrast label. 
- *Example:* Success chip has a 10% green background with 100% green text.

### Data Tables
The core component of the system.
- No vertical lines; only horizontal separators.
- Zebra striping is permitted for extremely wide datasets.
- Column headers use `label-caps` (Monospace).
- Interactive rows should have a subtle hover state (background color shift).

### Pipeline Cards
Used for overviewing specific flows.
- 1px border.
- Left-side accent bar (4px width) colored by current status (Success, Danger, etc.).
- Header area uses Sans-serif; data content uses Monospace.