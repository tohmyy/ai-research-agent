# UI Design Specification

## AI Content Research & Publishing Agent

**Version:** 1.0
**Status:** MVP Design Specification
**Purpose:** Source of truth for UI implementation

---

# 1. Purpose

This document defines the visual identity, layout, interaction patterns, component behavior, user experience, and implementation constraints for the AI Content Research & Publishing Agent.

The application is an internal content operations platform that takes a raw content idea or source URL and guides it through:

```text
Content Request
      ↓
Research
      ↓
Source Review
      ↓
Article Generation
      ↓
Article Selection
      ↓
Channel Adaptation
      ↓
Evaluation
      ↓
Human Review
      ↓
Approval
      ↓
Publishing / Scheduling
```

The UI must make this lifecycle clear at all times.

This document is intended to be consumed by an AI coding agent as the primary UI implementation reference.

---

# 2. Design Philosophy

## 2.1 Visual Direction

The application uses a **Modern SaaS** visual direction with an editorial/content-focused experience.

The interface should feel:

* Modern
* Spacious
* Premium
* Clean
* Professional
* Calm
* Content-focused
* Easy to scan
* Suitable for daily internal use

The interface should not feel like:

* A generic admin dashboard
* A dense enterprise system
* A developer console
* A social media clone
* An AI chatbot
* A marketing landing page

The application is a **content operations workspace**.

---

## 2.2 Core Design Principle

> **Content is the product. The interface should get out of the way and make the content lifecycle easy to understand.**

The UI should prioritize:

1. Content readability
2. Workflow clarity
3. Source transparency
4. Human control
5. Clear system state
6. Easy review
7. Clear publishing status

---

## 2.3 Design Personality

The visual identity should communicate:

* Intelligence without looking overly futuristic
* Automation without hiding system activity
* Professionalism without excessive corporate styling
* Simplicity without feeling empty
* Editorial quality without becoming a document editor everywhere

Avoid excessive:

* Gradients
* Glassmorphism
* Decorative illustrations
* Large shadows
* Rounded containers everywhere
* Neon colors
* AI-themed visual gimmicks
* Excessive animations

---

# 3. Theme

## 3.1 MVP Theme

The MVP uses **light mode only**.

Do not implement dark mode in the MVP.

Dark mode is a backlog item.

---

# 4. Visual Design Tokens

The MVP uses a light-only visual system built around:

* Warm-neutral application surfaces
* Deep slate text
* Indigo as the primary product color
* Teal/green for successful states
* Amber for warnings
* Red for errors
* Blue for informational states
* Minimal decorative color

The visual system should feel editorial and premium rather than overly corporate or brightly saturated.

---

## 4.1 Color Tokens

### Brand / Primary

The primary brand color is **Indigo**.

```css
--primary: 238 70% 56%;
--primary-foreground: 0 0% 100%;

--primary-hover: 238 70% 50%;
--primary-subtle: 238 70% 96%;
--primary-muted: 238 45% 91%;
```

Use primary for:

* Primary buttons
* Active navigation
* Selected tabs
* Important links
* Focus indicators
* Selected workflow steps
* Primary interactive controls

Do not use primary as a large page background.

---

## 4.2 Application Surfaces

Use warm, slightly off-white surfaces rather than pure white everywhere.

```css
--background: 220 20% 97%;
--foreground: 222 47% 11%;

--card: 0 0% 100%;
--card-foreground: 222 47% 11%;

--popover: 0 0% 100%;
--popover-foreground: 222 47% 11%;
```

### Recommended usage

```text
background
→ Main application canvas

card
→ Cards, panels, dialogs, elevated workspaces

popover
→ Dropdowns, menus, popovers
```

---

## 4.3 Neutral / Surface Hierarchy

```css
--muted: 220 14% 94%;
--muted-foreground: 220 9% 46%;

--secondary: 220 14% 94%;
--secondary-foreground: 222 47% 18%;

--accent: 220 14% 94%;
--accent-foreground: 222 47% 18%;
```

Use these for:

* Secondary buttons
* Metadata
* Supporting text
* Subtle backgrounds
* Hover states
* Non-primary controls

---

## 4.4 Borders and Inputs

```css
--border: 220 13% 88%;
--input: 220 13% 84%;
--ring: 238 70% 56%;
```

Borders should be subtle.

Default card border:

```text
border-border
```

Avoid dark borders except where needed for stronger separation.

Inputs should use the same border system as cards.

Focused inputs should use the primary ring.

---

# 4.5 Semantic Colors

Semantic colors communicate system state.

They must never be the only indication of state. Pair them with:

* Icon
* Text label
* Status badge

---

## Success

```css
--success: 158 64% 40%;
--success-foreground: 0 0% 100%;

--success-subtle: 158 64% 95%;
--success-border: 158 45% 82%;
```

Use for:

* Approved
* Published
* Completed research steps
* Successful publishing
* Successful saves

Example:

```text
✓ Published
```

---

## Warning

```css
--warning: 38 92% 50%;
--warning-foreground: 24 80% 12%;

--warning-subtle: 38 92% 95%;
--warning-border: 38 70% 80%;
```

Use for:

* Awaiting review
* Attention required
* Potentially incomplete content
* Expiring authorization warnings

Example:

```text
! Awaiting Review
```

---

## Error

```css
--destructive: 0 72% 51%;
--destructive-foreground: 0 0% 100%;

--error-subtle: 0 72% 96%;
--error-border: 0 55% 84%;
```

Use for:

* Failed publishing
* Failed research
* Validation errors
* Destructive actions

Example:

```text
! Publishing Failed
```

---

## Information

```css
--info: 211 86% 48%;
--info-foreground: 0 0% 100%;

--info-subtle: 211 86% 96%;
--info-border: 211 60% 84%;
```

Use for:

* Informational messages
* Research activity information
* System notices
* Non-error processing states

---

# 4.6 Status Token Mapping

Use the following status system consistently throughout the application.

| Status             | Icon                | Token       |
| ------------------ | ------------------- | ----------- |
| Draft              | `FileEdit`          | muted       |
| Researching        | `LoaderCircle`      | info        |
| Research Complete  | `CheckCircle2`      | success     |
| Generating         | `Sparkles`          | primary     |
| Awaiting Review    | `Clock3`            | warning     |
| Revision Requested | `MessageSquareEdit` | warning     |
| Approved           | `CheckCircle2`      | success     |
| Scheduled          | `CalendarClock`     | primary     |
| Publishing         | `LoaderCircle`      | info        |
| Published          | `CheckCircle2`      | success     |
| Failed             | `CircleAlert`       | destructive |
| Rejected           | `XCircle`           | destructive |

Icons and text labels must accompany semantic color.

---

# 4.7 Status Badge Styling

Default status badge:

```text
inline-flex
items-center
gap-1.5
rounded-full
px-2.5
py-1
text-xs
font-medium
```

Example semantic implementation:

```text
Approved
→ bg-success-subtle
→ text-success
→ border-success-border
```

Avoid highly saturated solid badges for normal workflow states.

---

# 4.8 Button Tokens

## Primary Button

Use for the main action on a page.

```text
bg-primary
text-primary-foreground
hover:bg-primary-hover
```

Examples:

```text
Start Research
Approve
Publish
Save Changes
```

---

## Secondary Button

Use for supporting actions.

```text
bg-secondary
text-secondary-foreground
hover:bg-muted
```

Examples:

```text
Preview
Save Draft
Cancel
```

---

## Outline Button

Use when a secondary action needs stronger visual separation.

```text
border-border
bg-background
text-foreground
hover:bg-muted
```

---

## Destructive Button

Use only for destructive actions.

```text
bg-destructive
text-destructive-foreground
```

Examples:

```text
Reject
Delete
Cancel Publication
```

---

## Ghost Button

Use for low-emphasis controls.

```text
bg-transparent
text-muted-foreground
hover:bg-muted
hover:text-foreground
```

Examples:

```text
View Details
Expand
Collapse
More
```

---

# 4.9 Link Styling

Default links:

```text
text-primary
underline-offset-4
hover:underline
```

Links should not be used excessively.

For navigation controls, prefer normal navigation styling rather than underlining everything.

---

# 4.10 Focus Styling

All keyboard-focusable controls must have a visible focus state.

Preferred:

```text
ring-2
ring-ring
ring-offset-2
```

The focus indicator must remain visible against both page and card surfaces.

---

# 4.11 Disabled Styling

Disabled controls should use:

```text
opacity-50
cursor-not-allowed
```

Do not rely only on reduced opacity to explain why an action is unavailable.

When appropriate, provide supporting text.

Example:

```text
Publishing unavailable

Content must be approved before it can be published.
```

---

