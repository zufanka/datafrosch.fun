---
name: update-calendar
description: Publish, update, and archive datafrosch.fun events from the markdown source of truth in docs/events/ (main repo). Runs tools/events/publish.py to regenerate js/events-data.js, the static event pages under events/, their .ics calendar files and the sitemap, and optionally reconciles Discord scheduled events. Trigger on "update the calendar", "refresh events", "add the new event", "update the events page", "archive the pondcast".
allowed-tools: Read, Write, Edit, Bash, Grep, WebFetch
---

# Update Calendar

Events are markdown files in `docs/events/` of the **main repo**
(`/home/ada/Projects/datafrosch`) — that is the single source of truth
(schema: `tools/events/SCHEMA.md`). `tools/events/publish.py` generates
everything this website shows from those files:

- `js/events-data.js` — card data for the events grids,
- `events/<slug>.html` — one static page per event (join link, calendar
  buttons, guest, description) with its calendar file `events/<slug>.ics`,
- sitemap entries for the event pages,
- cover image sync into `img/`.

`js/events-render.js` renders the cards from that data: upcoming cards link
the local event page in the same tab, past cards link the page (with the
YouTube thumbnail when there's a recording), and cards auto-expire once the
event's `end` timestamp passes (Europe/Berlin fallback for older entries).

**Never edit `js/events-data.js` or `events/*` by hand — they are generated.**
Change the markdown, then re-run publish.py.

## Workflow

### 1. Dry-run, review, write

Run from the main repo:

```bash
cd /home/ada/Projects/datafrosch
python3 tools/events/publish.py                 # dry-run (default) — review the plan
python3 tools/events/publish.py --write         # apply: site + Discord reconcile
python3 tools/events/publish.py --site-only --write   # website only, no Discord, no token
python3 tools/events/publish.py --check         # drift check only; exit 1 when stale
```

Review the planned changes (event pages, `.ics`, `js/events-data.js`, sitemap,
image syncs, removals) and any Discord actions before writing. `--site-only`
skips the Discord client entirely — use it when there's no token or Discord
was already handled; `--check` is the CI-friendly no-write drift test.

### 2. Authoring / editing an event

Edit or create `docs/events/<YYYY-MM-DD>-<slug>.md` per `tools/events/SCHEMA.md`:

- `date`/`end` carry the explicit Europe/Berlin offset for that date
  (`+02:00` CEST summer, `+01:00` CET winter — DST ends the last Sunday of
  October). A wrong offset shifts the event by an hour everywhere.
- `end` and `meet` are required for `status: upcoming`.
- `guest:` names the guest (shown as "With …" on the event page).
- Slugs are permanent — the page URL and calendar UID derive from them.
- Not ready? `status: draft` — excluded from the site and Discord until
  flipped to `upcoming`.

Then run the dry-run → review → `--write` flow above.

### 3. Archiving (dates passed)

- **Recorded**: `status: past` + `youtube` (+ `pondcast_nr`). Find the episode
  on `https://datafrosch.fun/resources.html` first and reuse its title, date
  and description verbatim; remind Ada if it's missing there.
- **Unrecorded** (hangouts, recording pending): `status: finished` — the page
  stays as an archive without join/calendar actions. Don't delete the file;
  the archive is the record. Only delete events that never happened (ask Ada).
- **Cancelled**: `status: cancelled` — page and calendar entry stay, marked
  cancelled, no join actions.

Then re-run `python3 tools/events/publish.py --write`.

### 4. Preview and deploy

```bash
cd /home/ada/Projects/datafrosch/website && python3 -m http.server
```

Check `pond.html#upcoming` and `index.html` (cards link the local pages) and
one `events/<slug>.html` page. On plain HTTP the add-to-calendar button uses
its built-in exporter instead of the hosted `.ics` — expected, same entries.
Commit `docs/events/*.md` (main repo) together with the generated
`js/events-data.js`, `events/*`, sitemap and synced images; pushing
auto-deploys GitHub Pages.

## Safety rails

- Never print `DISCORD_BOT_TOKEN`.
- Never hand-edit `js/events-data.js` or `events/*` — generated files.
- Never bypass the dry-run review step.
- Luma is retired — never publish to or link it; old `luma_url` fields are
  history only.
- LinkedIn (via `tools/events/linkedin.py` from the main repo) uses the
  frontmatter text verbatim — nothing invented.

## Reference
- Source of truth: `docs/events/*.md` + `tools/events/SCHEMA.md` (main repo).
- Publisher: `tools/events/publish.py` (main repo).
- Renderer: `js/events-render.js` (`window.DataFroschEvents.renderUpcoming/renderPast`),
  used by `pond.html` and `index.html`.
- Thumbnails: `js/thumbs.js` — recorded-event cards carry an explicit
  `data-thumb` (YouTube thumbnail URL) because their href is the local page.
