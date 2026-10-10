/* Inline newsletter signup for The Pond (pond.html).
   Posts to the homolova.sk subscribe API — the same double opt-in flow as
   homolova.sk/newsletter — for The Pond only, never "Hi! It's Ada".
   No secrets client-side; the API key lives on the Vercel function. */
(function () {
    'use strict';

    var ENDPOINT = 'https://homolova-sk.vercel.app/api/subscribe';
    var EXTERNAL_SIGNUP = 'https://homolova.sk/newsletter';

    var form = document.getElementById('pond-subscribe-form');
    if (!form) return;
    var input = document.getElementById('pond-email');
    var honeypot = document.getElementById('pond-website');
    var button = form.querySelector('button[type="submit"]');
    var status = document.getElementById('pond-subscribe-status');
    if (!input || !button || !status) return;

    // The controls ship hidden and only appear once this script runs: with
    // JavaScript unavailable there is no endpoint to submit to (and a native
    // GET would leak the typed email in the URL), so the noscript note in
    // the markup carries the fallback instead of a live-looking form.
    var row = document.getElementById('pond-subscribe-row');
    var note = document.getElementById('pond-subscribe-note');
    if (row) row.hidden = false;
    if (note) note.hidden = false;

    // Same pattern the API validates with.
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setStatus(kind, html) {
        status.className = 'pond-subscribe-status' + (kind ? ' is-' + kind : '');
        status.innerHTML = html;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Guard against duplicate requests (double-clicks, Enter twice).
        if (button.disabled) return;

        var email = input.value.trim();
        if (!EMAIL_RE.test(email)) {
            input.setAttribute('aria-invalid', 'true');
            setStatus('err', 'That email doesn&rsquo;t look right &mdash; check it and try again.');
            input.focus();
            return;
        }
        input.removeAttribute('aria-invalid');

        // Honeypot filled: a bot. Pretend success, send nothing.
        if (honeypot && honeypot.value) {
            setStatus('ok', 'Almost there &mdash; check your inbox and click the confirmation link to finish subscribing.');
            return;
        }

        button.disabled = true;
        setStatus('', 'Subscribing&hellip;');

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                newsletters: ['the-pond'],
                website: honeypot ? honeypot.value : ''
            })
        }).then(function (res) {
            if (!res.ok) throw new Error('http ' + res.status);
            // The API keeps double opt-in on: confirmation is still pending.
            setStatus('ok', 'Almost there &mdash; check your inbox and click the confirmation link to finish subscribing.');
            form.reset();
        }).catch(function () {
            // Network/CORS failure (blocked or pending deployment): offer the
            // hosted signup page as the way in. It preselects both of Ada's
            // newsletters, so say so.
            setStatus('err',
                'The signup service isn&rsquo;t reachable right now. Try again in a minute, or ' +
                '<a href="' + EXTERNAL_SIGNUP + '" target="_blank" rel="noopener">sign up at homolova.sk/newsletter</a>' +
                ' &mdash; that page preselects both of Ada&rsquo;s newsletters, so untick &ldquo;Hi! It&rsquo;s Ada&rdquo; if you only want The Pond.');
        }).then(function () {
            button.disabled = false;
        });
    });
})();