# 4.12 AI-Specific Visual Treatment

AI functionality should use the existing primary/indigo system.

Do not create a separate "AI purple" or futuristic color system.

Use:

```text
primary
primary-subtle
info
```

for AI-related UI.

For example:

```text
AI-generated
AI Evaluation
AI Assistant
AI Revision
```

may use subtle primary styling.

AI should feel like part of the product, not a separate visual mode.

---

# 4.13 Surface Elevation

Use three primary surface levels:

### Level 0 — Application

```text
bg-background
```

### Level 1 — Content

```text
bg-card
border border-border
```

### Level 2 — Floating

Used for:

* Dialogs
* Dropdowns
* Popovers
* Menus

```text
bg-popover
border border-border
shadow-sm
```

Avoid creating more elevation levels unless required.

---

# 4.19 Tailwind Theme Mappings

The application uses Tailwind CSS with shadcn/ui.

The design tokens defined in this document must be exposed through Tailwind semantic utilities rather than requiring components to reference raw CSS variables directly.

The implementation should support classes such as:

```text
bg-background
text-foreground
bg-card
text-card-foreground
bg-primary
text-primary-foreground
bg-muted
text-muted-foreground
border-border
ring-ring
bg-success-subtle
text-success
border-success-border
bg-warning-subtle
text-warning
bg-info-subtle
text-info
bg-destructive
text-destructive-foreground
```

---

# 4.20 CSS Variable Foundation

Define the light theme in the application's global stylesheet.

```css
@layer base {
  :root {
    /* Core surfaces */
    --background: 220 20% 97%;
    --foreground: 222 47% 11%;

    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;

    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* Brand */
    --primary: 238 70% 56%;
    --primary-foreground: 0 0% 100%;

    --primary-hover: 238 70% 50%;
    --primary-subtle: 238 70% 96%;
    --primary-muted: 238 45% 91%;

    /* Secondary */
    --secondary: 220 14% 94%;
    --secondary-foreground: 222 47% 18%;

    /* Muted */
    --muted: 220 14% 94%;
    --muted-foreground: 220 9% 46%;

    /* Accent */
    --accent: 220 14% 94%;
    --accent-foreground: 222 47% 18%;

    /* Destructive */
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    /* Controls */
    --border: 220 13% 88%;
    --input: 220 13% 84%;
    --ring: 238 70% 56%;

    /* Semantic: success */
    --success: 158 64% 40%;
    --success-foreground: 0 0% 100%;
    --success-subtle: 158 64% 95%;
    --success-border: 158 45% 82%;

    /* Semantic: warning */
    --warning: 38 92% 50%;
    --warning-foreground: 24 80% 12%;
    --warning-subtle: 38 92% 95%;
    --warning-border: 38 70% 80%;

    /* Semantic: information */
    --info: 211 86% 48%;
    --info-foreground: 0 0% 100%;
    --info-subtle: 211 86% 96%;
    --info-border: 211 60% 84%;

    /* Semantic: error */
    --error-subtle: 0 72% 96%;
    --error-border: 0 55% 84%;

    /* Typography */
    --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;

    --font-serif: "Source Serif 4", Georgia, Cambria,
      "Times New Roman", serif;

    /* Radius */
    --radius: 0.625rem;
  }
}
```

---

# 4.21 Tailwind Theme Configuration

For a Tailwind configuration that supports the semantic design system, map CSS variables through `hsl()`.

Example `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          subtle: "hsl(var(--primary-subtle))",
          muted: "hsl(var(--primary-muted))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          subtle: "hsl(var(--success-subtle))",
          border: "hsl(var(--success-border))",
        },

        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          subtle: "hsl(var(--warning-subtle))",
          border: "hsl(var(--warning-border))",
        },

        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          subtle: "hsl(var(--info-subtle))",
          border: "hsl(var(--info-border))",
        },

        error: {
          subtle: "hsl(var(--error-subtle))",
          border: "hsl(var(--error-border))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },

      fontSize: {
        display: [
          "36px",
          {
            lineHeight: "44px",
            fontWeight: "600",
            letterSpacing: "-0.02em",
          },
        ],

        "page-title": [
          "28px",
          {
            lineHeight: "36px",
            fontWeight: "600",
            letterSpacing: "-0.02em",
          },
        ],

        "section-title": [
          "20px",
          {
            lineHeight: "28px",
            fontWeight: "600",
            letterSpacing: "-0.01em",
          },
        ],

        subsection: [
          "16px",
          {
            lineHeight: "24px",
            fontWeight: "600",
          },
        ],

        "body-lg": [
          "16px",
          {
            lineHeight: "26px",
            fontWeight: "400",
          },
        ],

        body: [
          "14px",
          {
            lineHeight: "22px",
            fontWeight: "400",
          },
        ],

        "body-medium": [
          "14px",
          {
            lineHeight: "22px",
            fontWeight: "500",
          },
        ],

        small: [
          "13px",
          {
            lineHeight: "20px",
            fontWeight: "400",
          },
        ],

        caption: [
          "12px",
          {
            lineHeight: "18px",
            fontWeight: "400",
          },
        ],

        overline: [
          "11px",
          {
            lineHeight: "16px",
            fontWeight: "600",
            letterSpacing: "0.08em",
          },
        ],
      },

      maxWidth: {
        article: "720px",
      },

      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
      },
    },
  },

  plugins: [],
};

export default config;
```

---

# 4.22 Tailwind Utility Mapping

The implementation agent should use the following semantic mapping.

| Design intent          | Tailwind utility                         |
| ---------------------- | ---------------------------------------- |
| Application background | `bg-background`                          |
| Main text              | `text-foreground`                        |
| Card                   | `bg-card`                                |
| Card text              | `text-card-foreground`                   |
| Primary action         | `bg-primary text-primary-foreground`     |
| Primary hover          | `hover:bg-primary-hover`                 |
| Primary subtle         | `bg-primary-subtle`                      |
| Secondary action       | `bg-secondary text-secondary-foreground` |
| Muted background       | `bg-muted`                               |
| Muted text             | `text-muted-foreground`                  |
| Border                 | `border-border`                          |
| Input border           | `border-input`                           |
| Focus ring             | `ring-ring`                              |
| Success                | `text-success`                           |
| Success background     | `bg-success-subtle`                      |
| Success border         | `border-success-border`                  |
| Warning                | `text-warning`                           |
| Warning background     | `bg-warning-subtle`                      |
| Warning border         | `border-warning-border`                  |
| Info                   | `text-info`                              |
| Info background        | `bg-info-subtle`                         |
| Info border            | `border-info-border`                     |
| Error                  | `text-destructive`                       |
| Error background       | `bg-error-subtle`                        |
| Error border           | `border-error-border`                    |

---

# 4.23 Typography Utility Mapping

Use semantic typography utilities whenever possible.

| Purpose            | Tailwind                                |
| ------------------ | --------------------------------------- |
| Major page heading | `text-page-title`                       |
| Section heading    | `text-section-title`                    |
| Subsection         | `text-subsection`                       |
| Large body         | `text-body-lg`                          |
| Default body       | `text-body`                             |
| Medium body        | `text-body-medium`                      |
| Supporting text    | `text-small`                            |
| Metadata           | `text-caption`                          |
| Overline           | `text-overline`                         |
| Article content    | `font-serif text-body-lg`               |
| Article preview    | `font-serif text-[17px] leading-[1.75]` |

---

# 4.24 Standard Page Layout Utilities

The application should use a consistent page container.

Recommended:

```tsx
<main className="min-h-screen bg-background">
  <div className="mx-auto w-full max-w-[1440px] px-6 py-8">
    {/* page content */}
  </div>
</main>
```

For larger desktop layouts:

```text
max-w-[1440px]
```

is the preferred maximum application content width.

Do not force every screen into a narrow container.

---

# 4.25 Standard Page Header

Use:

```tsx
<div className="flex items-start justify-between gap-6">
  <div className="space-y-1">
    <h1 className="text-page-title">
      Content Dashboard
    </h1>

    <p className="text-body text-muted-foreground">
      Overview of your content pipeline and publishing activity.
    </p>
  </div>

  <Button>
    New Content Request
  </Button>
</div>
```

This pattern should be reused across major screens.

---

# 4.26 Standard Card

Preferred:

```tsx
<Card className="border-border bg-card shadow-subtle">
  <CardHeader>
    ...
  </CardHeader>

  <CardContent>
    ...
  </CardContent>
</Card>
```

Do not automatically add large shadows or excessive rounding.

---

# 4.27 Standard Status Badge

Example:

```tsx
<Badge
  variant="outline"
  className="
    border-success-border
    bg-success-subtle
    text-success
  "
>
  <CheckCircle2 className="size-3.5" />
  Published
</Badge>
```

