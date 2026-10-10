// Shared renderer for event cards, used by pond.html (full page) and
// index.html (upcoming preview). Requires js/events-data.js (the EVENTS
// global) to be loaded first. Exposes window.DataFroschEvents.
//
// Card data comes in two generations:
//   current — every event carries `url` (its local page, "events/<slug>.html")
//             plus full ISO `start`/`end` timestamps next to the plain
//             date/time/title/desc/image fields;
//   legacy  — date/time only. Cards then fall back to the inline link row.
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

    function upcomingCard(ev) {
        var when = fmtDate(dateOf(ev)) + (ev.time ? ' · ' + esc(ev.time) : '');
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
            el.innerHTML = list.length ? list.map(upcomingCard).join('') : (opts.emptyHtml || '');
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
