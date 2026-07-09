# IC Barendrecht — Prayer Times Calendar (Mawaqit → Apple Calendar)

Automatically publishes the daily prayer times for **Islamitisch Centrum
Barendrecht (IC Barendrecht)** — sourced live from
[Mawaqit](https://mawaqit.net/en/islamitisch-centrum-barendrecht-barendrecht-2992-lb-netherlands) —
as a `.ics` subscription calendar you add **once** to Apple Calendar. It then
updates itself forever.

Final subscription URL (once set up):

```
https://ysneoufkr.github.io/-prayer-calendar/prayers.ics
```

## How it works

1. `generate.js` downloads the Mawaqit mosque page and extracts the
   `confData` JSON object that Mawaqit embeds in every mosque page. That
   object contains the **full year's calendar** (Fajr, Shuruq, Dhuhr, Asr,
   Maghrib, Isha) — not a PDF, not 24 entries — a proper machine-readable
   dataset with 2000+ entries for the year.
2. It converts every prayer time into a timezone-correct calendar event
   (`Europe/Amsterdam`, DST-aware) and writes a standards-compliant
   `docs/prayers.ics` file.
3. A GitHub Actions workflow (`.github/workflows/update.yml`) runs this
   script **every day automatically** and commits the refreshed file.
4. GitHub Pages serves `docs/prayers.ics` at a stable public URL.
5. Apple Calendar subscribes to that URL once, and re-fetches it
   periodically forever — no manual updates ever needed again.

## Repository structure

```
-prayer-calendar/
├── package.json
├── generate.js
├── .gitignore
├── README.md
├── .github/
│   └── workflows/
│       └── update.yml
└── docs/
    ├── index.html
    └── prayers.ics
```

---

## Part 1 — Create the repository (phone only, no computer needed)

You said you only have your phone. Here's the easiest way to do all of this
using **Safari or Chrome on your phone**, no GitHub app or desktop required.

### 1. Create the repo (skip if `-prayer-calendar` already exists)

1. Go to **github.com** → log in.
2. Tap the **+** icon (top right) → **New repository**.
3. Repository name: `-prayer-calendar`
4. Set it to **Public** (required for free GitHub Pages).
5. Tap **Create repository**.

### 2. Add each file using "Create new file"

You don't need to upload a ZIP. On mobile, the simplest reliable method is:

1. Open your repo → tap **Add file** → **Create new file**.
2. In the **file name field**, you can type a full path with slashes, e.g.
   `.github/workflows/update.yml` — GitHub will automatically create the
   folders for you.
3. Paste the file content (from the sections below) into the big text box.
4. Scroll down → tap **Commit changes...** → **Commit directly to the `main`
   branch** → **Commit changes**.
5. Repeat for every file:
   - `package.json`
   - `generate.js`
   - `.gitignore`
   - `.github/workflows/update.yml`
   - `docs/index.html`
   - `docs/prayers.ics`
   - `README.md`

That's it — 7 short copy/paste steps, no file manager, no ZIP extraction.

> Tip: if typing/pasting is easier in landscape mode with the desktop site
> toggle enabled in your mobile browser, use that — GitHub's editor is
> friendlier that way, but it works fine in normal mobile mode too.

---

## Part 2 — Enable GitHub Pages

1. In your repo, tap **Settings** (you may need to tap the **☰** menu if the
   tab bar is collapsed on mobile).
2. Scroll to **Pages** (left sidebar, or in the "Code and automation"
   section).
3. Under **Build and deployment** → **Source**: choose **Deploy from a
   branch**.
4. **Branch**: `main`, folder: **`/docs`** → **Save**.
5. GitHub will show the live URL after a minute — it should be:
   `https://ysneoufkr.github.io/-prayer-calendar/`

---

## Part 3 — Allow the workflow to commit updates

By default, GitHub Actions can't push commits. Turn that on once:

1. **Settings** → **Actions** → **General**.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Tap **Save**.

---

## Part 4 — Run it for the first time

1. Go to the **Actions** tab in your repo.
2. Tap **Update prayer calendar** in the left list (you may need to accept a
   one-time "I understand my workflows, go ahead and enable them" prompt the
   first time you open Actions on a new repo).
3. Tap **Run workflow** → **Run workflow** (green button).
4. Wait ~30–60 seconds, refresh — you should see a green checkmark.
5. Open `docs/prayers.ics` in the repo (or visit
   `https://ysneoufkr.github.io/-prayer-calendar/prayers.ics` directly) to
   confirm it's now full of real events instead of the placeholder.

After this, it re-runs **automatically every day at 01:00 UTC** — you never
have to touch it again. You can also trigger it manually any time from the
Actions tab.

---

## Part 5 — Subscribe from Apple Calendar (iPhone)

**Easiest way:**
1. Open Safari on your iPhone.
2. Go to `https://ysneoufkr.github.io/-prayer-calendar/`
3. Tap **📅 Subscribe in Apple Calendar**.
4. iOS will open the **Calendar app's "Add Subscription"** screen
   automatically → tap **Subscribe** (top right) → **Add** → **Done**.

**Manual way (if the button doesn't trigger the prompt):**
1. Open the **Settings** app → **Calendar** → **Accounts**.
2. Tap **Add Account** → **Other**.
3. Tap **Add Subscribed Calendar**.
4. Server field, enter:
   ```
   https://ysneoufkr.github.io/-prayer-calendar/prayers.ics
   ```
5. Tap **Next** → **Save**.

Apple Calendar will periodically re-fetch this URL on its own (iOS decides
the exact refresh interval, typically every few hours to once a day), so as
the daily GitHub Action updates `prayers.ics`, your calendar stays current
automatically.

---

## Configuration

`generate.js` reads these environment variables (already set correctly in
`update.yml`, only change them if you want to reuse this repo for a
different mosque):

| Variable | Default | Meaning |
|---|---|---|
| `MOSQUE_SLUG` | `islamitisch-centrum-barendrecht-barendrecht-2992-lb-netherlands` | The part of the URL after `mawaqit.net/en/` |
| `MOSQUE_NAME` | `IC Barendrecht` | Used in event titles |
| `TIMEZONE` | `Europe/Amsterdam` | IANA timezone, DST-aware |
| `INCLUDE_SHURUQ` | `true` | Set to `false` to omit sunrise events |
| `EVENT_DURATION_MINUTES` | `20` | Length of each calendar event |

## Running locally (optional, needs Node.js 18+)

```bash
npm install
npm run generate
```

This writes `docs/prayers.ics`. Not required for normal use — GitHub Actions
does this for you daily.

## Troubleshooting

- **"Warning: only generated N events"** in the Action log — Mawaqit's page
  markup may have changed, or the mosque slug is wrong. Check the log output
  and verify the mosque page still loads at
  `https://mawaqit.net/en/islamitisch-centrum-barendrecht-barendrecht-2992-lb-netherlands`.
- **Pages URL 404s** — double check Settings → Pages is set to branch `main`,
  folder `/docs`, and that `docs/prayers.ics` exists in the repo.
- **Workflow can't push ("Permission denied")** — redo Part 3 (Read and
  write permissions for Actions).
- **Calendar not updating on iPhone** — subscriptions are refreshed on
  Apple's own schedule, not instantly. You can force it in the Calendar app:
  pull down on the calendar list to refresh, or remove and re-add the
  subscription.