For warning:

```tsx
<Badge
  variant="outline"
  className="
    border-warning-border
    bg-warning-subtle
    text-warning
  "
>
  <Clock3 className="size-3.5" />
  Awaiting Review
</Badge>
```

For failure:

```tsx
<Badge
  variant="outline"
  className="
    border-error-border
    bg-error-subtle
    text-destructive
  "
>
  <CircleAlert className="size-3.5" />
  Failed
</Badge>
```

---

# 4.28 Standard Button Hierarchy

For a page with one primary action:

```tsx
<div className="flex items-center gap-3">
  <Button>
    Start Research
  </Button>

  <Button variant="outline">
    Save Draft
  </Button>
</div>
```

For destructive actions:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">
      Reject
    </Button>
  </AlertDialogTrigger>
</AlertDialog>
```

Avoid multiple visually equal primary buttons in the same action group.

---

# 4.29 Standard Content Spacing

Use:

```text
gap-4
gap-6
gap-8
```

as the primary spacing levels.

Recommended:

```tsx
<div className="space-y-8">
  <PageHeader />

  <section className="space-y-4">
    ...
  </section>

  <section className="space-y-4">
    ...
  </section>
</div>
```

Avoid arbitrary spacing values unless there is a specific layout reason.

---

# 4.30 Standard Two-Column Workspace

For the human review workspace:

```tsx
<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
  <section className="min-w-0">
    {/* Article */}
  </section>

  <aside className="lg:sticky lg:top-6 lg:self-start">
    {/* Review tools */}
  </aside>
</div>
```

The right panel should remain approximately:

```text
360px
```

wide on desktop.

---

# 4.31 Research Workspace Layout

Use:

```tsx
<div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
  <aside>
    {/* Source list */}
  </aside>

  <section className="min-w-0">
    {/* Source details */}
  </section>
</div>
```

The source list should remain readable without becoming excessively wide.

---

# 4.32 Article Reading Layout

Use:

```tsx
<article
  className="
    mx-auto
    max-w-article
    font-serif
    text-[17px]
    leading-[1.75]
    text-foreground
  "
>
  ...
</article>
```

Headings inside the article may return to the sans-serif UI font where appropriate.

---

# 4.33 Focus Ring Convention

All custom interactive components should follow:

```text
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

Where the component already provides accessible focus handling through shadcn/ui, do not duplicate it unnecessarily.

---

# 4.34 Transition Convention

Interactive components should use short transitions.

Preferred:

```text
transition-colors
duration-150
```

For expand/collapse:

```text
duration-200
```

Do not use long animations for ordinary UI interactions.

Avoid:

```text
duration-700
duration-1000
```

unless the animation represents a meaningful asynchronous process.

---

# 4.35 Responsive Breakpoints

Use Tailwind's default breakpoints unless there is a specific product requirement.

Primary behavior:

```text
sm  → Small devices
md  → Tablet
lg  → Desktop
xl  → Large desktop
2xl → Very large desktop
```

The primary desktop layout should begin at:

```text
lg
```

Do not create custom breakpoints unless required.

---

# 4.36 Sidebar Width Tokens

Recommended:

```text
Expanded:
w-64

Collapsed:
w-16
```

Example:

```tsx
<aside className="w-64 shrink-0 border-r border-border bg-card">
```

Collapsed:

```tsx
<aside className="w-16 shrink-0 border-r border-border bg-card">
```

Sidebar transitions should be subtle.

---

# 4.37 Top Bar

Recommended:

```tsx
<header
  className="
    sticky
    top-0
    z-30
    flex
    h-16
    items-center
    border-b
    border-border
    bg-background/95
    px-6
    backdrop-blur
  "
>
```

The top bar should not visually dominate the page.

---

# 4.38 Z-Index Convention

Use a small predictable hierarchy.

```text
z-10 → local sticky elements
z-20 → dropdown-adjacent UI
z-30 → application top bar
z-40 → overlays/sheets
z-50 → dialogs
```

Do not introduce arbitrary z-index values such as:

```text
z-[9999]
```

unless an actual stacking-context problem requires it.

---

# 4.39 Shadow Convention

Use shadows only for elevated surfaces.

Preferred:

```text
shadow-subtle
```

for cards where needed.

Use stronger shadows for:

* Dialogs
* Dropdowns
* Popovers

Do not use shadows as the primary way to distinguish every section.

---

# 4.40 Tailwind Usage Rule

When implementing a component, prefer this:

```tsx
<div className="border-border bg-card text-card-foreground">
```

over this:

```tsx
<div className="border-[#E1E4EA] bg-[#FFFFFF] text-[#172033]">
```

Prefer this:

```tsx
<span className="text-success">
```

over:

```tsx
<span className="text-[#159570]">
```

Prefer semantic design tokens throughout the application.

---

# 4.41 No One-Off Visual Tokens

The coding agent must not introduce component-specific colors such as:

```css
--article-blue
--research-green
--linkedin-blue
--ai-purple
--review-orange
```

unless a future design specification explicitly requires them.

Use the shared semantic token system instead.

---

# 4.42 Platform Preview Colors

LinkedIn, X, and newsletter previews may require platform-specific visual cues.

These should remain isolated to the preview component.

Do not allow platform colors to become application-wide design tokens.

Example:

```tsx
<LinkedInPreview />
<XPreview />
<NewsletterPreview />
```

Platform-specific styling belongs inside these components.

The rest of the application continues using the product design system.

---

# 4.43 Token Ownership

Design tokens should have a single source of truth.

Recommended ownership:

```text
globals.css
    ↓
CSS custom properties
    ↓
tailwind.config.ts
    ↓
Tailwind semantic utilities
    ↓
shadcn/ui components
    ↓
Application components
```

Components should consume tokens rather than redefining them.

---

# 4.44 Theme Extension Rule

If a new UI requirement appears that cannot be represented by the existing semantic tokens:

1. Check whether an existing token is appropriate.
2. Check whether the requirement can use an existing shadcn variant.
3. Only then introduce a new semantic token.
4. Add the token to the global design system.
5. Add the Tailwind mapping.
6. Document its intended usage.

Do not solve design-system gaps with arbitrary component-level colors.

---

# 4.45 Future Dark Mode Compatibility

Dark mode is not part of MVP.

However, CSS variables should be used from the beginning so a future dark theme can override:

```css
.dark {
  --background: ...;
  --foreground: ...;
  --card: ...;
  --primary: ...;
  /* etc. */
}
```

Do not implement or expose a dark-mode toggle in MVP.

The architecture should simply avoid making future dark mode unnecessarily difficult.


# 5. Typography Tokens

The application should use a modern sans-serif interface font paired with a highly readable long-form content font.

## 5.1 Font Families

### UI Font

Use:

```css
--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Inter should be used for:

* Navigation
* Buttons
* Labels
* Forms
* Metadata
* Tables
* Statuses
* General UI

---

### Editorial Font

Use:

```css
--font-serif: "Source Serif 4", Georgia, Cambria,
  "Times New Roman", serif;
