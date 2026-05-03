# Chuds Arcade Design System

## Visual target

The UI should feel like a playable page from a black-and-white manga magazine.

Keywords:

```txt
manga ink
zine layout
terminal microcopy
thin black rules
editorial grid
screentone
halftone
clean cards
minimal game boards
```

## Avoid

```txt
neon
cyberpunk glow
glassmorphism
heavy gradients
AI-painterly scenes
over-rendered backgrounds
full-color avatars
busy HUDs that hide gameplay
```

## Color palette

Use monochrome by default.

```css
:root {
  --paper: #ffffff;
  --ink: #050505;
  --muted-ink: #555555;
  --panel: #f7f7f7;
  --panel-2: #eeeeee;
  --rule: #111111;
  --soft-rule: #cfcfcf;
  --tone: #dcdcdc;
  --inverse-paper: #050505;
  --inverse-ink: #ffffff;
}
```

Accent color is intentionally absent for v0. If a single accent is later needed, use it sparingly and only for active state. Do not introduce a neon palette.

## Typography

Do not include font files in the repo.

Recommended categories:

- Display: tall condensed uppercase sans.
- Body: clean grotesk/sans.
- Mono: compact developer-style monospace.

Suggested font CSS stack:

```css
--font-display: "Arial Narrow", "Impact", "Anton", system-ui, sans-serif;
--font-body: Inter, "Space Grotesk", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
```

## Layout primitives

### Page shell

- Huge top-left wordmark.
- Small Japanese subtitle line.
- `// issue 01` micro label.
- Top nav with simple black icons.
- Top-right issue/page badge.

### Panels

Panel anatomy:

```txt
+--------------------------------------+
| // SECTION TITLE              action |
+--------------------------------------+
| content                              |
+--------------------------------------+
```

Rules:

- 1px black border.
- Square or nearly square corners.
- Interior dividers are thin rules.
- Use halftone fills for inactive/progress/texture.
- Prefer black filled buttons with white text.

### Cards

Game card anatomy:

```txt
[ number ]
[ monochrome thumbnail ]
TITLE
[tag] [tag]
```

### Buttons

Primary:

```css
background: var(--ink);
color: var(--paper);
border: 1px solid var(--ink);
text-transform: uppercase;
letter-spacing: 0.08em;
```

Secondary:

```css
background: var(--paper);
color: var(--ink);
border: 1px solid var(--ink);
```

## Game visual rules

- Gameplay must read at thumbnail size.
- Every game should work in black/white/grayscale.
- Motion lines are allowed but must be intentional.
- Avoid detailed painterly backgrounds. Use simple grids, silhouettes, tiles, icons, and line art.
- HUDs should be quiet and geometric.

## Mockup assets

Use these as direction only:

```txt
assets/mockups/homepage.png
assets/mockups/one-button-samurai.png
assets/mockups/synth-runner.png
assets/mockups/cursor-wars.png
assets/mockups/captcha-dungeon.png
```
