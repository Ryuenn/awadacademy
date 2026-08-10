# Awad Academy — Dependency Audit & Build Performance Pass

**Date:** 2026-08-11
**Repo:** `c:\Projects\AwadAcademy_static`
**Branch:** `main`
**Baseline commit:** `64d68e191414afb594606c4e0f1e6cd2b06d4839` ("changes", Thu Aug 6 21:49:49 2026 +0800)

---

## Summary

**Nothing changed.** The task could not be executed as specified: this repo is a
plain static HTML site with no `package.json`, no lockfile, and no build step, so
the dependency-audit and build-performance workflow has nothing to operate on.
`npm audit` failed with `ENOLOCK` and, per instruction, work stopped there.

---

## Table: metric | before | after

| Metric | Before | After |
|---|---|---|
| Build time | **NOT MEASURED** — no build step exists in this repo | unchanged (no build run) |
| Bundle size | **NOT MEASURED** — no build output is produced | unchanged (no build run) |
| Dependency count | **N/A** — no `package.json`, so no dependency graph exists to count | unchanged |

Metrics I *did* produce with a shown command, which are **not** build outputs and
must not be read as bundle size:

| Measurement | Value | Command |
|---|---|---|
| Tracked files in git | 784 | `git ls-files \| wc -l` |
| Git object store size | 834.69 MiB | `git count-objects -vH` |
| Working tree, excl. `.git` | 821 MB | `du -sh . --exclude=.git` |
| `assets/` | 438 MB | `du -sh assets css js _duplicates` |
| `_duplicates/` | 383 MB | `du -sh assets css js _duplicates` |
| `css/` | 168 KB | `du -sh assets css js _duplicates` |
| `js/` | 32 KB | `du -sh assets css js _duplicates` |
| Tracked files under `_duplicates/` | 444 | `git ls-files _duplicates \| wc -l` |

---

## Packages updated

**None.** No package manifest exists, so there was nothing to update.

## Majors deferred

**None identified.** `npm outdated` returned empty output with exit code 0 — this
reflects the absence of a `package.json`, not a verified up-to-date dependency
set. No major-version analysis was possible.

## Removed

**Nothing was removed.** No files and no dependencies were deleted. `depcheck` was
never run (see CANNOT VERIFY), so no tool has flagged anything, and per your rule
I removed nothing without tool output plus your confirmation.

---

## Commands run (exact, in order)

```
git status
git rev-parse --abbrev-ref HEAD
git log -1 --format="%H%n%s%n%ad"
ls -la
ls -la assets css js _duplicates
git ls-files | grep -Ei 'package\.json|package-lock|yarn\.lock|pnpm-lock|\.nvmrc|webpack|vite|rollup|gulpfile|Gruntfile|tsconfig|Makefile'
cat vercel.json
ls -la node_modules
npm outdated
npm audit
ls -la notes/
git ls-files | wc -l
git count-objects -vH
git ls-files _duplicates | wc -l
cat .gitignore
ls -la .vercelignore
du -sh . --exclude=.git
du -sh assets css js _duplicates
grep -ohE '(src|href)="https?://[^"]+"' *.html | sort -u
mkdir -p notes
```

### Raw output — build tooling search

```
$ git ls-files | grep -Ei 'package\.json|package-lock|yarn\.lock|pnpm-lock|\.nvmrc|webpack|vite|rollup|gulpfile|Gruntfile|tsconfig|Makefile'
---exit:1---
```

No matches. No package manifest, no lockfile, no bundler config, no Makefile.

```
$ ls -la node_modules
ls: cannot access 'node_modules': No such file or directory
```

### Raw output — `npm outdated`

```
$ npm outdated
=== npm outdated exit code: 0 ===
```

Empty output, exit 0. With no `package.json` present this is a vacuous result, not
a clean bill of health.

### Raw output — `npm audit` (FAILED)

```
$ npm audit
npm error code ENOLOCK
npm error audit This command requires an existing lockfile.
npm error audit Try creating one first with: npm i --package-lock-only
npm error audit Original error: loadVirtual requires existing shrinkwrap file
npm error A complete log of this run can be found in: C:\Users\obi\AppData\Local\npm-cache\_logs\2026-08-10T16_45_22_683Z-debug-0.log
=== npm audit exit code: 1 ===
```

**This is the failure that stopped Part 1.** I did not create a `package.json` or
lockfile to work around it.

### Context — external references in HTML (NOT a depcheck run)