```

Use the editorial font primarily for:

* Long-form article reading
* Article preview
* Editorial content surfaces

Do not use the serif font for application navigation or controls.

---

# 5.2 Type Scale

Use the following concrete scale.

| Token                | Size | Line Height | Weight | Usage                                    |
| -------------------- | ---: | ----------: | -----: | ---------------------------------------- |
| `text-display`       | 36px |        44px |    600 | Rare major page/marketing-style headings |
| `text-page-title`    | 28px |        36px |    600 | Main page title                          |
| `text-section-title` | 20px |        28px |    600 | Section heading                          |
| `text-subsection`    | 16px |        24px |    600 | Subsection                               |
| `text-body-lg`       | 16px |        26px |    400 | Long-form readable content               |
| `text-body`          | 14px |        22px |    400 | Standard UI body                         |
| `text-body-medium`   | 14px |        22px |    500 | Emphasized body                          |
| `text-small`         | 13px |        20px |    400 | Supporting information                   |
| `text-caption`       | 12px |        18px |    400 | Metadata                                 |
| `text-overline`      | 11px |        16px |    600 | Small labels/categories                  |

---

# 5.3 Page Titles

Use:

```text
text-[28px]
leading-9
font-semibold
tracking-[-0.02em]
```

Example:

```text
Content Dashboard
```

Page titles should not be excessively large.

---

# 5.4 Section Titles

Use:

```text
text-xl
leading-7
font-semibold
tracking-[-0.01em]
```

Example:

```text
Recent Content Requests
```

---

# 5.5 Subsections

Use:

```text
text-base
leading-6
font-semibold
```

---

# 5.6 Standard UI Body

Use:

```text
text-sm
leading-[22px]
font-normal
```

This is the default for:

* Forms
* Tables
* Descriptions
* Navigation
* Most UI content

---

# 5.7 Long-Form Article Text

Article reading/editing content should use:

```text
font-serif
text-base
leading-[1.75]
```

For especially long article previews:

```text
text-[17px]
leading-[1.75]
```

Recommended reading width:

```text
max-w-[720px]
```

The goal is approximately 60–80 characters per line.

---

# 5.8 Metadata

Use:

```text
text-xs
leading-[18px]
text-muted-foreground
```

Examples:

```text
Updated 12 minutes ago
6 sources
1,842 words
Generated by AI
```

---

# 5.9 Labels

Form labels:

```text
text-sm
font-medium
text-foreground
```

Required indicators should use semantic text where appropriate.

---

# 5.10 Helper Text

Use:

```text
text-xs
leading-[18px]
text-muted-foreground
```

Example:

```text
Describe who this content is intended for.
```

---

# 5.11 Overline / Category Labels

Use sparingly.

```text
text-[11px]
leading-4
font-semibold
uppercase
tracking-[0.08em]
text-muted-foreground
```

Example:

```text
ARTICLE OPTION
```

Do not use uppercase labels everywhere.

---

# 5.12 Numeric Metrics

Dashboard metrics:

```text
text-2xl
leading-8
font-semibold
tracking-[-0.02em]
```

Example:

```text
24
```

The number should be visually prominent without becoming a giant dashboard statistic.

---

# 5.13 Evaluation Scores

Use:

```text
text-2xl
leading-8
font-semibold
```

Example:

```text
8.7 / 10
```

Do not use oversized or animated score displays.

---

# 5.14 Font Weight Tokens

Use only these weights:

```text
400 — Regular
500 — Medium
600 — Semibold
700 — Bold
```

Preferred usage:

```text
400 → Body
500 → Labels / emphasized UI
600 → Headings / important controls
700 → Rare strong emphasis
```

Avoid using 700 everywhere.

---

# 5.15 Letter Spacing

Use subtle negative tracking for larger headings:

```text
Page title:
-0.02em

Section title:
-0.01em
```

Normal UI text should use default tracking.

Uppercase labels may use:

```text
0.08em
```

---

# 5.16 Tailwind Type Examples

Preferred implementations:

```tsx
<h1 className="text-[28px] leading-9 font-semibold tracking-[-0.02em]">
  Content Dashboard
</h1>
```

```tsx
<h2 className="text-xl leading-7 font-semibold tracking-[-0.01em]">
  Recent Content Requests
</h2>
```

```tsx
<p className="text-sm leading-[22px] text-muted-foreground">
  Overview of your content pipeline.
</p>
```

```tsx
<article className="max-w-[720px] font-serif text-[17px] leading-[1.75]">
  ...
</article>
```

---

# 5.17 Token Implementation

If the project uses Tailwind/shadcn CSS variables, define the semantic colors through CSS variables.

Example:

```css
:root {
  --background: 220 20% 97%;
  --foreground: 222 47% 11%;

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --primary: 238 70% 56%;
  --primary-foreground: 0 0% 100%;

  --secondary: 220 14% 94%;
  --secondary-foreground: 222 47% 18%;

  --muted: 220 14% 94%;
  --muted-foreground: 220 9% 46%;

  --accent: 220 14% 94%;
  --accent-foreground: 222 47% 18%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  --border: 220 13% 88%;
  --input: 220 13% 84%;
  --ring: 238 70% 56%;

  --success: 158 64% 40%;
  --success-subtle: 158 64% 95%;
  --success-border: 158 45% 82%;

  --warning: 38 92% 50%;
  --warning-subtle: 38 92% 95%;
  --warning-border: 38 70% 80%;

  --info: 211 86% 48%;
  --info-subtle: 211 86% 96%;
  --info-border: 211 60% 84%;

  --error-subtle: 0 72% 96%;
  --error-border: 0 55% 84%;

  --radius: 0.625rem;
}
```

If the existing shadcn setup already defines equivalent semantic tokens, extend the existing system instead of replacing it unnecessarily.

---

# 5.18 Design Token Rules

The implementation agent must:

* Prefer semantic tokens over hardcoded colors.
* Prefer existing Tailwind/shadcn utilities.
* Avoid arbitrary hex colors inside components.
* Avoid creating one-off colors for individual screens.
* Use the same semantic status colors throughout the application.
* Keep typography consistent across screens.
* Use the editorial font only where long-form content benefits from it.
* Never create a separate visual language for AI features.
* Never use color as the sole indicator of state.

The goal is a UI that feels intentionally designed rather than individually styled screen by screen.

# 6. Spacing

The application uses a **spacious** layout.

Whitespace is a deliberate part of the visual identity.

Prefer:

```text
p-5
p-6
gap-4
gap-6
space-y-6
```

where appropriate.

Avoid:

* Crowding unrelated information
* Multiple elements touching container edges
* Excessively compact dashboards

Spacing should establish hierarchy.

---

# 7. Border Radius

Use moderate radius values.

Preferred:

```text
rounded-lg
rounded-md
```

Avoid excessive pill-shaped components.

Pills should primarily be reserved for:

* Status badges
* Tags
* Compact metadata

---

# 8. Shadows

Use shadows sparingly.

Preferred:

```text
shadow-sm
```

for subtle elevation where necessary.

Avoid:

```text
shadow-xl
shadow-2xl
```

as default card styling.

Most cards should rely on:

```text
background + border
```

rather than heavy shadows.

---

# 9. Icons

Use Lucide icons where appropriate.

Icons should:

* Communicate meaning
* Support text
* Remain visually subtle

Do not use icons purely for decoration when they add no meaning.

Icon-only controls must have accessible labels/tooltips.

---

# 10. Motion

Use subtle motion.

Appropriate uses:

* Dialog transitions
* Expand/collapse
* Toast notifications
* Loading indicators
* AI activity transitions
* Hover states
* Focus states
* Status transitions

Avoid:

* Large page animations
* Parallax
* Decorative animations
* Excessive bouncing
* Long transition delays
* Motion that blocks interaction

Respect reduced-motion preferences where practical.

A dedicated accessibility/motion audit may be completed later.

---

# 11. Application Shell

## 11.1 Desktop Layout

The application uses a left sidebar and global top bar.

```text
┌───────────────────────────────────────────────────────┐
│ Sidebar │ Global Top Bar                             │
│         ├─────────────────────────────────────────────┤
│         │                                             │
│         │                                             │
│         │             Main Content                    │
│         │                                             │
│         │                                             │
└─────────┴─────────────────────────────────────────────┘
```

---

# 12. Sidebar

## 12.1 Behavior

The sidebar should be collapsible.

### Expanded

```text
Resetchy

Dashboard

Content Requests
Research
Review
Publishing

──────────────

Settings
```

### Collapsed

Display icons only.

Every icon-only navigation item must have:

* Tooltip
* Accessible label

---

## 12.2 Navigation

Primary navigation:

```text
Dashboard
Content Requests
Research
Review
Publishing
```

Secondary:

```text
Settings
```

Future navigation should not be added unless explicitly requested.

---

# 13. Global Top Bar

The top bar may contain:

* Breadcrumb/context
* Page title where appropriate
* Global search
* Notifications
* User profile menu

The global top bar should remain visually quiet.

---

## 13.1 Global Search

MVP search scope:

* Content requests
* Articles
* Publishing records

Advanced search and filtering are backlog items.

Do not build an enterprise-wide search system for the MVP.

---

# 14. Responsive Design

## Desktop

Desktop is the primary design target.

Use:

* Sidebar
* Two-column workspaces
* Wide content layouts

## Tablet

* Sidebar may collapse
* Multi-column layouts may reduce to one column
* Preserve primary actions

## Mobile

* Single-column layouts
* Sidebar becomes a mobile navigation mechanism
* Tables may scroll horizontally
* Actions remain accessible
* Long-form content remains readable

Responsive behavior should preserve functionality rather than merely shrinking elements.

---

# 15. Dashboard

## 15.1 Purpose

The dashboard gives the content manager a quick overview of the content pipeline.

---

## 15.2 Header

Display:

```text
Content Dashboard

Overview of your content pipeline and publishing activity.

[New Content Request]
```

The primary CTA should be visually prominent.

---

# 16. Dashboard Summary Cards

Display four summary cards:

```text
Active Requests
Awaiting Review
Scheduled
Published
```

Each card should contain:

* Label
* Current count
* Short contextual description
* Optional meaningful icon

Example:

```text
Active Requests

24

