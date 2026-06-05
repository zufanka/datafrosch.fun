---
name: update-calendar
description: Update the datafrosch.fun Events page from Discord. Use when Ada wants to refresh the events calendar, publish upcoming Pond events, or archive a past event with its Pondcast recording. Reads the live Discord scheduled events with the chrome-devtools MCP tools, downloads their cover images, and rewrites js/events-data.js. Trigger on "update the calendar", "refresh events", "add the new events", "update the events page".
allowed-tools: mcp__chrome-devtools__*, WebFetch, Read, Write, Edit, Bash
---

# Update Calendar

Refresh the **Events page** (`/events.html`) on datafrosch.fun from the Pond's Discord.
The page renders from `js/events-data.js` (via the shared renderer `js/events-render.js`),
which has two lists:

- `EVENTS.upcoming` — events still to come (pulled from Discord's Events view).
- `EVENTS.past` — recorded events, i.e. the numbered **Pondcasts**, each linking its
  YouTube episode (thumbnail auto-resolved by `js/thumbs.js`).

`js/events-data.js` drives **two places**, so one update refreshes both:
- the full **Events page** (`events.html`) — all upcoming + all past, and
- the homepage **Upcoming Events** preview (`index.html`, `#home-upcoming-grid`) — the
  3 soonest upcoming events only.

This skill owns `js/events-data.js` end to end: it rewrites `upcoming` from Discord and
moves events whose date has passed into `past` with the matching Pondcast link.

> **Why scrape, not store?** Discord scheduled events are **ephemeral** — they disappear
> from the Events view the moment their date passes. So we capture them while upcoming and
> persist them here; they can never be re-fetched later.

## Workflow

### 1. Read the current data
Read `js/events-data.js` so you know what's already listed (don't duplicate, and so you can
detect which previously-upcoming events have now passed). Today's date is your cutoff.

### 2. Fetch upcoming events from Discord
Use the chrome-devtools MCP tools (same access pattern as the `newsletter` command).

1. `navigate_page` to the Pond general channel:
   `https://discord.com/channels/1406642598646513858/1406642600399867907`
2. **Open the Events modal.** The sidebar has an "N Events" button, but Discord intercepts
   synthetic clicks — `mcp__chrome-devtools__click` on it **times out**. Instead open it with
   a real DOM click via `evaluate_script`:
   ```js
   () => {
     const el = [...document.querySelectorAll('*')]
       .filter(e => /^\d+ Events$/.test((e.textContent || '').trim()) && e.children.length <= 3)
       .pop();
     if (!el) return { found: false };
     el.click();
     return { found: true };
   }
   ```
   (The `/api/v9/guilds/.../scheduled-events` REST route returns **401** here — the web
   session cookie isn't enough without the auth-token header — so read the modal DOM, don't
   call the API.)
