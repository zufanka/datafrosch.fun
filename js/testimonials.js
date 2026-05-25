(function () {
    const carousel = document.getElementById('testimonials-carousel');
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.testimonial-slide');
    if (slides.length <= 1) return;

    const dotsHost = document.querySelector('.testimonial-dots');
    let idx = 0;
    const dots = [];

    if (dotsHost) {
        slides.forEach(function (_, i) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
            if (i === 0) btn.classList.add('active');
            btn.addEventListener('click', function () { go(i); });
            dotsHost.appendChild(btn);
            dots.push(btn);
        });
        dotsHost.removeAttribute('aria-hidden');
    }

    function go(next) {
        slides[idx].classList.remove('active');
        dots[idx] && dots[idx].classList.remove('active');
        idx = (next + slides.length) % slides.length;
        slides[idx].classList.add('active');
        dots[idx] && dots[idx].classList.add('active');
    }

    let timer = setInterval(function () { go(idx + 1); }, 6000);

    carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
    carousel.addEventListener('mouseleave', function () {
        timer = setInterval(function () { go(idx + 1); }, 6000);
    });
})();