```
$ grep -ohE '(src|href)="https?://[^"]+"' *.html | sort -u
href="https://magistratetesting.vercel.app/"
href="https://www.awadacademy.com/aboutus.html"
href="https://www.awadacademy.com/album-april-2026.html"
href="https://www.awadacademy.com/contact.html"
href="https://www.awadacademy.com/events.html"
href="https://www.awadacademy.com/faqs.html"
href="https://www.awadacademy.com/gallery.html"
href="https://www.awadacademy.com/index.html"
href="https://www.awadacademy.com/instructor.html"
href="https://www.awadacademy.com/learning-center.html"
href="https://www.awadacademy.com/program.html"
href="https://www.awadacademy.com/signup.html"
href="https://www.awadacademy.com/successstories.html"
href="https://www.awadacademy.com/testimonials.html"
href="https://www.awadacademy.com/videogallery.html"
href="https://www.instagram.com/awadacademy/"
href="https://www.youtube.com/@AwadAcademy"
src="https://analytics.ahrefs.com/analytics.js"
```

This is raw grep output included as context on where third-party code actually
enters this site (one external script: Ahrefs analytics). It is **not** a
dependency audit and no audit tool has evaluated it.

---

## MANUAL — OBI

**NOT YET LOGGED**

`notes/manual-log.md` does not exist (`ls: cannot access 'notes/': No such file or
directory`). Out-of-repo steps this change requires, left blank for you to fill:

- **Vercel dashboard — build/deploy settings reviewed:**
- **Vercel dashboard — deployment output size / build duration observed:**
- **Vercel dashboard — ignored build step or `.vercelignore` behaviour confirmed:**
- **Cloudflare — caching / proxy configuration checked:**
- **Cloudflare — cache purge performed (if any):**
- **DNS — apex → www redirect verified live (per `vercel.json` redirect rule):**
- **Live browser check — pages loaded and rendered correctly:**
- **Live browser check — images served and not broken:**
- **Live browser check — Ahrefs analytics script loading:**
- **Anything else done outside the repo:**

---

## CANNOT VERIFY

Everything in this section is a step I did **not** complete or could **not**
confirm.

**Part 1 steps not executed:**

1. **Clean build — NOT RUN.** No build step exists in this repo. No build time and
   no bundle size were produced. Every build-related cell in the metrics table is
   marked NOT MEASURED for this reason.
2. **`npm audit` — FAILED** with `ENOLOCK`, exit code 1. Raw output shown above.
   Work stopped here per your instruction. I did not run
   `npm i --package-lock-only` to manufacture a lockfile.
3. **`npm outdated` — ran, but result is meaningless.** Exit 0 with empty output
   because there is no manifest to compare against. I am not reporting this as
   "no outdated packages."
4. **Patch/minor updates — NOT APPLIED.** Nothing to apply.
5. **Majors — NONE LISTED.** I cannot list majors to defer without a dependency
   graph. The empty list means "not determined," not "none exist."
6. **`depcheck` — NOT RUN.** It requires a `package.json`. I did not install it.
   No tool output exists, so no unused-dependency or unreferenced-asset findings
   are reported. I deliberately did not substitute manual import-reading, since
   you explicitly ruled that out.
7. **Rebuild — NOT RUN.** No "after" build time, bundle size, or dependency count
   exists.
8. **Commit — NOT MADE.** There are no changes to commit. Working tree is clean at
   `64d68e191414afb594606c4e0f1e6cd2b06d4839`. **No commit hash to give you.**

**Part 2:**

9. **`notes/manual-log.md` — MISSING.** The MANUAL — OBI section is a blank
   template, not a record. Nothing in it has been performed or verified by me.

**Not verified by me, at all:**

10. Anything on Vercel, Cloudflare, DNS, or in a live browser. I have no access to
    those and ran no checks against them.
11. Whether the site currently builds or deploys successfully on Vercel.
12. Whether `_duplicates/` is actually served in production. I measured it locally
    (383 MB, 444 tracked files, no `.gitignore`, no `.vercelignore`) but I have not
    confirmed what Vercel does with it.

---

## Observation for follow-up (not acted on)

Measured, not inferred: `_duplicates/` holds 383 MB across 444 git-tracked files,
and the repo contains neither a `.gitignore` nor a `.vercelignore`. Combined with
`assets/` at 438 MB, the working tree is 821 MB. On a static Vercel deployment the
repo contents *are* the deployed artifact, so this directory is the most likely
lever on deploy size and time — which is the substance of what "build performance"
means for this project. I have not touched it and have not confirmed its
production behaviour. Say the word and I'll investigate properly.
