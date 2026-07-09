# 🕌 IC Barendrecht — Prayer Times Calendar

Automatically publishes daily prayer times for **Islamitisch Centrum Barendrecht**, sourced live from [Mawaqit](https://mawaqit.net/en/islamitisch-centrum-barendrecht-barendrecht-2992-lb-netherlands), as a self-updating `.ics` calendar subscription.

Subscribe once — Fajr, Shuruq, Dhuhr, Asr, Maghrib, and Isha appear on your calendar every day, forever, with zero manual maintenance.

**Subscribe now:**

```
https://ysneoufkr.github.io/-prayer-calendar/prayers.ics
```

---

## Features

- 🔄 **Fully automated** — a GitHub Actions workflow refreshes the calendar daily at 01:00 UTC
- 📅 **Full year coverage** — pulls Mawaqit's complete annual prayer schedule, not just today
- 🌍 **DST-aware** — all times are timezone-correct for `Europe/Amsterdam`
- 📱 **One-time setup** — subscribe once in Apple Calendar (or Google Calendar / Outlook) and it stays current
- ⚙️ **Configurable** — reusable for any Mawaqit-listed mosque via environment variables

---

## How It Works

```
Mawaqit mosque page  →  generate.js  →  docs/prayers.ics  →  GitHub Pages  →  your calendar app
```

1. **`generate.js`** fetches the mosque's Mawaqit page and extracts the embedded `confData` JSON — a full year of real prayer time data (2,000+ entries), not scraped text.
2. Each entry is converted into a timezone-correct calendar event and written to `docs/prayers.ics` in standard iCalendar format.
3. A **GitHub Actions** workflow (`.github/workflows/update.yml`) runs this daily and commits the refreshed file.
4. **GitHub Pages** serves `docs/prayers.ics` at a stable, public URL.
5. Your calendar app subscribes once and re-fetches the URL periodically — no manual updates, ever.

---

## Repository Structure

```
-prayer-calendar/
├── generate.js                 # Fetches Mawaqit data, builds the .ics file
├── package.json
├── .gitignore
├── README.md
├── .github/
│   └── workflows/
│       └── update.yml          # Daily automation
└── docs/
    ├── index.html               # Landing page with subscribe button
    └── prayers.ics              # Generated calendar (served via GitHub Pages)
```

---

## Setup

### 1. Enable GitHub Pages
**Settings → Pages → Build and deployment**
- Source: `Deploy from a branch`
- Branch: `main` / folder: `/docs`

### 2. Allow the workflow to commit
**Settings → Actions → General → Workflow permissions**
- Select `Read and write permissions` → **Save**

### 3. Run it once
**Actions tab → Update prayer calendar → Run workflow**

After the first successful run, it repeats automatically every day at 01:00 UTC. You can always trigger it manually from the Actions tab.

### 4. Subscribe

**iPhone (Apple Calendar) — easiest:**
Open `https://ysneoufkr.github.io/-prayer-calendar/` in Safari → tap **📅 Subscribe in Apple Calendar**.

**Manual (any device):**
Add a subscribed calendar using this URL:
```
https://ysneoufkr.github.io/-prayer-calendar/prayers.ics
```

---

## Configuration

Set these as environment variables in `.github/workflows/update.yml` to reuse this project for a different mosque:

| Variable | Default | Description |
|---|---|---|
| `MOSQUE_SLUG` | `islamitisch-centrum-barendrecht-barendrecht-2992-lb-netherlands` | The mosque's slug from its Mawaqit URL |
| `MOSQUE_NAME` | `IC Barendrecht` | Used in event titles |
| `TIMEZONE` | `Europe/Amsterdam` | IANA timezone, DST-aware |
| `INCLUDE_SHURUQ` | `true` | Set to `false` to omit sunrise events |
| `EVENT_DURATION_MINUTES` | `20` | Length of each calendar event, in minutes |

## Running Locally

Requires Node.js 18+.

```bash
npm install
npm run generate
```

This writes `docs/prayers.ics`. Not required for normal use — the GitHub Action handles this daily.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Calendar subscribes but shows no events | The `.ics` file is still the placeholder because the workflow hasn't run successfully | Check the **Actions** tab for a failed run; see the error and re-run |
| `"only generated N events"` warning in logs | Mawaqit's page markup changed, or the mosque slug is wrong | Verify the mosque page still loads and `confData` is present |
| Pages URL 404s | GitHub Pages isn't configured correctly | Confirm Settings → Pages is set to branch `main`, folder `/docs` |
| Workflow fails with a "Permission denied" push error | Actions doesn't have write access | Settings → Actions → General → enable "Read and write permissions" |
| Calendar not updating on iPhone | Apple refreshes subscriptions on its own schedule, not instantly | Pull down to refresh in the Calendar app, or remove and re-add the subscription |

---

## License

No license specified — all rights reserved by the repository owner unless otherwise noted.
