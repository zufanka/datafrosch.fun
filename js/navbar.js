(function () {
    var links = [
        ['Resources',   '/resources.html'],
        ['The Pond',    '/pond.html'],
        ['Newsletter',  '/pond.html#subscribe'],
        ['Mentoring',   '/mentorship.html'],
        ['The 🐸',      '/index.html#author'],
    ];

    var socialLinks = [
        ['@datafrosch.bsky.social',   'https://bsky.app/profile/datafrosch.bsky.social'],
        ['@datafrosch@mastodon.social', 'https://mastodon.social/@datafrosch'],
    ];

    /* Footer-only extra appended after the five shared nav links; the
       main navigation above stays exactly the core items. */
    var footerQuickLinks = links.concat([
        ['RSS feed', '/blog/feed.xml'],
    ]);

    /* Footer contact address: footer mailto links point here, whatever
       address the page shipped with. */
    var contactEmail = 'hello@datafrosch.fun';

    function renderNav() {
        var container = document.querySelector('.navbar .flex');
        if (!container) return;

        container.innerHTML = links.map(function (item) {
            return '<a href="' + item[1] + '" class="font-medium">' + item[0] + '</a>';
        }).join('');
    }

    /* Keep any ?subject= query, replace only the address. Links outside
       footers stay untouched. */
    function normalizeFooterEmail(footer) {
        var mailtos = footer.querySelectorAll('a[href^="mailto:"]');
        Array.prototype.forEach.call(mailtos, function (link) {
            var href = link.getAttribute('href') || '';
            var query = href.indexOf('?');
            link.setAttribute('href', 'mailto:' + contactEmail + (query === -1 ? '' : href.slice(query)));
        });
    }

    function renderFooterColumns() {
        var footers = document.querySelectorAll('footer');
        Array.prototype.forEach.call(footers, function (footer) {
            normalizeFooterEmail(footer);
            var headings = footer.querySelectorAll('h4');
            var hasQuickLinks = Array.prototype.some.call(headings, function (heading) {
                return heading.textContent.trim() === 'Quick Links';
            });
            Array.prototype.forEach.call(headings, function (heading) {
                var name = heading.textContent.trim();
                var list = heading.nextElementSibling;
                if (!list || list.tagName !== 'UL') return;

                if (name === 'Quick Links') {
                    list.innerHTML = footerQuickLinks.map(function (item) {
                        return '<li><a href="' + item[1] + '" class="text-gray-400 hover:text-white">' + item[0] + '</a></li>';
                    }).join('');
                } else if (name === 'Resources' && hasQuickLinks) {
                    heading.textContent = 'Elsewhere';
                    list.innerHTML = socialLinks.map(function (item) {
                        return '<li><a href="' + item[1] + '" class="text-gray-400 hover:text-white" style="overflow-wrap:anywhere">' + item[0] + '</a></li>';
                    }).join('');
                }
            });
        });
    }

    renderNav();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFooterColumns);
    } else {
        renderFooterColumns();
    }
})();
