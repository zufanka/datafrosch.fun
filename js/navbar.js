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

    function renderNav() {
        var container = document.querySelector('.navbar .flex');
        if (!container) return;

        container.innerHTML = links.map(function (item) {
            return '<a href="' + item[1] + '" class="font-medium">' + item[0] + '</a>';
        }).join('');
    }

    function renderFooterColumns() {
        var footers = document.querySelectorAll('footer');
        Array.prototype.forEach.call(footers, function (footer) {
            var headings = footer.querySelectorAll('h4');
            var hasQuickLinks = Array.prototype.some.call(headings, function (heading) {
                return heading.textContent.trim() === 'Quick Links';
            });
            Array.prototype.forEach.call(headings, function (heading) {
                var name = heading.textContent.trim();
                var list = heading.nextElementSibling;
                if (!list || list.tagName !== 'UL') return;

                if (name === 'Quick Links') {
                    list.innerHTML = links.map(function (item) {
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
