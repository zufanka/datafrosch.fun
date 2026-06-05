(function () {
    var style = document.createElement('style');
    style.textContent = '.auto-thumb img[data-thumb-target]:not([src]){background:#e5e7eb;}';
    document.head.appendChild(style);

    var STORAGE_KEY = 'df_thumb_cache_v2';
    var cache = {};
    try { cache = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) {}
    function saveCache() { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch (e) {} }

    function ytIdFromUrl(url) {
        var m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
        return m ? m[1] : null;
    }

    function isInternal(url) {
        if (!url) return false;
        if (url.indexOf('://') === -1) return true;
        try { return new URL(url, window.location.href).origin === window.location.origin; }
        catch (e) { return false; }
    }

    function rewriteToCurrentOrigin(src) {
        if (!src) return src;
        try {
            var u = new URL(src, window.location.href);
            if (u.hostname === 'datafrosch.fun' && u.origin !== window.location.origin) {
                return u.pathname + u.search + u.hash;
            }
        } catch (e) {}
        return src;
    }

    function fetchOgImage(url) {
        if (cache[url]) return Promise.resolve(cache[url]);
        return fetch(url, { credentials: 'omit' })
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (html) {
                if (!html) return null;
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var meta = doc.querySelector('meta[property="og:image"]')
                        || doc.querySelector('meta[name="twitter:image"]');
                var src = meta ? rewriteToCurrentOrigin(meta.getAttribute('content')) : null;
                if (src) { cache[url] = src; saveCache(); }
                return src;
            })
            .catch(function () { return null; });
    }

    function resolveThumb(card) {
        var explicit = card.getAttribute('data-thumb');
        if (explicit) return Promise.resolve(explicit);

        var href = card.getAttribute('href');
        if (!href) return Promise.resolve(null);

        var ytId = ytIdFromUrl(href);
        if (ytId) return Promise.resolve('https://img.youtube.com/vi/' + ytId + '/maxresdefault.jpg');

        if (isInternal(href)) return fetchOgImage(href);
        return Promise.resolve(null);
    }

    function downgradeMaxres(img) {
        if (img.src && img.src.indexOf('maxresdefault') !== -1) {
            img.src = img.src.replace('maxresdefault', 'hqdefault');
        }
    }

    document.querySelectorAll('.auto-thumb').forEach(function (card) {
        var img = card.querySelector('img[data-thumb-target]');
        if (!img) return;
        img.addEventListener('error', function () { downgradeMaxres(img); });
        // When maxresdefault is missing, YouTube returns a 120x90 grey
        // placeholder with HTTP 200 (so no error fires) — detect it by size
        // and fall back to the always-present hqdefault.
        img.addEventListener('load', function () {
            if (img.naturalWidth <= 120 && img.naturalHeight <= 90) downgradeMaxres(img);
        });
        resolveThumb(card).then(function (src) {
            if (src) img.src = src;
        });
    });
})();
