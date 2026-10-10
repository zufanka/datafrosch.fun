// Shared renderer for event cards, used by pond.html (full page) and
// index.html (upcoming preview). Requires js/events-data.js (the EVENTS
// global) to be loaded first. Exposes window.DataFroschEvents.
//
// Card data comes in two generations:
//   current — every event carries `url` (its local page, "events/<slug>.html")
//             plus full ISO `start`/`end` timestamps next to the plain
//             date/time/title/desc/image fields, and — supplied by the
//             generator from the same source as the generated .ics — the
//             calendar identity: `uid`, `sequence` and `ics_updated`
//             (see tools/events/event_site.py ics_uid / _ics_dt);
//   legacy  — date/time only. Cards then fall back to the inline link row.
//
// renderUpcoming(opts) accepts an opt-in `calendarActions: true` (pond.html)
// that renders non-anchor cards with an add-to-calendar-button per event,
// mirroring the generated event pages. The default stays whole-card anchors.
(function () {
    var PLAY_BUTTON =
        '<div class="play-button">' +
          '<div class="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">' +
            '<svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">' +
              '<path d="M10 0a10 10 0 1 0 10 10A10 10 0 0 0 10 0zm3.33 10.33l-4.73 2.83a.33.33 0 0 1-.5-.29V7.13a.33.33 0 0 1 .5-.29l4.73 2.83a.33.33 0 0 1 0 .58z"/>' +
            '</svg>' +
          '</div>' +
        '</div>';
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
        });
    }
    function fmtDate(iso) {
        var p = String(iso).split('-');
        if (p.length !== 3) return iso || '';
        return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
    }
    function dateOf(ev) {
        // Plain calendar date; derived from the start timestamp when the
        // legacy `date` field is absent.
        if (ev.date) return String(ev.date);
        if (ev.start) return String(ev.start).slice(0, 10);
        return '';
    }
    function sortKey(ev) {
        // Prefer the precise start instant; fall back to the date string.
        if (ev.start) {
            var ms = Date.parse(ev.start);
            if (!isNaN(ms)) return new Date(ms).toISOString();
        }
        return dateOf(ev);
    }
    function byStart(dir) {
        return function (a, b) {
            var ka = sortKey(a), kb = sortKey(b);
            return dir * (ka < kb ? -1 : ka > kb ? 1 : 0);
        };
    }
    function berlinToday() {
        // "Today" in Europe/Berlin — the timezone the site publishes event
        // times in — rather than the visitor's local timezone.
        try {
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })
                .format(new Date());
        } catch (e) { /* pre-Intl browsers: best effort below */ }
        var t = new Date();
        return t.getFullYear() + '-' +
            String(t.getMonth() + 1).padStart(2, '0') + '-' +
            String(t.getDate()).padStart(2, '0');
    }
    function hasEnded(ev) {
        // An event is over once its scheduled end instant has passed — true
        // even if the page loads years later. Entries without an `end`
        // (legacy data) fall back to the Europe/Berlin calendar date.
        if (ev.end) {
            var ms = Date.parse(ev.end);
            if (!isNaN(ms)) return ms <= Date.now();
        }
        return dateOf(ev) < berlinToday();
    }
    function ytThumbUrl(url) {
        var m = String(url || '').match(/[?&]v=([^&]+)/) ||
                String(url || '').match(/youtu\.be\/([^?]+)/);
        return m ? 'https://img.youtube.com/vi/' + m[1] + '/maxresdefault.jpg' : '';
    }
    function cardImage(ev) {
        var src = ev.image || 'img/logo.png';
        return '<img src="' + esc(src) + '" alt="' + esc(ev.title) + '" class="w-full h-full object-cover" loading="lazy" />';
    }

    // --- opt-in calendar cards (pond.html) -------------------------------
    // Attribute conventions follow tools/events/event_site.py so a card
    // button produces the same event as the generated event page + .ics.
    // The identity fields (uid, sequence, ics-updated) come precomputed in
    // the data; entries without them are legacy and get plain anchor cards.

    var SITE_URL = 'https://datafrosch.fun';

    function slugOf(ev) {
        var m = String(ev.url || '').match(/^events\/([^\/]+)\.html$/);
        return m ? m[1] : '';
    }

    function berlinParts(iso) {
        // Wall-clock date/time in Europe/Berlin — the timezone event pages
        // publish in. Always converts via Intl so any input offset is
        // handled; the raw-ISO fallback below only runs where Intl is
        // unavailable and then trusts the authored wall-clock fields
        // (best-effort — inputs are not guaranteed to be Berlin-offset).
        var ms = Date.parse(iso);
        if (!isNaN(ms)) {
            try {
                var p = {};
                new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit',
                    day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                }).formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
                var hour = p.hour === '24' ? '00' : p.hour;
                if (p.year && p.month && p.day && hour && p.minute) {
                    return { date: p.year + '-' + p.month + '-' + p.day, time: hour + ':' + p.minute };
                }
            } catch (e) { /* no Intl: fall through */ }
        }
        var s = String(iso);
        return { date: s.slice(0, 10), time: s.slice(11, 16) };
    }

    function icsHref(slug) {
        // Hosted .ics files must be HTTPS for the calendar component (same
        // rule as js/event-page.js): production keeps the canonical absolute
        // URL, other HTTPS origins point at their co-deployed copy, and plain
        // HTTP/file previews drop the attribute so the component generates
        // the ICS client-side instead.
        if (typeof location === 'undefined') return SITE_URL + '/events/' + slug + '.ics';
        if (location.protocol === 'https:') {
            if (location.hostname === 'datafrosch.fun') return SITE_URL + '/events/' + slug + '.ics';
            return new URL('events/' + slug + '.ics', location.href).href;
        }
        return '';
    }

    function calendarCard(ev) {
        var slug = slugOf(ev);
        var when = fmtDate(dateOf(ev)) + (ev.time ? ' · ' + esc(ev.time) : '');
        var start = berlinParts(ev.start);
        var end = berlinParts(ev.end);
        var pageUrl = SITE_URL + '/' + ev.url;
        // atcb-flavored description, matching the generated event pages.
        var desc = [esc(ev.desc)];
        if (ev.meet) desc.push('[br]Join the call: [url]' + esc(ev.meet) + '[/url]');
        desc.push('[br]Event page: [url]' + esc(pageUrl) + '[/url]');
        var icsFile = icsHref(slug);
        var uid = ev.uid;
        return '<article class="course-card event-card--calendar bg-white rounded-lg shadow-md overflow-hidden">' +
            '<a href="' + esc(ev.url) + '" class="block">' +
                '<div class="video-container">' + cardImage(ev) + '</div>' +
            '</a>' +
            '<div class="p-4">' +
                '<div class="flex items-center justify-between gap-2 mb-2">' +
                    '<span class="text-xs event-time">' + when + '</span>' +
                    (ev.meet ? '<span class="event-free-badge">Free · Online</span>' : '') +
                '</div>' +
                '<h3 class="font-bold text-base md:text-lg mb-2 event-card-title"><a href="' + esc(ev.url) + '">' + esc(ev.title) + '</a></h3>' +
                '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                '<div class="event-card-actions">' +
                    '<add-to-calendar-button' +
                    ' name="' + esc(ev.title) + '"' +
                    ' description="' + desc.join(' ') + '"' +
                    ' start-date="' + start.date + '"' +
                    ' start-time="' + start.time + '"' +
                    ' end-date="' + end.date + '"' +
                    ' end-time="' + end.time + '"' +
                    ' time-zone="Europe/Berlin"' +
                    (ev.meet ? ' location="' + esc(ev.meet) + '"' : '') +
                    ' options="[\'apple\',\'google\',\'ical\',\'ms365\',\'outlookcom\']"' +
                    (icsFile ? ' ics-file="' + esc(icsFile) + '"' : '') +
                    ' uid="' + esc(uid) + '"' +
                    (ev.sequence != null ? ' sequence="' + esc(String(ev.sequence)) + '"' : '') +
                    (ev.ics_updated ? ' ics-updated="' + esc(ev.ics_updated) + '"' : '') +
                    ' ics-url="' + esc(pageUrl) + '"' +
                    ' ical-file-name="' + esc(slug) + '"' +
                    ' ics-reminder="15"' +
                    ' trigger="click"' +
                    ' list-style="modal"' +
                    ' size="4"' +
                    ' hide-rich-data' +
                    ' hide-checkmark' +
                    ' past-date-handling="disable"' +
                    ' style-light="--btn-background: #ffffff; --btn-text: #476332; --btn-border: #dfe7d9; --font: \'Nunito\', sans-serif;"' +
                    '></add-to-calendar-button>' +
                    '<a href="' + esc(ev.url) + '" class="event-card-details-link">Details →</a>' +
                    '<a href="events/' + esc(slug) + '.ics" class="event-card-ics-link">Download .ics</a>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    function upcomingCard(ev, opts) {
        var when = fmtDate(dateOf(ev)) + (ev.time ? ' · ' + esc(ev.time) : '');
        // Opt-in (pond.html): cards with an interactive calendar button are
        // never whole-card anchors — nested interactive controls inside an
        // anchor are unreachable from the keyboard. Requires the generator-
        // supplied calendar identity (`uid`, plus sequence/ics_updated when
        // present); legacy data without it falls back to the plain anchor card.
        if (opts && opts.calendarActions && ev.url && ev.start && ev.end && ev.uid && slugOf(ev)) {
            return calendarCard(ev);
        }
        // The whole card links to the event's local page, in the same tab.
        // The page carries the join link, calendar buttons and guest info —
        // no nested anchors inside the card.
        if (ev.url) {
            return '<a href="' + esc(ev.url) + '" class="course-card block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">' +
                '<div class="video-container">' + cardImage(ev) + '</div>' +
                '<div class="p-4">' +
                    '<div class="flex items-center mb-2">' +
                        '<span class="text-xs event-time">' + when + '</span>' +
                    '</div>' +
                    '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                    '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                    '<p class="text-xs md:text-sm mt-3"><span class="text-green-700 font-medium">Event details →</span></p>' +
                '</div>' +
            '</a>';
        }
        // Legacy entry without a local page: inline link row.
        var links = [];
        if (ev.link) links.push('<a target="_blank" href="' + esc(ev.link) + '" class="text-green-700 font-medium hover:underline">Discord event</a>');
        if (ev.meet) links.push('<a target="_blank" href="' + esc(ev.meet) + '" class="text-green-700 font-medium hover:underline">Join call</a>');
        return '<div class="course-card block bg-white rounded-lg shadow-md overflow-hidden">' +
            '<div class="video-container">' + cardImage(ev) + '</div>' +
            '<div class="p-4">' +
                '<div class="flex items-center mb-2">' +
                    '<span class="text-xs event-time">' + when + '</span>' +
                '</div>' +
                '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                (links.length
                    ? '<p class="text-xs md:text-sm mt-3">' + links.join(' <span class="text-gray-400">·</span> ') + '</p>'
                    : '') +
            '</div>' +
        '</div>';
    }

    function pastCard(ev) {
        // Recorded events link to their local page. thumbs.js resolves the
        // YouTube thumbnail from the card's data-thumb attribute — the href
        // is local, so it can't derive it from the link itself.
        if (ev.url) {
            var open = '<a href="' + esc(ev.url) + '" class="course-card auto-thumb block bg-white rounded-lg shadow-md overflow-hidden"';
            var thumb = ytThumbUrl(ev.youtube);
            if (thumb) open += ' data-thumb="' + esc(thumb) + '"';
            open += '>';
            if (ev.youtube) {
                return open +
                    '<div class="video-container">' +
                        '<img data-thumb-target alt="' + esc(ev.title) + '" class="w-full h-full object-cover" loading="lazy" />' +
                        PLAY_BUTTON +
                    '</div>' +
                    '<div class="p-4">' +
                        '<div class="flex items-center justify-between mb-2">' +
                            '<span class="guide-badge">Video</span>' +
                            '<span class="text-xs text-gray-500">' + fmtDate(dateOf(ev)) + '</span>' +
                        '</div>' +
                        '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                        '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                    '</div>' +
                '</a>';
            }
            // No recording (yet): plain event card, still linking to the page.
            return open +
                '<div class="video-container">' + cardImage(ev) + '</div>' +
                '<div class="p-4">' +
                    '<div class="flex items-center justify-between mb-2">' +
                        '<span class="guide-badge">Event</span>' +
                        '<span class="text-xs text-gray-500">' + fmtDate(dateOf(ev)) + '</span>' +
                    '</div>' +
                    '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                    '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                '</div>' +
            '</a>';
        }
        // Legacy entry: link the recording directly; thumbs.js reads the
        // YouTube URL from the href. Without a recording, a plain card.
        if (!ev.youtube) {
            return '<div class="course-card block bg-white rounded-lg shadow-md overflow-hidden">' +
                '<div class="video-container">' + cardImage(ev) + '</div>' +
                '<div class="p-4">' +
                    '<div class="flex items-center justify-between mb-2">' +
                        '<span class="guide-badge">Event</span>' +
                        '<span class="text-xs text-gray-500">' + fmtDate(dateOf(ev)) + '</span>' +
                    '</div>' +
                    '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                    '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                '</div>' +
            '</div>';
        }
        return '<a target="_blank" href="' + esc(ev.youtube) + '" class="course-card auto-thumb block bg-white rounded-lg shadow-md overflow-hidden">' +
            '<div class="video-container">' +
                '<img data-thumb-target alt="' + esc(ev.title) + '" class="w-full h-full object-cover" loading="lazy" />' +
                PLAY_BUTTON +
            '</div>' +
            '<div class="p-4">' +
                '<div class="flex items-center justify-between mb-2">' +
                    '<span class="guide-badge">Video</span>' +
                    '<span class="text-xs text-gray-500">' + fmtDate(dateOf(ev)) + '</span>' +
                '</div>' +
                '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
            '</div>' +
        '</a>';
    }

    function data() { return (typeof EVENTS !== 'undefined') ? EVENTS : { upcoming: [], past: [] }; }

    window.DataFroschEvents = {
        upcoming: function () {
            // Auto-hide events once their scheduled end instant has passed.
            return (data().upcoming || [])
                .filter(function (ev) { return !hasEnded(ev); })
                .sort(byStart(1));  // soonest first
        },
        past: function () {
            // Past events from the data file, plus upcoming ones whose end
            // instant has now passed (they show here until re-published
            // with status past/finished).
            var expired = (data().upcoming || []).filter(hasEnded);
            return (data().past || []).concat(expired).sort(byStart(-1));  // newest first
        },
        // Static heading — no month rewriting, so it never goes stale.
        updateMonthTitles: function () {
            var els = document.querySelectorAll('.events-month-title');
            for (var i = 0; i < els.length; i++) els[i].textContent = 'Upcoming events';
        },
        renderUpcoming: function (el, opts) {
            if (!el) return [];
            opts = opts || {};
            var list = this.upcoming();
            if (opts.limit) list = list.slice(0, opts.limit);
            el.innerHTML = list.length
                ? list.map(function (ev) { return upcomingCard(ev, opts); }).join('')
                : (opts.emptyHtml || '');
            try { this.updateMonthTitles(); } catch (e) { /* heading stays as-is */ }
            return list;
        },
        renderPast: function (el) {
            if (!el) return [];
            var list = this.past();
            el.innerHTML = list.map(pastCard).join('');
            return list;
        }
    };
})();
