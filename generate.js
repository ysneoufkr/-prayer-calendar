// generate.js
//
// Fetches the full-year prayer time calendar for a Mawaqit mosque page and
// converts it into a standards-compliant .ics calendar that Apple Calendar
// (or any calendar app) can subscribe to.
//
// How it works:
//   Every Mawaqit mosque page (https://mawaqit.net/en/<slug>) embeds a
//   JavaScript object called `confData` in a <script> tag. That object
//   contains, among other things, a `calendar` array with one entry per
//   month (Jan..Dec), each entry being a map of "day of month" -> an array
//   of 6 time strings: [Fajr, Shuruq, Dhuhr, Asr, Maghrib, Isha].
//   This script downloads the page's HTML, extracts that object with a
//   brace-balancing parser (robust to Mawaqit changing what comes after the
//   calendar in confData), and turns every prayer time into a calendar
//   event for the current year.
//
// Configuration (all optional, via environment variables):
//   MOSQUE_SLUG            - the part of the URL after /en/  (default: IC Barendrecht)
//   MOSQUE_NAME             - display name used in event titles (default: IC Barendrecht)
//   TIMEZONE                - IANA timezone of the mosque (default: Europe/Amsterdam)
//   INCLUDE_SHURUQ          - "true"/"false", include sunrise as an event (default: true)
//   EVENT_DURATION_MINUTES  - length of each calendar event in minutes (default: 20)
//   OUTPUT_PATH             - where to write the .ics file (default: docs/prayers.ics)

import { DateTime } from "luxon";
import fs from "node:fs";
import path from "node:path";

const MOSQUE_SLUG =
  process.env.MOSQUE_SLUG ||
  "islamitisch-centrum-barendrecht-barendrecht-2992-lb-netherlands";
const MOSQUE_NAME = process.env.MOSQUE_NAME || "IC Barendrecht";
const TIMEZONE = process.env.TIMEZONE || "Europe/Amsterdam";
const INCLUDE_SHURUQ = (process.env.INCLUDE_SHURUQ ?? "true").toLowerCase() !== "false";
const EVENT_DURATION_MINUTES = parseInt(process.env.EVENT_DURATION_MINUTES || "20", 10);
const OUTPUT_PATH = process.env.OUTPUT_PATH || path.join("docs", "prayers.ics");

const PRAYER_ORDER = ["fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"];
const PRAYER_LABELS = {
  fajr: "Fajr",
  shuruq: "Shuruq (sunrise)",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

async function fetchMosquePage(slug) {
  const url = `https://mawaqit.net/en/${slug}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en,nl;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch mosque page (${url}): HTTP ${res.status}`);
  }
  return res.text();
}

// Mawaqit embeds:  var confData = { ... };
// We locate the marker, then walk forward counting braces (while respecting
// quoted strings) until the object that opened is balanced. This is more
// robust than matching a fixed trailing string, since it doesn't care what
// comes after `calendar` in the object.
function extractConfData(html) {
  const marker = "var confData = ";
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) {
    throw new Error(
      "Could not find 'confData' in the Mawaqit page. The site markup may " +
        "have changed, or the mosque slug is wrong."
    );
  }

  const jsonStart = startIdx + marker.length;
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let escaped = false;
  let endIdx = -1;

  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) {
    throw new Error("Could not find the end of the confData object.");
  }

  const jsonText = html.slice(jsonStart, endIdx);
  return JSON.parse(jsonText);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function icsEscape(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// RFC 5545 requires lines to be folded at 75 octets.
function foldLine(line) {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;

  let result = "";
  let current = "";
  let currentBytes = 0;

  for (const char of line) {
    const charBytes = Buffer.byteLength(char, "utf8");
    if (currentBytes + charBytes > 75) {
      result += current + "\r\n ";
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  result += current;
  return result;
}

function toUtcStamp(dt) {
  return dt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function buildIcs(events, calName) {
  const nowStamp = toUtcStamp(DateTime.utc());
  const lines = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//ysneoufkr//prayer-calendar//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${icsEscape(calName)}`);
  lines.push(`X-WR-TIMEZONE:${TIMEZONE}`);
  // Hints some clients use to know how often to re-poll the feed.
  lines.push("REFRESH-INTERVAL;VALUE=DURATION:P1D");
  lines.push("X-PUBLISHED-TTL:P1D");

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${ev.dtstart}`);
    lines.push(`DTEND:${ev.dtend}`);
    lines.push(`SUMMARY:${icsEscape(ev.summary)}`);
    lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
    lines.push("TRANSP:TRANSPARENT");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

async function main() {
  console.log(`Fetching prayer times for "${MOSQUE_SLUG}"...`);
  const html = await fetchMosquePage(MOSQUE_SLUG);
  const conf = extractConfData(html);

  if (!conf.calendar || !Array.isArray(conf.calendar)) {
    throw new Error("confData did not contain the expected 'calendar' array.");
  }

  const year = DateTime.now().setZone(TIMEZONE).year;
  const events = [];

  conf.calendar.forEach((monthObj, monthIndex) => {
    const month = monthIndex + 1;

    Object.entries(monthObj).forEach(([dayStr, times]) => {
      const day = parseInt(dayStr, 10);
      if (!Array.isArray(times) || times.length < 6) return;

      const timesByPrayer = {
        fajr: times[0],
        shuruq: times[1],
        dhuhr: times[2],
        asr: times[3],
        maghrib: times[4],
        isha: times[5],
      };

      for (const key of PRAYER_ORDER) {
        if (key === "shuruq" && !INCLUDE_SHURUQ) continue;

        const timeStr = timesByPrayer[key];
        if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) {
          continue;
        }

        const [hh, mm] = timeStr.split(":").map((v) => parseInt(v, 10));
        if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

        const startLocal = DateTime.fromObject(
          { year, month, day, hour: hh, minute: mm },
          { zone: TIMEZONE }
        );
        if (!startLocal.isValid) continue;

        const endLocal = startLocal.plus({ minutes: EVENT_DURATION_MINUTES });
        const uid = `${year}${pad(month)}${pad(day)}-${key}-${MOSQUE_SLUG}@ysneoufkr.github.io`;

        events.push({
          uid,
          dtstart: toUtcStamp(startLocal),
          dtend: toUtcStamp(endLocal),
          summary: `${PRAYER_LABELS[key]} \u2014 ${MOSQUE_NAME}`,
          description: `${PRAYER_LABELS[key]} prayer time at ${MOSQUE_NAME}, generated automatically from Mawaqit.`,
        });
      }
    });
  });

  if (events.length < 1000) {
    console.warn(
      `Warning: only generated ${events.length} events. Expected several ` +
        "thousand for a full year across 5-6 daily prayers. Double-check the " +
        "mosque slug and that confData.calendar has data for every month."
    );
  }

  events.sort((a, b) => (a.dtstart < b.dtstart ? -1 : a.dtstart > b.dtstart ? 1 : 0));

  const ics = buildIcs(events, `${MOSQUE_NAME} \u2014 Prayer Times`);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, ics, "utf8");
  console.log(`Wrote ${events.length} events to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Failed to generate prayer calendar:");
  console.error(err);
  process.exit(1);
});
