# `src/` layout

FontWoW keeps routes and shared code in small feature folders so landing, editor, and tooling stay easy to navigate.

```text
src/
├── main.jsx                 # router + startup shell
├── index.css                # global tokens / body / startup
├── app/                     # editor (#/app)
│   ├── App.jsx
│   ├── App.css
│   ├── PromptSheet.jsx
│   ├── labels.jsx
│   └── useDesignHistory.js
├── landing/                 # marketing site (#/)
│   ├── Landing.jsx
│   ├── Landing.css
│   ├── LandingDemo.jsx
│   ├── features.js          # canonical "امکانات" registry
│   ├── FontGoals.jsx
│   ├── goals.js
│   ├── MediaSupporters.jsx
│   └── mediaSupporterData.js
├── share/                   # media kit (#/share)
├── stats/                   # analytics page (#/stats)
└── shared/                  # cross-route utilities & data
    ├── fonts.js
    ├── templates.json
    ├── google-fonts.json
    ├── icons.jsx
    ├── strings.js
    ├── native.js
    ├── updates.js
    ├── updateCheck.js
    ├── logger.js
    ├── analytics.js
    └── StartupLoader.jsx
```

## Path aliases (Vite + jsconfig)

| Alias | Points to |
|-------|-----------|
| `@shared/*` | `src/shared/*` |
| `@app/*` | `src/app/*` |
| `@landing/*` | `src/landing/*` |
| `@share/*` | `src/share/*` |
| `@stats/*` | `src/stats/*` |

Relative imports inside a folder are fine; prefer `@shared/...` when crossing feature boundaries.

## Sync rule

User-facing editor capabilities must ship in `app/` **and** be reflected in `landing/features.js`. See `.claude/skills/sync-site-app/SKILL.md`.