Content currently being processed
```

Do not display percentage trends in MVP.

---

# 17. Dashboard Main Sections

The dashboard should contain:

## Recent Content Requests

Display:

* Content title/idea
* Status
* Target audience
* Created date
* Last updated
* Current workflow stage

---

## Publishing Queue

Display a concise preview of upcoming publishing jobs.

Show:

* Content
* Channel
* Status
* Scheduled time

Provide a link to the full publishing queue.

---

## Recent Activity

Display recent workflow activity such as:

```text
Article approved
Research completed
Content scheduled
Publishing failed
Revision requested
```

---

# 18. Dashboard Backlog

Do not implement initially:

* Analytics charts
* Trend percentages
* Content performance metrics
* Channel performance
* Engagement statistics
* Historical trend graphs

These belong in the analytics backlog.

---

# 19. New Content Request

## 19.1 Presentation

Use a full-page content request experience on `/content-requests/new`.

Intake is a short two-stage flow — not a long multi-step wizard:

1. **Compose** — one large free-text prompt
2. **Understanding** — editable structured summary of the existing fields

Do not show the labeled field grid on the initial screen. The user should not have to decide what to type where before they start.

---

## 19.2 Header

```text
New Content Request

Dump your idea, audience, links, and notes in one place.
```

---

## 19.3 Stage 1 — Compose

Show a single large multi-line control with search-bar visual weight (hero input, not a tiny one-line search field).

Placeholder should invite dumping everything in natural language — idea, audience, URLs, tone, restrictions, supporting notes.

Primary action on this stage:

```text
Continue
```

While parsing, show a clear loading state. Do not offer Start Research until the Understanding stage.

---

## 19.4 Stage 2 — Understanding

After AI categorization, always show an editable summary under a heading such as:

```text
Here's what we understood
```

Pre-fill and allow editing of the same fields the pipeline already uses:

### Raw Idea

Required.

### Target Audience

Required.

### Supporting Material

Optional.

### Source URL

Optional.

Validate URL format when provided.

### Additional Instructions

Optional — tone, angle, restrictions, additional context, content requirements.

Missing required fields must be visually called out. The user must complete them before Start Research.

Provide a **Back** control that returns to Compose and preserves the original free-text prompt.

---

# 20. Request Actions

## Compose stage

Primary:

```text
Continue
```

Parses the free-text prompt into structured fields.

## Understanding stage

Primary:

```text
Start Research
```

Secondary:

```text
Save Draft
```

Disable Start Research and Save Draft while required fields are empty or the source URL is invalid.

The primary action should be visually stronger.

---

# 21. Request Validation

Validate on the Understanding stage (and on submit):

* Raw idea is not empty
* Target audience is not empty
* Source URL is valid when provided

Validation should appear near the relevant field.

The AI parser must leave unknown fields empty rather than inventing an audience or URL.

Avoid displaying generic errors such as:

```text
Something went wrong.
```

when a specific validation message can be provided.

---

# 22. Research Workflow

After submitting a request, transition to the research experience.

The UI should clearly show the current workflow stage.

Example:

```text
Researching

Request received
Searching for sources
Extracting source content
Analysing research
Building research context
Generating article options
```

---

# 23. Live Research Activity

The activity feed is a required MVP feature.

Use:

**Timeline + expandable details**

Example:

```text
✓ Request received

✓ Searching for relevant sources
  12 sources discovered

✓ Extracting source content
  8 sources successfully extracted

● Analysing research

○ Building research context

○ Generating article options
```

---

## 23.1 Activity States

### Completed

Use a check icon.

### Current

Use an animated/subtle active indicator.

### Pending

Use a muted indicator.

### Failed

Use a semantic error indicator.

---

## 23.2 Expandable Details

Users can expand completed steps to see useful information.

Example:

```text
Sources discovered

12 sources discovered
8 sources selected
4 duplicate sources removed
```

Do not expose raw developer logs by default.

---

# 24. Research Failure

When a research operation fails:

```text
Research step failed

We couldn't complete this step.

[Retry]
[View Details]
```

Technical details should be hidden behind the details control.

---

# 25. Research Workspace

The research workspace should provide detailed source information.

Recommended layout:

```text
┌────────────────────┬──────────────────────────────┐
│ Sources            │ Source Details               │
│                    │                              │
│ Forbes             │ Title                        │
│ McKinsey           │ Domain                       │
│ HBR                │ Published date               │
│ TechCrunch         │                              │
│                    │ Excerpt                      │
│                    │                              │
│                    │ Key findings                 │
│                    │                              │
└────────────────────┴──────────────────────────────┘
```

---

# 26. Source List

Each source should show:

* Title
* Domain
* Relevance indicator
* Selection state

Optional metadata may include:

* Publication date
* Content type

Avoid overwhelming the list with metadata.

---

# 27. Source Details

When a source is selected, display:

* Title
* Domain
* URL
* Publication date where available
* Relevance
* Extracted excerpt
* Key findings
* Why the source was selected

Provide:

```text
View Source
```

as an external link.

---

# 28. Source Grounding

The application should visibly communicate which sources informed generated content.

Use a reusable component:

```text
Grounded in 6 sources

Forbes · McKinsey · HBR · TechCrunch · +2

View all sources →
```

---

# 29. Inline Source Attribution

Where practical, important claims may reference their supporting source.

Example:

```text
AI adoption has accelerated significantly.[Source 2]
```

Inline source references should remain visually subtle.

Do not turn the article into an academic citation document.

---

# 30. Article Options

Once research is complete, display multiple generated article options.

Use cards.

---

## 30.1 Article Card

Each card should contain:

```text
OPTION 1

Article title

Short description or angle.

Sources: 6
Estimated length: 1,800 words

[Preview]       [Select]
```

---

## 30.2 Article Card Rules

Do not initially show:

* AI quality score
* Evaluation score
* Complex ranking metrics

The user should evaluate the article based on the content first.

---

# 31. Article Option Preview

Selecting Preview should allow the user to inspect the article without immediately committing to it.

Provide:

```text
Back
Select Article
```

The selected option should be visually distinguishable.

---

# 32. Article Selection

Once the user selects an article:

```text
Article Selected
```

Move the workflow to:

```text
Article
↓
Channel Adaptation
↓
Evaluation
↓
Human Review
```

---

## 32.1 Content Request Detail Navigation

The content-request detail page (`/content-requests/[id]`) does not stack every workflow section (Research, Article Options, Review, Channel Content, Sources) on the page at once. Instead it shows a section checklist:

```text
[ Research ]  [ Article Options ]  [ Review ]  [ Channel Content ]  [ Sources ]
```

Rules:

* Only sections that have available content are listed — a request still in research shows just `Research` (with LiveResearch/live activity); a request with an approved draft adds `Review`; once channel content exists, `Channel Content` and `Sources` appear too.
* The active item is visually selected; selecting a different item shows that section and hides the others, so the page never renders all sections simultaneously.
* Default active section prefers the latest workflow stage with content, in this order: Channel Content → Review → Article Options → Research → Sources.
* In-progress research still defaults to the Research section so live progress remains visible without an extra click.

---

# 33. AI-Assisted Article Editor

The editor is a core MVP component.

---

## 33.1 Standard Editing

Support:

* Headings
* Paragraphs
* Bold
* Italic
* Links
* Lists
* Quotes
* Undo
* Redo
* Word count

---

## 33.2 AI Editing

Allow users to select text and perform actions:

```text
Improve
Rewrite
Shorten
Expand
Change Tone
```

The AI action menu should remain compact.

---

# 34. AI Assistant Panel

Provide an optional side panel.

Example:

```text
AI Assistant

What would you like to change?

[Improve this section]

[Rewrite in a more conversational tone]

[Generate stronger CTA]
```

The assistant should operate against the selected article/context rather than behaving like a generic chatbot.

---

# 35. AI Editing Flow

When the AI proposes a change:

Do not silently overwrite content.

Prefer:

```text
Current
Proposed
```

with actions such as:

```text
Accept
Reject
Try Again
```

This preserves human control.

---

# 36. Channel Adaptation

Channel adaptation occurs **before human approval**.

Workflow:

```text
Selected Article
       ↓
Channel Adaptation
       ↓
LinkedIn
X
Newsletter
       ↓
Evaluation
       ↓
Human Review
       ↓
