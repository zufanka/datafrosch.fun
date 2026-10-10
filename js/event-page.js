/* Client-side lifecycle + preview logic for generated event pages
   (website/events/*.html). Loaded with defer. */
(function () {
    'use strict';

    var PRODUCTION_HOST = 'datafrosch.fun';

    // Hosted ICS files require HTTPS in the calendar component. On the
    // production origin we keep the generated absolute URL; on another HTTPS
    // origin we point at the co-deployed .ics; on plain HTTP/file previews we
    // drop the attribute so the component falls back to its built-in
    // browser-side ICS export.
    function setupCalendarButton() {
        var button = document.querySelector('add-to-calendar-button');
        if (!button) return;
        if (location.protocol === 'https:') {
            var relative = button.getAttribute('data-ics-file');
            if (relative && location.hostname !== PRODUCTION_HOST) {
                button.setAttribute('ics-file', new URL(relative, location.href).href);
            }
        } else {
            button.removeAttribute('ics-file');
        }
    }

    // Hide join/calendar/download actions once the event's end instant has
    // passed — whenever the page happens to be loaded — and show the finished
    // state instead. Generation stays wall-clock independent; this only runs
    // in the visitor's browser.
    function applyLifecycle() {
        var actions = document.querySelector('[data-event-actions]');
        if (!actions) return;
        var endAttr = actions.getAttribute('data-event-end');
        if (!endAttr) return;
        var end = Date.parse(endAttr);
        if (isNaN(end) || Date.now() < end) return;
        actions.hidden = true;
        var reminder = document.querySelector('[data-event-reminder]');
        if (reminder) reminder.hidden = true;
        var finished = document.querySelector('[data-event-finished]');
        if (finished) finished.hidden = false;
        var heading = document.querySelector('[data-ended-heading]');
        if (heading) heading.textContent = heading.getAttribute('data-ended-heading');
    }

    function init() {
        setupCalendarButton();
        applyLifecycle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
