---
name: ai-contribute
description: Lets any contributor's own AI assistant pick up work on this repo (FontWoW/FontWoW.github.io) autonomously — reads open GitHub issues, classifies each as a bug or a feature request, picks one matching what the user asked for, implements it (including the sync-site-app rule when relevant), and opens a PR for the maintainer to review. Trigger on "باگ‌ها رو رفع کن", "یه قابلیت جدید اضافه کن", "به این پروژه کمک کن", "پیدا کن چیکار کنم", "fix a bug", "add a new feature", "contribute to this project", "pick an issue and work on it", or any open-ended request to help the project without a specific task named.
---

# AI Contribute

Turns "come fix bugs / add features" into a full autonomous contribution loop: find an issue →
classify it → implement it → open a PR the maintainer (Rick) can approve or reject. This is how
outside contributors let their own AI coding assistant help build FontWoW without needing to be
told exactly what to do.

## 0. Preconditions — GitHub account and auth

A PR cannot be opened without push access to a fork and an authenticated `gh` CLI. Before doing
anything else:

1. Check auth: `gh auth status`.
2. If not authenticated or the user has no GitHub account yet:
   - Tell the user plainly, in their language: they need a free GitHub account
     (https://github.com/signup) and then must run `gh auth login` themselves in their terminal
     (this requires an interactive login flow — you cannot do it for them, and must never ask
     them to paste a token/password into chat).
   - Stop here and wait. Do not proceed to issue work without confirmed auth, since nothing you
     do can be turned into a PR anyway.
3. Confirm the user has (or can create) their own fork, or push access to a branch on
   `FontWoW/FontWoW.github.io`. If neither, guide them to fork via `gh repo fork FontWoW/FontWoW.github.io --clone` first.

## 1. Understand what the user asked for

- "باگ‌ها رو رفع کن" / "fix bugs" → look only at issues classified as **bug**.
- "قابلیت جدید اضافه کن" / "add a feature" → look only at issues classified as **feature**.
- No preference stated → consider both, prefer whichever has the oldest untouched issue.
- If the user named a specific issue number or topic, use that directly and skip classification.

## 2. Fetch and classify open issues

```bash
gh issue list --repo FontWoW/FontWoW.github.io --state open --json number,title,body,labels,createdAt
```

Labels (`bug`, `enhancement`, etc.) exist on the repo but issues are often filed unlabeled — do
**not** rely on labels alone. Classify each issue yourself by reading the title and body:

- **Bug**: describes broken/incorrect current behavior ("X doesn't work", "layer order gets
  messed up", "crashes when...", "uneditable text layers").
- **Feature**: requests new capability that doesn't exist yet ("add support for...", "would be
  nice to have...", "حمایت رمزارزی و رأی‌گیری برای اولویت فونت‌ها").

Skip issues already linked to an open PR (`gh pr list --search "linked:<issue-number>"` or check
if the issue has a "linked pull requests" entry via `gh issue view <N>`), and skip anything
labeled `wontfix`, `duplicate`, or `invalid`.

Pick **one** issue matching the requested category — the clearest, most self-contained one if
several qualify. Don't take on multiple issues in one pass; one issue → one focused PR.

## 3. Implement it

- Read the issue fully (`gh issue view <N>`) before touching code — comments may add constraints.
- Work directly in this repo's feature folders (`src/app/App.jsx`, `src/landing/Landing.jsx`,
  `src/landing/features.js`, `src/shared/…`). If the change adds/changes a user-facing editor
  capability, the **sync-site-app** skill's rule applies: implement it for real in the app AND
  reflect it in `src/landing/features.js` — never just one side.
- Keep the change scoped to the issue. Don't bundle unrelated fixes or refactors into the same PR.
- Test the change (dev server / browser check for UI changes) before opening a PR — see this
  repo's `run` skill or `npm run dev` + the browser preview tools.

## 4. Open the PR

```bash
git checkout -b fix/<short-slug>        # or feat/<short-slug>
git add <files>
git commit -m "..."
git push -u origin fix/<short-slug>     # or to your fork's remote
gh pr create --title "..." --body "Closes #<N>

<what changed and why>"
```

- Title in the same style as existing history (`fix:`/`feat:` prefix).
- Body must reference the issue (`Closes #<N>`) so it auto-links.
- Never merge the PR yourself — it exists so the maintainer can review and approve/reject it. The
  `pr-auto-review` skill (run by the maintainer) will review it separately.

## 5. Report back

Tell the user which issue you picked, why you classified it that way, what you changed, and the
PR URL. If you could not find any suitable open issue in the requested category, say so plainly
instead of forcing a low-value change.

## Guardrails

- Never fabricate an issue to "fix" — only work from issues that actually exist and are open.
- Never open a PR without having actually run/verified the change where verification is feasible.
- Never skip the GitHub-account/auth check to "save time" — an unauthenticated attempt just fails
  confusingly later.
- If `gh` isn't installed or there's no `origin`/fork remote, stop and tell the user rather than
  guessing at git plumbing.