Approval
```

This ensures the reviewer approves the content that will actually be published.

---

# 37. Channel Preview

The application should provide realistic but non-identical representations of supported channels.

Supported MVP channels:

* LinkedIn
* X
* Newsletter

The channel review workspace places the live preview and the editable fields side by side on desktop, rather than stacking preview above editor above an always-expanded evaluation panel:

```text
┌─────────────────────────┬─────────────────────────┐
│ Channel Preview         │ Channel Editor          │
│ (LinkedIn / X / email)  │ subject (newsletter)    │
│                         │ body + Save Changes     │
└─────────────────────────┴─────────────────────────┘
```

* Equal (or near-equal) columns on `lg` and above; the editor stacks below the preview on smaller screens.
* Once a channel is approved or rejected, the editor is replaced by a read-only state (or hidden) since the content is no longer editable.
* Evaluation and Version History sit below the preview/editor row as compact controls (see §42–44), not as an always-on expanded side panel.

---

# 38. LinkedIn Preview

Display a preview resembling a professional LinkedIn post.

Include:

* Author/profile header
* Post text
* Optional media
* Hashtags
* CTA where applicable
* Engagement/action row
* Relevant character information

Do not attempt to reproduce LinkedIn pixel-for-pixel.

Label the preview clearly as:

```text
LinkedIn Preview
```

---

# 39. X Preview

Display:

* Profile/header
* Post text
* Thread structure when applicable
* Character count
* Action row

Label:

```text
X Preview
```

---

# 40. Newsletter Preview

Display an email-style preview containing:

* Subject
* Preview text
* Header
* Body
* CTA
* Footer where appropriate

Label:

```text
Newsletter Preview
```

---

# 41. Channel Navigation

Use tabs:

```text
LinkedIn
X
Newsletter
```

The selected channel should be clearly indicated.

The tab selector shares one horizontal toolbar row with the review actions for the currently selected channel (see §49):

```text
[ LinkedIn | X | Newsletter ]     [Approve] [Request Revision] [Reject]
```

* Tabs sit on the left, actions on the right of the same row.
* Approve / Request Revision / Reject apply to whichever channel tab is currently active.
* After a channel is approved or rejected, its action buttons are replaced by a status banner in that same toolbar position (current behavior — see §52).

---

# 42. Evaluation

Evaluation is generated after channel adaptation.

For the **article** review workspace, the evaluation section is an initially-collapsed inline panel (unchanged — see §46–48):

```text
Content Evaluation

Evaluation complete

[Show Evaluation]
```

For **channel** review, evaluation is a compact control rather than an inline expandable panel, since it sits alongside the preview/editor and Version History (see §37, §54):

```text
AI Evaluation

Evaluation complete

[View Evaluation]
```

`[View Evaluation]` opens the evaluation in a modal (§43) instead of expanding inline.

---

# 43. Evaluation Details

Article review keeps the inline-expand pattern; channel review opens the same details inside a modal dialog. Either way, once shown:

```text
Overall Score
8.7 / 10

SEO
9 / 10

Grounding
10 / 10

Structure
8 / 10

Clarity
9 / 10
```

Follow with:

### Strengths

```text
✓ Strong opening
✓ Clear structure
✓ Strong source grounding
```

### Needs Improvement

```text
! CTA could be stronger
! Section 3 needs additional evidence
```

For channel review, the evaluation modal additionally supports cycling between a channel's own evaluated versions (v1 → v2 → current) — not across channels:

* The modal opens on the latest version that has an evaluation, labeled `AI Evaluation — vN · Current`.
* If the channel has more than one evaluated version, the modal footer shows **Previous / Next** controls plus a position indicator (e.g. `1 of 2`), matching the pattern used by Version History (§54).
* A channel with only one evaluated version shows no cycle controls.
* Previous/Next only move between that channel's own evaluation versions; they never jump to a different channel (LinkedIn/X/Newsletter).

---

# 44. Evaluation Rules

The UI should not imply that the numerical score is an absolute measure of quality.

Use language such as:

```text
AI Evaluation
```

rather than:

```text
Quality: 8.7/10
```

The score is an aid for human review.

---

# 45. Evaluation / Revision Loop

The interface should support:

```text
Draft v1
   ↓
Evaluation
   ↓
Revision
   ↓
Draft v2
   ↓
Evaluation
   ↓
Draft v3
```

Each version must remain accessible.

---

# 46. Human Review Workspace

This is a primary MVP screen.

Use a two-column desktop layout.

```text
┌────────────────────────────────────────────────────────┐
│ Article title                             v3            │
│                                      [Reject] [Approve]│
├──────────────────────────┬─────────────────────────────┤
│                          │                             │
│                          │ Evaluation                  │
│                          │                             │
│       Article            │ Sources                     │
│       Editor             │                             │
│                          │ Version History              │
│                          │                             │
│                          │ AI Assistant                 │
│                          │                             │
└──────────────────────────┴─────────────────────────────┘
```

---

# 47. Review Workspace Left Panel

Contains:

* Article editor
* Content
* Inline source references
* Channel-aware content where applicable

The reviewer should be able to edit content directly.

---

# 48. Review Workspace Right Panel

Contains:

1. Evaluation
2. Sources
3. Version History
4. AI Assistant

The panel should be sticky on desktop while the article content scrolls.

On smaller screens, the right panel can move below the article or become a tabbed/sheet experience.

---

# 49. Review Actions

Primary actions:

```text
Approve
```

Secondary/destructive:

```text
Request Revision
Reject
```

The actions must be clearly differentiated.

In the article review workspace (§46–48), actions sit in the page header. In channel review, actions sit in the channel toolbar, on the same row as the channel tabs and scoped to whichever channel tab is active (see §41).

---

# 50. Request Revision

The reviewer should be able to provide a reason.

Example:

```text
Request Revision

What should be changed?

[                                      ]

[Cancel] [Request Revision]
```

The reason becomes part of the revision history.

---

# 51. Reject

Rejecting content should require confirmation.

Example:

```text
Reject Content?

This will mark the content as rejected.

Reason:

[                                      ]

[Cancel] [Reject]
```

---

# 52. Approval

Approval should be explicit.

Once approved:

```text
Approved ✓
```

The publishing actions become available.

---

# 53. Publishing Gate

The UI must never allow publishing of content that has not been approved.

Before approval:

```text
Publishing unavailable

Content must be approved before it can be published.
```

After approval:

```text
[Schedule]
[Publish Now]
```

This rule must also be enforced by the backend.

The UI must not be the only security/control mechanism.

---

# 54. Version History

Version history is collapsible.

Example:

```text
Version History                       [⌄]

v3 · Current
AI Revision
Sep 14, 10:42 PM
Score: 9.2

v2
Human Revision
Sep 14, 10:20 PM
Score: 7.8

v1
Initial Generation
Sep 14, 10:02 PM
Score: 6.9
```

---

# 55. Version Actions

Each version can expose:

```text
View
Compare
```

Comparison should show meaningful differences between versions.

Avoid creating a complex developer-style diff interface unless required.

Prefer a content-focused comparison.

---

# 56. Publishing Queue

The MVP uses a table-based publishing queue.

Do not implement calendar publishing in the MVP.

---

# 57. Publishing Table

Columns:

```text
Content
Channel
Status
Scheduled
Created
Actions
```

Example:

```text
AI Marketing Trends
LinkedIn
Approved
—
Sep 14
Publish
```

---

# 58. Publishing Statuses

Use:

```text
Draft
Awaiting Approval
Approved
Scheduled
Publishing
Published
Failed
```

Each status uses:

* Icon
* Semantic badge
* Text label

Do not rely on color alone.

---

# 59. Publishing Actions

For approved content:

```text
Publish Now
Schedule
```

For scheduled content:

```text
Edit Schedule
Cancel
```

For failed content:

```text
Retry
View Error
```

---

# 60. Publish Now

Publishing immediately should require confirmation.

Example:

```text
Publish to LinkedIn?

This will publish the approved content immediately.

[Cancel] [Publish]
```

Include a relevant channel preview in the confirmation where practical.

---

# 61. Schedule

Scheduling should allow:

* Date
* Time
* Channel confirmation

The UI should make the target channel and content obvious before confirming.

---

# 62. Publishing Progress

During publishing:

```text
Publishing to LinkedIn...

Preparing content
Connecting to publisher
Publishing
Confirming publication
```

On completion:

```text
Published successfully

LinkedIn post published.

[View Post]
```

---

# 63. Publishing Errors

Use human-readable error messaging.

Example:

```text
Publishing Failed

We couldn't publish this content to LinkedIn.

The LinkedIn authorization may have expired.

[Retry]
[View Technical Details]
```

---

# 64. Technical Error Details

Technical information is hidden by default.

When expanded:

```text
Technical Details

Status: 403
Code: AUTH_EXPIRED
Provider: LinkedIn
Request ID: pub_82...

