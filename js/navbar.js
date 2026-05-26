(function () {
    var links = [
        ['Resources',         '/resources.html'],
        ['Mentorship & Pond', '/index.html#mentorship-pond'],
        ['The 🐸',            '/index.html#author'],
    ];

    var container = document.querySelector('.navbar .flex');
    if (!container) return;

    container.innerHTML = links.map(function (item) {
        return '<a href="' + item[1] + '" class="font-medium">' + item[0] + '</a>';
    }).join('');
})();
