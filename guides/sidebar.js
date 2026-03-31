(function () {
    var GUIDES = {
        guides: [
            {
                id: 'finding-stories-in-data',
                title: 'Finding Stories in Data',
                sections: [
                    { id: 'introduction',   label: 'Introduction' },
                    { id: 'interrogate',    label: 'Interrogate the source' },
                    { id: 'first-look',     label: 'First look' },
                    { id: 'descriptive',    label: 'Descriptive statistics' },
                    { id: 'rankings',       label: 'Rankings &amp; comparisons' },
                    { id: 'rates',          label: 'Rates &amp; context' },
                    { id: 'time-patterns',  label: 'Time patterns' },
                    { id: 'geographic',     label: 'Geographic patterns' },
                    { id: 'relationships',  label: 'Relationships' },
                    { id: 'outliers',       label: 'Outliers &amp; anomalies' },
                    { id: 'missing-data',   label: 'Missing data' },
                    { id: 'verification',   label: 'Verification' },
                    { id: 'news-test',      label: 'The news test' }
                ]
            },
            {
                id: 'tidy-data',
                title: 'Tidy Data',
                sections: [
                    { id: 'introduction',                label: 'Introduction' },
                    { id: 'three-rules',                 label: 'Three rules of tidy data' },
                    { id: 'other-issues',                label: 'Other common issues' },
                    { id: 'final-check',                 label: 'Final tidy check' }
                ]
            },
            {
                id: 'pivot-tables',
                title: 'Pivot Tables',
                sections: [
                    { id: 'core-question',    label: 'The one question' },
                    { id: 'flat-to-grouped',  label: 'Flat list to summary' },
                    { id: 'anatomy',          label: 'The four fields' },
                    { id: 'adding-columns',   label: 'Adding a second dimension' },
                    { id: 'count-vs-sum',     label: 'Count vs. sum' },
                    { id: 'question-to-pivot',label: 'From question to pivot' },
                    { id: 'prerequisites',    label: 'What pivot tables need' },
                    { id: 'common-mistakes',  label: 'Common mistakes' }
                ]
            }
        ]
    };

    var sidebar = document.querySelector('.guide-sidebar');
    if (!sidebar) return;

    // Detect current guide from filename
    var pathParts = window.location.pathname.split('/');
    var filename = pathParts[pathParts.length - 1].replace('.html', '');

    var html = '';

    Object.keys(GUIDES).forEach(function (category) {
        html += '<span class="cat-heading">' + category.charAt(0).toUpperCase() + category.slice(1) + '</span>';

        GUIDES[category].forEach(function (guide) {
            var isCurrent = guide.id === filename;
            html += '<details' + (isCurrent ? ' open' : '') + ' data-guide="' + guide.id + '">';
            html += '<summary>';
            if (!isCurrent) {
                html += '<a href="' + guide.id + '.html" onclick="event.stopPropagation();" style="color:inherit;text-decoration:none;flex:1;">' + guide.title + '</a>';
            } else {
                html += guide.title;
            }
            html += '</summary>';
            html += '<nav>';
            guide.sections.forEach(function (s) {
                var href = isCurrent ? ('#' + s.id) : (guide.id + '.html#' + s.id);
                var dataSec = isCurrent ? (' data-section="' + s.id + '"') : '';
                html += '<a href="' + href + '"' + dataSec + '>' + s.label + '</a>';
            });
            html += '</nav>';
            if (isCurrent) {
                html += '<button class="reset-btn" id="reset-all">Reset all checkboxes</button>';
            }
            html += '</details>';
        });
    });

    sidebar.innerHTML = html;
})();