[Copy Details]
```

Users should be able to copy technical details.

Do not expose raw stack traces by default.

---

# 65. Notifications

Use toast notifications for short-lived feedback.

Examples:

```text
Content published successfully.
```

```text
Content saved.
```

```text
Revision requested.
```

```text
Publishing failed.
```

For errors requiring investigation, also display an inline error state.

Do not rely solely on toasts for important failures.

---

# 66. Loading States

Every asynchronous operation should have a deliberate loading state.

Prefer:

* Skeletons
* Spinners for short operations
* Progress indicators
* Activity timelines for long AI operations

Avoid blank screens.

---

# 67. Empty States

Empty states should explain:

1. What is empty
2. Why it matters
3. What the user can do next

Example:

```text
No content requests yet.

Start your first content request to begin researching and
generating content.

[New Content Request]
```

---

# 68. Error States

Error states should:

* Explain what happened
* Explain what the user can do
* Provide Retry where appropriate
* Provide technical details when useful

Avoid:

```text
Error 500
```

as the primary user-facing message.

---

# 69. Success States

Success states should confirm:

* What happened
* Where it happened
* What the user can do next

Example:

```text
Content approved.

The content is now available for publishing.

[Go to Publishing Queue]
```

---

# 70. Disabled States

Disabled actions should have a clear reason.

Example:

```text
[Publish]
```

disabled.

Supporting message:

```text
Content must be approved before publishing.
```

Do not silently disable important actions without explanation.

---

# 71. Confirmation Dialogs

Confirmation is required for:

* Publish immediately
* Reject content
* Delete draft
* Cancel scheduled publication

Dialogs should clearly describe consequences.

Use:

```text
Cancel
Confirm Action
```

Avoid ambiguous buttons such as:

```text
OK
```

for destructive actions.

---

# 72. Components

Use shadcn/ui components wherever appropriate.

Preferred components include:

* Button
* Card
* Badge
* Dialog
* AlertDialog
* DropdownMenu
* Tabs
* Sheet
* Tooltip
* Table
* Skeleton
* Alert
* Toast
* Input
* Textarea
* Select
* Popover
* Command
* Separator

Use additional UI libraries only when they provide a meaningful capability that would otherwise require unnecessary custom implementation.

Do not install libraries merely for cosmetic convenience.

---

# 73. Component Reuse

Create reusable components for repeated patterns.

Examples:

```text
StatusBadge
PageHeader
ContentCard
SourceCard
SourceList
ActivityTimeline
EvaluationPanel
VersionHistory
ChannelPreview
PublishingStatus
ErrorDetails
EmptyState
```

Avoid duplicating equivalent components across pages.

---

# 74. Component Naming

Names should describe purpose rather than appearance.

Prefer:

```text
EvaluationPanel
```

over:

```text
BlueCard
```

Prefer:

```text
SourceCard
```

over:

```text
WhiteBox
```

---

# 75. Data States

Components that depend on asynchronous data must support:

```text
Loading
Success
Empty
Error
```

Where applicable:

```text
Disabled
Pending
Processing
```

---

# 76. Workflow Status

The content lifecycle should be visually consistent throughout the application.

Recommended conceptual lifecycle:

```text
REQUESTED
    ↓
RESEARCHING
    ↓
RESEARCH_COMPLETE
    ↓
GENERATING
    ↓
ARTICLE_SELECTED
    ↓
ADAPTING
    ↓
EVALUATING
    ↓
REVISING
    ↓
AWAITING_REVIEW
    ↓
APPROVED
    ↓
READY_TO_PUBLISH
    ↓
PUBLISHING
    ↓
PUBLISHED
```

Failure states should be represented clearly.

Examples:

```text
RESEARCH_FAILED
GENERATION_FAILED
PUBLISHING_FAILED
```

---

# 77. Content Lifecycle Indicator

Where appropriate, show the user's current position in the workflow.

Example:

```text
Request → Research → Draft → Adapt → Review → Publish
                         ●
```

The indicator should show:

* Completed
* Current
* Upcoming
* Failed

Avoid overly complex stepper components on every page.

Use the lifecycle indicator where it provides meaningful context.

---

# 78. AI Transparency

The UI should make it clear when content is:

* AI-generated
* AI-evaluated
* Human-edited
* Human-approved

Use subtle metadata rather than intrusive labels.

Example:

```text
Generated by AI
Reviewed by Sarah
Approved Sep 14
```

---

# 79. Human Control

The user must remain in control of consequential actions.

The system should never:

* Publish without approval
* Silently overwrite human edits
* Automatically reject content
* Hide important source information
* Replace human edits without confirmation

AI suggestions should be reviewable.

---

# 80. AI-Assisted Editing Rules

AI suggestions should preferably use:

```text
Current Content
     ↓
AI Suggestion
     ↓
Human Accept / Reject
```

Avoid:

```text
Current Content
     ↓
AI silently replaces content
```

---

# 81. Source Trust

The interface should distinguish between:

```text
Source-backed information
```

and:

```text
AI-generated interpretation
```

Where the distinction is important.

Do not visually imply that AI-generated statements are direct quotations from a source.

---

# 82. Platform Preview Rules

Platform previews should be recognizable but should not be presented as official replicas.

Use labels:

```text
LinkedIn Preview
X Preview
Newsletter Preview
```

Do not copy platform logos or UI elements unnecessarily if not required.

The purpose is to help reviewers understand how content will appear after publishing.

---

# 83. Accessibility Guidelines

Accessibility is a design guideline for the MVP.

Use:

* Semantic HTML
* Proper form labels
* Keyboard-accessible controls
* Visible focus states
* Accessible dialogs
* Accessible tabs
* Accessible tooltips
* Sufficient contrast
* Text labels for status
* Accessible loading states

Do not rely exclusively on color to communicate state.

A complete accessibility audit is a backlog item.

---

# 84. Keyboard Interaction

Interactive controls should be keyboard accessible.

Important interactions include:

* Sidebar navigation
* Tabs
* Dialogs
* Editor controls
* AI actions
* Publishing actions
* Source selection

---

# 85. Form UX

Forms should:

* Clearly identify required fields
* Validate near the relevant field
* Preserve entered values after recoverable errors
* Avoid unnecessary fields
* Provide useful placeholder/help text

Do not make the content request form feel like a CRM form.

---

# 86. Long-Form Content

Long-form content should have a readable line length.

Do not stretch article text across the entire viewport.

Use a narrower content column where appropriate.

The review workspace may use the available horizontal space, but the actual article text should remain comfortable to read.

---

# 87. Tables

Tables should be:

* Clean
* Spacious
* Scannable
* Consistent

Avoid excessive vertical separators.

Use subtle row separation.

Important statuses should use badges.

Actions should be grouped consistently.

---

# 88. Cards

Cards should be used to group meaningful information.

Do not put every section inside a card.

Prefer:

```text
Page
  Section
    Content
```

over:

```text
Card
  Card
    Card
      Content
