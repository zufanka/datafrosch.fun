(function () {
    var links = [
        ['Resources',   '/resources.html'],
        ['The Pond',    '/pond.html'],
        ['Newsletter',  '/pond.html#subscribe'],
        ['Mentoring',   '/mentorship.html'],
        ['The 🐸',      '/index.html#author'],
    ];

    function renderNav() {
        var container = document.querySelector('.navbar .flex');
        if (!container) return;

        container.innerHTML = links.map(function (item) {
            return '<a href="' + item[1] + '" class="font-medium">' + item[0] + '</a>';
        }).join('');
    }

    function renderFooterQuickLinks() {
        var footers = document.querySelectorAll('footer');
        Array.prototype.forEach.call(footers, function (footer) {
            var headings = footer.querySelectorAll('h4');
            Array.prototype.forEach.call(headings, function (heading) {
                if (heading.textContent.trim() !== 'Quick Links') return;
                var list = heading.nextElementSibling;
                if (!list || list.tagName !== 'UL') return;

                list.innerHTML = links.map(function (item) {
                    return '<li><a href="' + item[1] + '" class="text-gray-400 hover:text-white">' + item[0] + '</a></li>';
                }).join('');
            });
        });
    }

    renderNav();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFooterQuickLinks);
    } else {
        renderFooterQuickLinks();
    }
})();
