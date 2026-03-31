(function () {
    var links = [
        ['Resources',   '/index.html#resources'],
        ['Mentorship',  '/index.html#mentorship'],
        ['The Pond',    '/index.html#the-pond'],
        ['The 🐸',      '/index.html#author'],
    ];

    var container = document.querySelector('.navbar .flex');
    if (!container) return;

    container.innerHTML = links.map(function (item) {
        return '<a href="' + item[1] + '" class="font-medium">' + item[0] + '</a>';
    }).join('');
})();