```

Cards should communicate meaningful grouping.

---

# 89. Backlog

The following features are intentionally excluded from MVP implementation.

## Theme

* Dark mode

## Analytics

* Dashboard trends
* Content performance
* Channel performance
* Engagement metrics
* Historical analytics
* Analytics dashboards

## Publishing

* Calendar view
* Drag-and-drop scheduling
* Advanced scheduling
* Publishing calendar

## Search

* Advanced search
* Advanced filters
* Global enterprise search

## AI

* Article quality scores on option cards
* Advanced AI ranking
* More sophisticated AI editing workflows
* Additional AI assistants

## Accessibility

* Formal WCAG audit
* Dedicated screen-reader testing
* Full accessibility QA pass

---

# 90. MVP Scope Protection

The implementation agent must not implement backlog features unless explicitly instructed.

If a requirement is not defined in this document and is not required by the product requirements, do not invent additional functionality.

When a design decision is unspecified:

1. Follow this design system
2. Follow existing application patterns
3. Prefer the simplest implementation
4. Avoid introducing new navigation
5. Avoid introducing new visual patterns
6. Avoid adding features

---

# 91. Implementation Rules for AI Coding Agents

Before modifying UI, the agent must:

1. Read this document.
2. Inspect existing project structure.
3. Reuse existing components.
4. Reuse existing design tokens.
5. Follow existing routing conventions.
6. Avoid duplicate components.
7. Preserve existing functionality.
8. Implement the required states.
9. Maintain responsive behavior.
10. Keep MVP and backlog scope separate.

---

# 92. Dependency Rules

The project uses:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide icons

Additional UI libraries may be installed when they provide a meaningful capability required by the specification.

Before adding a dependency, determine whether the existing stack can provide the same capability.

Do not introduce multiple libraries that solve the same problem.

---

# 93. Design Consistency Rules

The agent must maintain:

* Consistent spacing
* Consistent typography
* Consistent button hierarchy
* Consistent status badges
* Consistent error handling
* Consistent loading states
* Consistent card treatment
* Consistent page headers
* Consistent navigation behavior

A new page should look like it belongs to the same application.

---

# 94. No Unrequested Redesigns

Do not redesign existing UI elements merely because another approach appears preferable.

If an existing component conflicts with this specification:

1. Identify the conflict.
2. Prefer the design specification for new UI.
3. Avoid unnecessary unrelated refactoring.

---

# 95. Acceptance Criteria — Global

Every MVP screen should satisfy:

* [ ] Uses the established design system
* [ ] Uses the correct typography hierarchy
* [ ] Uses consistent spacing
* [ ] Supports loading state where applicable
* [ ] Supports empty state where applicable
* [ ] Supports error state where applicable
* [ ] Supports success state where applicable
* [ ] Is responsive
* [ ] Does not introduce unnecessary visual patterns
* [ ] Uses reusable components
* [ ] Provides clear primary actions
* [ ] Provides clear feedback after actions

---

# 96. Acceptance Criteria — Dashboard

* [ ] Dashboard loads successfully
* [ ] Sidebar is visible
* [ ] Sidebar can collapse
* [ ] Top bar is visible
* [ ] Four summary cards are displayed
* [ ] Recent content requests are displayed
* [ ] Publishing queue preview is displayed
* [ ] Recent activity is displayed
* [ ] New Content Request CTA works
* [ ] Empty states exist
* [ ] Loading state exists
* [ ] Error state exists
* [ ] Responsive layout works

---

# 97. Acceptance Criteria — Content Request

* [ ] Initial screen is a single free-text compose prompt (no field grid)
* [ ] Continue parses the prompt into structured fields
* [ ] Parse loading state is visible
* [ ] Understanding summary is always shown after a successful parse
* [ ] All five fields are editable on the summary
* [ ] Raw Idea is required
* [ ] Target Audience is required
* [ ] Missing required fields block Start Research / Save Draft and are highlighted
* [ ] Supporting Material is optional
* [ ] Source URL is optional
* [ ] Additional Instructions are optional
* [ ] Extracted or edited Source URL is validated
* [ ] Back returns to Compose and preserves the original prompt
* [ ] Save Draft works from the Understanding stage
* [ ] Start Research works from the Understanding stage
* [ ] Submission and parse errors are understandable
* [ ] Detail page shows a section checklist listing only sections with available content
* [ ] Selecting a checklist section shows that section and hides the others

---

# 98. Acceptance Criteria — Research

* [ ] Research progress is visible
* [ ] Activity timeline is visible
* [ ] Current step is clear
* [ ] Completed steps are visible
* [ ] Steps can expose additional details
* [ ] Research errors are visible
* [ ] Retry is available where appropriate
* [ ] Sources are displayed
* [ ] Source details are available
* [ ] Source URLs are accessible
* [ ] Source grounding is visible
* [ ] In-progress research is the default active section on the detail page's section checklist

---

# 99. Acceptance Criteria — Article Options

* [ ] Multiple article options can be displayed
* [ ] Options use cards
* [ ] Title is visible
* [ ] Angle/summary is visible
* [ ] Source count is visible
* [ ] Estimated length is visible
* [ ] Preview action exists
* [ ] Select action exists
* [ ] Selected option is visually clear
* [ ] AI quality score is not shown on cards

---

# 100. Acceptance Criteria — Editor

* [ ] Article can be edited
* [ ] Standard formatting works
* [ ] Word count is available
* [ ] AI actions are available
* [ ] AI suggestions do not silently overwrite content
* [ ] Suggestions can be accepted
* [ ] Suggestions can be rejected
* [ ] Loading states exist for AI actions
* [ ] AI errors are understandable

---

# 101. Acceptance Criteria — Channel Adaptation

* [ ] Selected article can be adapted
* [ ] LinkedIn version exists
* [ ] X version exists
* [ ] Newsletter version exists
* [ ] Channel tabs work
* [ ] Channel previews are available
* [ ] Content is reviewed before approval
* [ ] Channel-specific formatting is visible
* [ ] Channel tabs and Approve/Request Revision/Reject actions render on one toolbar row
* [ ] Channel preview and editor render side by side on desktop (`lg` and above)
* [ ] Preview stacks above editor on smaller screens

---

# 102. Acceptance Criteria — Evaluation

* [ ] Evaluation exists
* [ ] Evaluation is collapsed initially in the article review workspace
* [ ] User can expand evaluation in the article review workspace
* [ ] Overall score is visible after expansion
* [ ] Individual scores are visible
* [ ] Strengths are visible
* [ ] Weaknesses are visible
* [ ] Evaluation does not block human judgment
* [ ] In channel review, evaluation opens in a modal from a compact "View Evaluation" control
* [ ] Evaluation modal supports Previous/Next cycling across a channel's own evaluated versions
* [ ] Evaluation modal never cycles across different channels (LinkedIn/X/Newsletter)
* [ ] A channel with a single evaluated version shows no cycle controls

---

# 103. Acceptance Criteria — Human Review

* [ ] Review uses two-column desktop layout
* [ ] Article is editable
* [ ] Evaluation is accessible
* [ ] Sources are accessible
* [ ] Version history is accessible
* [ ] AI assistant is accessible
* [ ] Right panel remains useful while scrolling
* [ ] Reviewer can request revision
* [ ] Reviewer can reject
* [ ] Reviewer can approve
* [ ] Approval state is persisted

---

# 104. Acceptance Criteria — Version History

* [ ] Version history is collapsible
* [ ] Current version is clearly marked
* [ ] Version metadata is visible
* [ ] Evaluation score is available
* [ ] Previous versions can be viewed
* [ ] Versions can be compared
* [ ] Revision reasons are preserved

---

# 105. Acceptance Criteria — Publishing

* [ ] Publishing is unavailable before approval
* [ ] Publish Now is available after approval
* [ ] Schedule is available after approval
* [ ] Confirmation is required for immediate publishing
* [ ] Channel is clearly identified
* [ ] Publishing progress is visible
* [ ] Success is clearly communicated
* [ ] Failure is clearly communicated
* [ ] Technical details can be expanded
* [ ] Technical details can be copied
* [ ] Failed jobs can be retried

---

# 106. Acceptance Criteria — Publishing Queue

* [ ] Queue uses a table
* [ ] Content is visible
* [ ] Channel is visible
* [ ] Status is visible
* [ ] Schedule is visible
* [ ] Actions are available
* [ ] Failed jobs are distinguishable
* [ ] Scheduled jobs are distinguishable
* [ ] Published jobs are distinguishable

---

# 107. Acceptance Criteria — Error Handling

* [ ] User-friendly error message is shown
* [ ] Retry is provided when appropriate
* [ ] Technical details are hidden initially
* [ ] Technical details can be expanded
* [ ] Technical details can be copied
* [ ] Raw stack traces are not shown by default

---

# 108. Acceptance Criteria — Accessibility

The MVP should:

* [ ] Use semantic HTML
* [ ] Provide labels for form controls
* [ ] Support keyboard navigation for primary controls
* [ ] Provide visible focus states
* [ ] Use accessible shadcn primitives
* [ ] Not rely exclusively on color
* [ ] Provide accessible names for icon-only buttons

A formal accessibility audit remains backlog scope.

---

# 109. Final UX Principle

At every point in the application, the user should be able to answer:

```text
What am I looking at?
What stage is this content in?
What happened?
What is the system doing?
What can I do next?
```

If a screen does not clearly answer these questions, the UI should be reconsidered.

---

# 110. Final Implementation Principle

The application should feel like a **professional content operations workspace**, not a collection of AI demos.

The AI should be visible enough to build trust, but not so visually dominant that it becomes the product.

The human remains the decision-maker.

The system should make research, generation, evaluation, revision, review, and publishing feel like one continuous workflow.

---

# 111. Source of Truth Rule

This document is the primary UI design reference.

When implementing UI:

```text
UI Design Specification
        ↓
Existing Design System
        ↓
Existing Application Patterns
        ↓
Reasonable Design Judgment
```

If these conflict, follow the most specific applicable requirement.

Do not introduce new patterns without a reason.

Do not implement backlog items unless explicitly requested.

Do not redesign unrelated areas of the application.

---

# 112. Short Agent Instruction

When providing this document to an AI coding agent, use the following instruction:

> Read `docs/ui-design-spec.md` before implementing or modifying any UI.
>
> Treat the document as the UI source of truth.
>
> Follow all MVP requirements exactly, reuse existing project components and design tokens where possible, and use reasonable design judgment only where the specification is intentionally silent.
>
> Do not implement backlog features unless explicitly requested.
>
> Do not introduce unnecessary dependencies, visual patterns, navigation, or functionality.
>
> Before completing a UI task, verify that the implementation satisfies the relevant acceptance criteria in this document.
