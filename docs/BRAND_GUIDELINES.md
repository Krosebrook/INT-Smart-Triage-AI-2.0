# FlashFusion Brand Guidelines

## Brand Identity

### Who We Are

FlashFusion is an AI-powered workflow orchestration platform built for creators. We empower creative professionals to automate complex workflows, streamline collaboration, and focus on what they do best: creating.

### Brand Personality

- **Premium but Approachable**: High-end aesthetic without intimidation
- **Creator-Focused**: Tools designed by creators, for creators
- **Innovative**: Cutting-edge AI technology with intuitive interfaces
- **Energetic**: Dynamic, vibrant, and forward-moving
- **Trustworthy**: Reliable automation for critical creative workflows

### Voice & Tone

- Clear and confident, never condescending
- Enthusiastic without being overly casual
- Technical when necessary, accessible always
- Empowering and supportive

## Color System

### Primary Colors

#### Purple Glow (#a855f7)

The signature color of FlashFusion. Represents innovation, creativity, and premium quality.

**Usage Guidelines:**

- Primary CTAs and interactive elements
- Brand headers and hero sections
- Key navigation highlights
- Focus states and active elements
- Never use below 500 for text on light backgrounds

**Approved Uses:**

- Buttons (primary actions)
- Links (hover and active states)
- Icons (primary importance)
- Progress indicators
- Glow effects and shadows

**Scale:**

```
50:  #faf5ff (Lightest backgrounds)
100: #f3e8ff (Light backgrounds, hover states)
200: #e9d5ff (Subtle borders, disabled states)
300: #d8b4fe (Decorative elements)
400: #c084fc (Large text only)
500: #a855f7 (Primary brand color — minimum for body text)
600: #9333ea (Preferred for text on light backgrounds)
700: #7e22ce (Dark text, high contrast)
800: #6b21a8 (Very dark text)
900: #581c87 (Darkest, maximum contrast)
```

#### Rose Glow (#f472b6)

The secondary accent. Adds warmth, energy, and creative flair.

**Usage Guidelines:**

- Secondary CTAs
- Accent highlights
- Gradient partners with purple
- Creative feature callouts
- Never use below 600 for text on light backgrounds

**Approved Uses:**

- Buttons (secondary actions)
- Badges and tags
- Accent borders
- Gradient overlays
- Alert highlights

**Scale:**

```
50:  #fff1f2 (Lightest backgrounds)
100: #ffe4e6 (Light backgrounds)
200: #fecdd3 (Subtle accents)
300: #fda4af (Decorative elements)
400: #fb7185 (Large text with caution)
500: #f472b6 (Secondary brand color)
600: #ec4899 (Minimum for body text)
700: #db2777 (Preferred for text)
800: #be185d (Dark text)
900: #9f1239 (Darkest)
```

### Semantic Colors

#### Success (Green)

