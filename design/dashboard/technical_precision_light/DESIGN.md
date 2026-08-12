---
name: Technical Precision Light
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
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
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
---

## Brand & Style

This design system is engineered for high-density technical environments where clarity, data integrity, and operational speed are paramount. The aesthetic is rooted in **Modern Corporate** efficiency with a lean toward **Minimalism**, emphasizing functional utility over decorative flair.

The UI targets developers, system architects, and data analysts who require a "heads-up display" experience that remains comfortable during extended periods of focused work. By utilizing a high-key light mode palette, the design system ensures maximum legibility and a systematic, clinical feel that communicates reliability and professional rigor.

## Colors

The palette is anchored by a vibrant blue primary, optimized for interactive elements and critical paths against a near-white canvas.

- **Background Strategy:** Use `#f8f9fa` for the primary application background and `#ffffff` for elevated containers, cards, and data tables to create subtle logical grouping.
- **Typography & Icons:** All primary text uses `#0f172a` (Dark Slate) to ensure high contrast. Secondary information uses `#475569`.
- **Semantic Logic:** State colors are calibrated for light-mode visibility. Use these colors for status indicators, sparklines, and destructive actions.
- **Boundaries:** The `#e2e8f0` outline color is the primary tool for structural separation, replacing heavy shadows with clean, architectural lines.

## Typography

The typography system relies on **Hanken Grotesk** for its sharp, contemporary geometry and high legibility in dense layouts. It is supplemented by **JetBrains Mono** for technical metadata, code snippets, and system values to reinforce the developer-centric nature of the product.

- **Headlines:** Use tight letter-spacing and bold weights to establish clear hierarchy.
- **Body:** Aim for optimized line heights (1.4x-1.5x) to maintain readability in long-form logs or documentation.
- **Labels:** Monospaced labels should be used for status badges, IDs, timestamps, and metric units.

## Layout & Spacing

The design system utilizes a **4px baseline grid** to ensure mathematical precision in element alignment.

- **Grid System:** A 12-column fluid grid is the standard for desktop views. For data-heavy dashboards, use a "sidebar + main" layout where the sidebar is fixed at 240px and the main content area grows fluidly.
- **Density:** This is a high-density system. Vertical spacing between related data rows should favor `sm` (8px), while distinct logical sections use `xl` (32px).
- **Responsive Behavior:** On mobile, the 12-column grid collapses to a 4-column layout with 16px margins. Headlines scale down by approximately 20% to accommodate smaller viewports.

## Elevation & Depth

To maintain a clean, technical aesthetic, this design system avoids heavy drop shadows. Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Surface):** `#f8f9fa` used for the main application background.
- **Level 1 (Surface-Container):** `#ffffff` for cards, modals, and navigation panels. Elements at this level must have a 1px border using the `outline` color (`#e2e8f0`).
- **Level 2 (Interaction):** Active or hovering states may use an extremely soft, diffused shadow (`0 4px 12px rgba(15, 23, 42, 0.05)`) to indicate interactivity without breaking the flat, technical feel.
- **Focus States:** High-visibility 2px solid outlines in `primary` color for accessibility.

## Shapes

The shape language is **Soft** but disciplined, striking a balance between modern friendliness and professional structure.

- **Standard Elements:** Buttons, input fields, and tags use `rounded` (0.25rem).
- **Containers:** Large modules and cards use `rounded-lg` (0.5rem) to soften the overall interface.
- **Status Pills:** Small indicators may use `rounded-xl` (0.75rem) or fully rounded corners to differentiate them from functional buttons.

## Components

- **Buttons:** Primary buttons use a solid `#2563eb` fill with white text. Secondary buttons use a transparent background with an `#e2e8f0` border and `#475569` text.
- **Input Fields:** Use a white background with a 1px `#e2e8f0` border. On focus, the border transitions to `#2563eb` with a subtle glow. Labels should be small, all-caps `label-md`.
- **Data Tables:** Use alternating row stripes or 1px horizontal dividers. Header cells should have a subtle grey background (`#f1f5f9`) and use `label-md` for titles.
- **Chips/Badges:** Small, low-saturation backgrounds with high-saturation text (e.g., Success chip: `#dcfce7` background with `#16a34a` text).
- **Cards:** White background, 1px border, no shadow by default. Headers within cards should be separated by a 1px horizontal line.
- **Monospaced Data:** All timestamps, IP addresses, and UUIDs must use the `label-font` (JetBrains Mono) for character-perfect alignment.