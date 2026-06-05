// Shared renderer for event cards, used by events.html (full page) and
// index.html (upcoming preview). Requires js/events-data.js (the EVENTS global)
// to be loaded first. Exposes window.DataFroschEvents.
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
    function byDate(dir) {
        return function (a, b) { return dir * String(a.date).localeCompare(String(b.date)); };
    }

    function upcomingCard(ev) {
        var img = ev.image
            ? '<img src="' + esc(ev.image) + '" alt="' + esc(ev.title) + '" class="w-full h-full object-cover" loading="lazy" />'
            : '<img src="img/logo.png" alt="' + esc(ev.title) + '" class="w-full h-full object-cover" loading="lazy" />';
        var when = fmtDate(ev.date) + (ev.time ? ' · ' + esc(ev.time) : '');
        var links = [];
        if (ev.link) links.push('<a target="_blank" href="' + esc(ev.link) + '" class="text-green-700 font-medium hover:underline">Discord event</a>');
        if (ev.meet) links.push('<a target="_blank" href="' + esc(ev.meet) + '" class="text-green-700 font-medium hover:underline">Join call</a>');
        var linksHtml = links.length
            ? '<p class="text-xs md:text-sm mt-3">' + links.join(' <span class="text-gray-400">·</span> ') + '</p>'
            : '';
        return '<div class="course-card block bg-white rounded-lg shadow-md overflow-hidden">' +
            '<div class="video-container">' + img + '</div>' +
            '<div class="p-4">' +
                '<div class="flex items-center justify-between mb-2">' +
                    '<span class="guide-badge">Upcoming</span>' +
                    '<span class="text-xs event-time">' + when + '</span>' +
                '</div>' +
                '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
                linksHtml +
            '</div>' +
        '</div>';
    }

    function pastCard(ev) {
        // Recorded events link to their Pondcast; thumbs.js fills the YouTube thumbnail.
        return '<a target="_blank" href="' + esc(ev.youtube) + '" class="course-card auto-thumb block bg-white rounded-lg shadow-md overflow-hidden">' +
            '<div class="video-container">' +
                '<img data-thumb-target alt="' + esc(ev.title) + '" class="w-full h-full object-cover" loading="lazy" />' +
                PLAY_BUTTON +
            '</div>' +
            '<div class="p-4">' +
                '<div class="flex items-center justify-between mb-2">' +
                    '<span class="guide-badge">Recording</span>' +
                    '<span class="text-xs text-gray-500">' + fmtDate(ev.date) + '</span>' +
                '</div>' +
                '<h3 class="font-bold text-base md:text-lg mb-2">' + esc(ev.title) + '</h3>' +
                '<p class="opacity-75 text-xs md:text-sm">' + esc(ev.desc) + '</p>' +
            '</div>' +
        '</a>';
    }

    function data() { return (typeof EVENTS !== 'undefined') ? EVENTS : { upcoming: [], past: [] }; }

    window.DataFroschEvents = {
        upcoming: function () { return (data().upcoming || []).slice().sort(byDate(1)); },  // soonest first
        past: function () { return (data().past || []).slice().sort(byDate(-1)); },          // newest first
        renderUpcoming: function (el, opts) {
            if (!el) return [];
            opts = opts || {};
            var list = this.upcoming();
            if (opts.limit) list = list.slice(0, opts.limit);
            el.innerHTML = list.length ? list.map(upcomingCard).join('') : (opts.emptyHtml || '');
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
