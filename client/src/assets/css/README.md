# CSS standard and design tokens

This folder holds the hand-written CSS for the app. The goal of this doc is to
keep styling consistent and stop raw values from drifting back into the code.
Linting (stylelint) enforces these as warnings today. Treat new warnings as
something to avoid, not something to add to.

## The two token files own the raw values

Only these two files are allowed to contain raw hex or rgb color literals:

- `main.css` owns the scale: spacing (`--space-*`), type (`--text-*`), radius,
  shadow, transition, and container tokens.
- `enterprise-theme.css` owns the brand and state colors. It is the single
  source of truth for color.

Every other file must reference colors through `var(--token)`. If you need a
color that does not exist yet, add it to `enterprise-theme.css` first, then use
the token. Do not paste a hex value into a feature file.

## Type scale

The canonical type scale is the `--text-*` tokens. A raw `font-size` value
(`14px`, `0.875rem`, and so on) is a drift signal and will warn. Use the nearest
`--text-*` token instead. Spacing uses `--space-*`.

## No new per-feature CSS file per feature

We already have many overlapping files. Before adding a new `.css` file for a
feature, check whether an existing file or a `ui/` component already covers it.
Prefer reusable `ui/` components and shared tokens over a one-off stylesheet.

## Inline styles

Avoid `style={{ ... }}` in JSX. It bypasses the token system and is hard to keep
consistent. Prefer a CSS class or a `ui/` component. ESLint warns on inline
`style` props.

## Tooling

From `client/`:

- `npm run lint:css` reports CSS token violations (raw hex, off-scale font-size).
- `npm run lint:js` reports inline-style and other JS lint warnings.

Both are warnings for now and do not block the build or commits. A pre-commit
hook runs these on staged files. The current violation counts are a known
backlog, not a reason to stop shipping. Do not add new ones.