3. **Read the event details** from the open modal with `evaluate_script`:
   ```js
   () => (document.querySelector('[role="dialog"]') || document.body).innerText
   ```
   This yields every event's **title**, **date** (e.g. "Wed Jun 24th"), **start time**
   (convert to `HH:MM CET`), **description**, and its **Google Meet** link. Recurring events
   show "Repeats monthly on …" and a series list — use the **next** occurrence's date.
   Ada's `@everyone` announcement in the channel also lists the
   `https://discord.com/events/1406642598646513858/<event-id>` links — grab those as the
   `link` field (or read them from each event's "Copy Link").
4. **Get the cover-image URLs.** They are CSS backgrounds, not `<img>`, so collect them with
   `evaluate_script`:
   ```js
   () => {
     const urls = new Set();
     for (const el of document.querySelectorAll('*')) {
       const m = getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/);
       if (m && /guild-events/.test(m[1])) urls.add(m[1]);  // .../guild-events/<event-id>/<hash>
     }
     return [...urls];
   }
   ```
   Each URL's `<event-id>` ties the image back to its event.

**Login / browser gotchas (same as the newsletter command):**
- If Discord shows a login page, ask Ada to log in first, then retry.
- If chrome-devtools errors with *"browser is already running for … chrome-profile"*, ask
  Ada to close her open Chrome window (or open the events tab herself), then retry.

### 3. Download cover images
Discord cover images live on `cdn.discordapp.com/guild-events/...` and can rotate/expire —
never reference them directly. Download each into the repo, requesting a sized **PNG**
(append `.png` + `?size=1024`; the bare URL has no extension):

```bash
curl -sL "https://cdn.discordapp.com/guild-events/<event-id>/<hash>.png?size=1024" \
  -o "img/events/<slug>.png"
```

Pick a short kebab-case `<slug>` from the event title (e.g. `how-to-code-anything`). Verify
with `file img/events/*.png` (should be real PNGs, ~1280×… — not a tiny error page). If an
event has no cover image, omit the `image` field — the card falls back to the logo.

### 4. Rewrite `EVENTS.upcoming`
Replace the `upcoming` array in `js/events-data.js` with the events you just fetched, each:

```js
{ date: "YYYY-MM-DD", time: "16:30 CET", title: "...", desc: "...",
  image: "img/events/<slug>.png",
  link: "https://discord.com/events/1406642598646513858/<event-id>",  // Discord event (RSVP)
  meet: "https://meet.google.com/..." }                               // the call link
```

Both `link` and `meet` render as the card's "Discord event · Join call" text links; either is
optional. Keep descriptions tight and in Ada's voice. The page sorts by date, so order doesn't
matter.

### 5. Auto-archive passed events
For every event that was previously in `upcoming` (from step 1) whose `date` is now **before
today**, move it into `EVENTS.past`. Most training sessions become a numbered Pondcast — find
its recording and attach the YouTube link:

1. **Look in `resources.html` first** (canonical, curated):
   `WebFetch https://datafrosch.fun/resources.html`. Find the `data-type="video"` card whose
   Pondcast number / title matches the event. **Reuse its YouTube URL, date, title and
   description verbatim** so the two pages stay consistent.
2. **Fallback to the channel** only if it isn't on `resources.html` yet: `navigate_page` to
   `https://www.youtube.com/@datafrosch` and find the matching recent video. If you use this
   fallback, **remind Ada to also add the episode to `resources.html`** (it's missing there).
3. Add the past entry as:
   ```js
   { date: "YYYY-MM-DD", title: "Pondcast #N: ...", desc: "...",
     youtube: "https://www.youtube.com/watch?v=..." }
   ```
   No `image` field — `js/thumbs.js` derives the YouTube thumbnail automatically.

If a passed event has **no** recording (e.g. an informal hangout), ask Ada whether to drop it
or keep it in `past` without a `youtube` link. Don't invent a link.

### 6. Report and hand off
Summarize what changed: events added to `upcoming`, images downloaded, events archived (with
which Pondcast), and any reminders (e.g. "Pondcast #6 isn't on resources.html yet"). Then tell
Ada to:
1. Preview locally — `python3 -m http.server` in the repo root, open `/events.html` **and**
   `/index.html` (the homepage shows the 3 soonest events from the same data).
2. Commit and push (GitHub Pages auto-deploys; new files include `img/events/*`).

## Reference
- Data: `js/events-data.js` (the `EVENTS` object — the only file you normally edit).
- Shared renderer: `js/events-render.js` (`window.DataFroschEvents.renderUpcoming/renderPast`),
  used by both `events.html` (full) and `index.html` (`#home-upcoming-grid`, 3 soonest).
- Thumbnails: `js/thumbs.js` resolves YouTube thumbnails for `past` cards. It already handles
  the case where `maxresdefault.jpg` is missing (YouTube serves a 120×90 grey placeholder
  with HTTP 200) by downgrading to `hqdefault` — so a recorded event only needs its `youtube`
  URL, no image.
- Discord access pattern mirrors the marketing repo's `newsletter` command
  (`.claude/commands/newsletter.md`), which uses the same server/channel IDs.
- Pond Discord server ID: `1406642598646513858`; general channel: `1406642600399867907`.