- **Primary:** #22c55e (500)
- **Use for:** Confirmations, successful operations, positive feedback
- **Minimum for text:** 600 (#16a34a)

#### Warning (Amber)

- **Primary:** #f59e0b (500)
- **Use for:** Warnings, cautionary messages, pending states
- **Minimum for text:** 600 (#d97706)

#### Error (Red)

- **Primary:** #ef4444 (500)
- **Use for:** Errors, destructive actions, critical alerts
- **Minimum for text:** 600 (#dc2626)

#### Info (Blue)

- **Primary:** #3b82f6 (500)
- **Use for:** Informational messages, tips, neutral notifications
- **Minimum for text:** 600 (#2563eb)

### Neutral Colors

#### Grayscale

Used for text, borders, backgrounds, and UI chrome.

**Light Mode:**

- **Text Primary:** Neutral 900 (#171717)
- **Text Secondary:** Neutral 700 (#404040)
- **Text Muted:** Neutral 500 (#737373)
- **Borders:** Neutral 200 (#e5e5e5)
- **Backgrounds:** Neutral 50 (#fafafa) to Neutral 100 (#f5f5f5)

**Dark Mode:**

- **Text Primary:** #f3e8ff (Light purple tint)
- **Text Secondary:** Neutral 300 (#d4d4d4)
- **Text Muted:** Neutral 400 (#a3a3a3)
- **Borders:** Transparent with purple tint
- **Backgrounds:** #0f0618 (Dark purple) to #2d1b4e (Surface)

### Special Effects

#### Glass Morphism

Signature style for cards, modals, and overlays in dark mode.

**Properties:**

- Background: `rgba(255, 255, 255, 0.1)`
- Backdrop Blur: `12px`
- Border: `1px solid rgba(255, 255, 255, 0.2)`

**Usage:**

- Dashboard cards
- Modal dialogs
- Floating panels
- Navigation overlays

**Constraints:**

- Only use in dark mode or over dark backgrounds
- Ensure text contrast meets WCAG AA standards
- Provide solid fallback for browsers without backdrop-filter support

#### Glow Effects

Neon-style glows for premium feel and visual hierarchy.

**Primary Glow:**

- Shadow: `0 0 20px rgba(168, 85, 247, 0.4)`
- Use on: Primary buttons, important cards, hero elements

**Secondary Glow:**

- Shadow: `0 0 20px rgba(244, 114, 182, 0.4)`
- Use on: Secondary actions, accent features

**Text Glow:**

- Shadow: `0 0 20px rgba(168, 85, 247, 0.5)`
- Use sparingly: Hero headings, brand moments

## Typography

### Font Families

#### Headings — Poppins

Geometric sans-serif with a modern, friendly personality.

**Weights Available:**

- Light (300): Large display text
- Regular (400): Subheadings, labels
- SemiBold (600): Primary headings
- Bold (700): Hero text, emphasis

**Usage:**

- All headings (H1-H6)
- Navigation items
- Button labels
- CTAs and callouts
- Form labels

#### Body — Inter

Highly readable, neutral sans-serif optimized for screens.

**Weights Available:**

- Light (300): Supporting text, captions
- Regular (400): Body text, paragraphs, descriptions

**Usage:**

- All body text
- Form inputs
- Table content
- Tooltips and hints
- Long-form content

### Type Scale

```
Display (Hero):   48px / 3rem   - Poppins Bold (700)
H1:               36px / 2.25rem - Poppins SemiBold (600)
H2:               30px / 1.875rem - Poppins SemiBold (600)
H3:               24px / 1.5rem  - Poppins SemiBold (600)
H4:               20px / 1.25rem - Poppins Regular (400)
H5:               18px / 1.125rem - Poppins Regular (400)
H6:               16px / 1rem    - Poppins Regular (400)
Body Large:       18px / 1.125rem - Inter Regular (400)
Body:             16px / 1rem    - Inter Regular (400)
Body Small:       14px / 0.875rem - Inter Regular (400)
Caption:          12px / 0.75rem - Inter Light (300)
```

### Line Height

- **Headings:** 1.2 to 1.3
- **Body Text:** 1.5 to 1.6
- **Captions:** 1.4

### Letter Spacing

- **Display Text:** -0.02em (tighter)
- **Headings:** -0.01em (slightly tighter)
- **Body Text:** 0 (default)
- **All Caps:** 0.05em (looser)

## Design Principles

### 1. Dark-First Design

Design for dark mode first, then adapt to light mode. Dark backgrounds showcase our neon aesthetic and reduce eye strain for creators working long hours.

### 2. High Contrast

Maintain strong contrast for accessibility and visual clarity. Avoid muddy mid-tones; prefer bold, distinct separations.

### 3. Purposeful Glow

Use glow effects intentionally to guide attention and create hierarchy. Not every element needs to glow—reserve it for important moments.

### 4. Glass with Substance

Glass morphism should enhance, not obscure. Always ensure content remains legible and actionable through glass overlays.

### 5. Consistent Spacing

Use the 8px grid system. All spacing, sizing, and positioning should be multiples of 8 (8, 16, 24, 32, 40, 48, 64, 80, 96).

### 6. Motion with Purpose

Animations should feel smooth and purposeful, never gratuitous. Use motion to guide users, provide feedback, and delight—not to distract.

## Component Rules

### Buttons

#### Primary Button

- **Background:** Primary 500 (#a855f7)
- **Text:** White or Primary 50
- **Hover:** Primary 600 with glow
- **Active:** Primary 700
- **Disabled:** Neutral 300 background, Neutral 500 text
- **Shadow:** Primary glow on hover
- **Use for:** Main CTAs, form submissions, critical actions

#### Secondary Button

- **Background:** Secondary 500 (#f472b6)
- **Text:** White or Secondary 50
- **Hover:** Secondary 600 with glow
- **Active:** Secondary 700
- **Disabled:** Neutral 300 background, Neutral 500 text
- **Shadow:** Secondary glow on hover
- **Use for:** Secondary actions, alternative paths

#### Outline Button

- **Background:** Transparent
- **Border:** Primary 500
- **Text:** Primary 600
- **Hover:** Primary 100 background
- **Active:** Primary 200 background
- **Use for:** Tertiary actions, cancel options

#### Ghost Button

- **Background:** Transparent
- **Text:** Primary 600
- **Hover:** Primary 100 background
- **Active:** Primary 200 background
- **Use for:** Low-priority actions, navigation

### Forms

#### Input Fields

- **Light Mode:** White background, Neutral 200 border
- **Dark Mode:** Dark surface background (#1a0b2e), border with purple tint
- **Focus:** Primary 500 border with ring
- **Error:** Error 600 border, Error 100 background (light mode)
- **Placeholder:** Neutral 500 (light), Neutral 400 (dark)

#### Field Labels

- **Font:** Poppins Regular (400)
- **Size:** 14px
- **Color:** Neutral 900 (light), Neutral 200 (dark)
- **Position:** Above input, 8px margin

### Cards

#### Standard Card

- **Light Mode:** White background, Neutral 200 border
- **Dark Mode:** Dark surface (#1a0b2e), subtle border
- **Shadow:** Subtle elevation shadow
- **Padding:** 24px (desktop), 16px (mobile)
- **Radius:** 8px

#### Glass Card (Dark Mode Only)

- **Background:** Glass effect
- **Border:** Transparent white border
- **Shadow:** Primary glow
- **Backdrop Blur:** 12px
- **Use for:** Feature highlights, dashboard widgets

### Navigation

#### Top Navigation

- **Background:** Solid color (avoid transparency over dynamic content)
- **Height:** 64px
- **Logo:** Left-aligned
- **Links:** Poppins Regular, 16px
- **Active State:** Primary 500 underline or background

#### Side Navigation

- **Width:** 240px
- **Background:** Dark surface or white
- **Item Height:** 40px
- **Active:** Primary 500 accent border or background
- **Icons:** 20px, vertically centered

### Badges

#### Style

- **Font:** Poppins Regular (400), 12px, uppercase
- **Padding:** 4px 12px
- **Radius:** 12px (pill shape)
- **Use:** Status indicators, categories, counts

#### Color Mapping

- **Primary:** Purple background, white text
- **Secondary:** Rose background, white text
- **Success:** Green background, white text
- **Warning:** Amber background, dark text
- **Error:** Red background, white text
- **Neutral:** Neutral 200 background, dark text

## Accessibility Rules

### Contrast Requirements

#### Body Text (16px or smaller)

- **Minimum:** 4.5:1 contrast ratio
- **Use:** Primary 600+, Secondary 700+, Semantic 600+
- **Avoid:** Any lighter shades

#### Large Text (18px+ bold or 24px+ regular)

- **Minimum:** 3:1 contrast ratio
- **Use:** Primary 500+, Secondary 600+
- **Test:** Always verify in context

#### Interactive Elements

- **Minimum:** 3:1 contrast against adjacent colors
- **Focus States:** Must be clearly visible
- **Hover States:** Must maintain minimum contrast

### Focus Indicators

- **Visible:** Always provide clear focus indicators
- **Color:** Primary 500 ring or outline
- **Width:** 2px minimum
- **Offset:** 2px from element

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must be logical
- Focus indicators must be visible at all times

### Screen Readers

- All images must have alt text
- All icons must have labels or aria-labels
- Form fields must have associated labels
- Status messages must use live regions

## Do's and Don'ts

### Color

#### Do:

- ✓ Use Primary 500+ for text on light backgrounds
- ✓ Use gradients for large backgrounds and hero sections
- ✓ Combine purple and rose in gradients
- ✓ Use glass effects in dark mode
- ✓ Maintain consistent glow opacity and blur radius
- ✓ Test all color combinations for contrast

#### Don't:

- ✗ Use Primary 400 or lighter for body text on light backgrounds
- ✗ Use Secondary 500 or lighter for body text on light backgrounds
- ✗ Mix more than three colors in a single component
- ✗ Use glass effects in light mode
- ✗ Apply glow to every interactive element
- ✗ Use pure white (#ffffff) text on colored backgrounds without testing

### Typography

#### Do:

- ✓ Use Poppins for all headings
- ✓ Use Inter for all body text
- ✓ Maintain consistent line height
- ✓ Use appropriate font weights for hierarchy
- ✓ Left-align body text for readability
- ✓ Limit line length to 60-80 characters

#### Don't:

- ✗ Mix more than two font families
- ✗ Use font sizes smaller than 12px
- ✗ Use all caps for body text
- ✗ Use italic for large blocks of text
- ✗ Justify text (creates uneven spacing)
- ✗ Use font weights not specified in the design system

### Layout

#### Do:

- ✓ Use 8px grid system for spacing
- ✓ Maintain consistent padding and margins
- ✓ Use whitespace generously
- ✓ Group related elements
- ✓ Create clear visual hierarchy
- ✓ Design mobile-first

#### Don't:

- ✗ Use arbitrary spacing values
- ✗ Cram too many elements in one view
- ✗ Ignore responsive breakpoints
- ✗ Create overly complex layouts
- ✗ Neglect touch target sizes (minimum 44x44px)
- ✗ Use more than 3 levels of visual hierarchy per section

### Components

#### Do:

- ✓ Use established component patterns
- ✓ Maintain consistent component sizing
- ✓ Provide clear hover and active states
- ✓ Disable buttons during processing
- ✓ Provide loading indicators
- ✓ Show validation errors clearly

#### Don't:

- ✗ Create custom components for standard patterns
- ✗ Use inconsistent button styles
- ✗ Omit disabled states
- ✗ Hide important actions
- ✗ Use ambiguous labels
- ✗ Rely solely on color to convey information

## Implementation Guidelines

### CSS Variables

Use CSS custom properties for all colors, spacing, and breakpoints. Reference the design system values defined in `src/index.css`.

### Tailwind Usage

Leverage Tailwind utility classes for rapid development. Custom components should extend Tailwind's configuration in `tailwind.config.js`.

### Component Library

All components must be built following the specifications in `design-system/component-colors.json`. Maintain consistency across all platforms.

### Design Tokens

Import design tokens from `design-tokens.json` for Figma, Storybook, or other design tools. This ensures consistency between design and development.

### Testing

- Test all color combinations with accessibility tools
- Verify contrast ratios before deploying
- Test on multiple devices and browsers
- Validate with real users, especially those with visual impairments

## Version History

**Version 1.0.0** — January 2026

- Initial FlashFusion brand design system
- Dark-first color palette
- Typography system
- Component specifications
- Accessibility guidelines
- Complete design token library

## Contact

For questions about brand usage or design system updates, contact the FlashFusion Design Team.

---

**FlashFusion** — Where Creativity Meets Automation
