---
name: sync-site-app
description: Enforces that any new/changed user-facing capability is added to BOTH the marketing site (Landing.jsx / src/landing/features.js) AND the real app (App.jsx and friends) — never just one. Trigger on "قابلیت جدید اضافه کن", "این امکان رو اضافه کن به اپ/سایت", "فیچر جدید", "option/feature/امکان جدید", or any request to add, change, or remove an editor capability, export option, style/effect, template, or anything listed in the "امکانات" section on the landing page.
---

# Sync site ↔ app

FontWoW ships two surfaces from one repo:

- **سایت (site)** — `src/landing/Landing.jsx`, the marketing/landing page. Its "امکانات" section
  renders from `src/landing/features.js`.
- **اپلیکیشن (app)** — `src/app/App.jsx` (plus `src/shared/native.js`, `src/shared/templates.json`,
  etc.), the real editor where the capability actually lives.

`src/landing/features.js` is the canonical registry connecting the two. **It is mandatory, not
optional, that these move together.**

## Rule

Whenever a user-facing option/capability is added, changed, or removed:

1. **Implement it for real in the app** — the actual editor behavior in `src/app/App.jsx` (or
   `src/shared/native.js`, `src/shared/templates.json`, etc. as appropriate).
2. **Reflect it in `src/landing/features.js`** — add/update/remove the matching entry so the landing
   page description stays accurate. Use an existing card if the new capability is a variant of one
   already listed (e.g. a new text effect belongs under "استایل و افکت متن"); only add a new card
   for a genuinely new capability category.
3. Do **both in the same change**. Never ship an app capability without updating the site's
   description of it, and never edit `src/landing/features.js` to describe something that isn't
   actually implemented in the app yet.

Treat this as a hard gate before considering the task done — if you changed one side and not the
other, the task is incomplete.

## Workflow

1. Read `src/landing/features.js` to see current entries and decide whether the change fits an
   existing card or needs a new one.
2. Make the real implementation change in `src/app/App.jsx` (or wherever the capability actually
   lives).
3. Update `src/landing/features.js` to match (`iconName` must reference a real export from
   `src/shared/icons.jsx` — check with `grep "^export" src/shared/icons.jsx` if unsure).
4. `Landing.jsx` imports `FEATURES` from `./features` and needs no further edits unless the overall
   section layout/copy around it changes.
5. If the change is significant enough to warrant new screenshots (`docs/screen-*.png` referenced
   in `Landing.jsx`), flag that to the user rather than silently skipping it — don't generate fake
   screenshots.
6. Before finishing, diff-check: does every new/changed capability in this change have a
   corresponding entry in `src/landing/features.js`, and does every `features.js` entry you touched
   correspond to something real in the app? If not, go back and fix the missing side.
