// Click-to-load YouTube player for the mentoring session video.
// Nothing is requested from YouTube until the preview button is clicked;
// the local preview image is the only asset loaded upfront.
(function () {
    var frame = document.getElementById('mentorship-video-frame');
    var button = document.getElementById('mentorship-video-load');
    if (!frame || !button) return;

    button.addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/lU49a7XbxFA';
        iframe.title = 'Mentoring session: telling people and companies apart in a dataset';
        iframe.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.className = 'absolute top-0 left-0 w-full h-full';
        frame.innerHTML = '';
        frame.appendChild(iframe);
        iframe.focus();
    });
})();
