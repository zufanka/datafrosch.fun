(() => {
  'use strict';
  const storageKey = 'datafrosch-scraping-prototype-v4';
  const lessonNames = ['Write your first scraper', 'Follow a link', 'Collect ten frogs'];
  const freshState = () => ({ completed: [], lastLesson: null, answers: {} });
  let state = freshState();
  let storageAvailable = true;

  function storageNotice() {
    document.querySelectorAll('[data-storage-notice]').forEach(el => { el.hidden = false; });
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      state.completed = [...new Set((Array.isArray(saved.completed) ? saved.completed : [])
        .filter(id => Number.isInteger(id) && id >= 1 && id <= 3))];
      state.lastLesson = [1, 2, 3].includes(saved.lastLesson) ? saved.lastLesson : null;
      if (saved.answers && typeof saved.answers === 'object') {
        Object.entries(saved.answers).forEach(([key, value]) => {
          if (/^(?:l[1-3]q[12]|l1v2q[123])$/.test(key) && ['a', 'b', 'c'].includes(value)) state.answers[key] = value;
        });
      }
    }
  } catch (_) { storageAvailable = false; storageNotice(); }

  function save() {
    if (!storageAvailable) return;
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch (_) { storageAvailable = false; storageNotice(); }
  }

  function renderProgress() {
    document.querySelectorAll('[data-progress]').forEach(el => { el.value = state.completed.length; });
    document.querySelectorAll('[data-progress-label]').forEach(el => {
      el.textContent = `${state.completed.length} of 3 lessons marked complete`;
    });
    document.querySelectorAll('[data-lesson-number]').forEach(el => {
      const id = Number(el.dataset.lessonNumber);
      const done = state.completed.includes(id);
      el.textContent = done ? '✓' : String(id).padStart(2, '0');
      el.setAttribute('aria-label', done ? `Lesson ${id} complete` : `Lesson ${id}`);
    });
    document.querySelectorAll('[data-complete-lesson]').forEach(button => {
      const done = state.completed.includes(Number(button.dataset.completeLesson));
      button.dataset.completed = String(done);
      button.setAttribute('aria-pressed', String(done));
      button.textContent = done ? '✓ Lesson marked complete · undo' : 'Mark this lesson complete';
    });
    document.querySelectorAll('[data-resume]').forEach(link => {
      const id = state.lastLesson || 1;
      link.href = `lesson-${id}.html`;
      link.textContent = state.lastLesson ? `Continue: ${lessonNames[id - 1]} →` : 'Start lesson 1 →';
    });
    document.querySelectorAll('[data-all-complete]').forEach(el => {
      el.hidden = state.completed.length !== 3;
    });
  }

  function showFeedback(form, empty = false) {
    const feedback = form.querySelector('[data-feedback]');
    const selected = form.querySelector('input:checked');
    feedback.hidden = false;
    if (empty || !selected) {
      feedback.dataset.result = 'empty';
      feedback.textContent = 'Choose an answer first. You can try as often as you like.';
      return;
    }
    const correct = selected.value === form.dataset.answer;
    feedback.dataset.result = correct ? 'correct' : 'incorrect';
    feedback.textContent = correct
      ? `That's right. ${form.dataset.explanation}`
      : `Not quite. ${form.dataset.hint} Try another answer.`;
  }

  document.querySelectorAll('[data-inspector-check]').forEach(form => {
    const fields = [...form.querySelectorAll('[data-inspector-field]')];
    const feedback = form.querySelector('[data-feedback]');
    let revision = 0;
    function clearFeedback() {
      revision += 1;
      feedback.hidden = true;
      fields.forEach(field => field.removeAttribute('aria-invalid'));
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const current = ++revision;
      feedback.hidden = false;
      const values = fields.map(field => field.value.trim());
      const empty = fields.find((field, index) => !values[index]);
      if (empty) {
        feedback.dataset.result = 'empty';
        feedback.textContent = `Fill in ${empty.dataset.label} first.`;
        return;
      }
      feedback.dataset.result = 'checking';
      feedback.textContent = 'Checking your answer…';
      try {
        const results = await Promise.all(fields.map(async (field, index) => {
          let answer = values[index];
          const kind = field.dataset.inspectorField;
          if (kind === 'selector') {
            const response = await fetch(new URL(field.dataset.page, document.baseURI), { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error('Practice page unavailable');
            const source = new DOMParser().parseFromString(await response.text(), 'text/html');
            const expected = [...source.querySelectorAll(field.dataset.target)];
            try {
              const matches = [...source.querySelectorAll(answer)];
              return matches.length === expected.length && expected.length > 0
                && matches.every((element, position) => element === expected[position]);
            } catch (_) { return false; }
          }
          if (field.type === 'number') return field.dataset.accepted.split('|').some(value => Number(answer) === Number(value));
          if (kind === 'class') answer = answer.replace(/^\./, '');
          else if (kind !== 'literal') answer = answer.toLowerCase().replace(/\s+/g, ' ');
          if (kind === 'tag') answer = answer.replace(/^<\s*([a-z][a-z0-9]*)\s*>$/, '$1');
          return field.dataset.accepted.split('|').includes(answer);
        }));
        if (current !== revision) return; // Ignore a check superseded by an edit or reset.
        fields.forEach((field, index) => field.setAttribute('aria-invalid', String(!results[index])));
        const wrong = fields.filter((field, index) => !results[index]);
        feedback.dataset.result = wrong.length ? 'incorrect' : 'correct';
        feedback.textContent = wrong.length
          ? `Not quite. ${wrong.map(field => field.dataset.hint).join(' ')}`
          : form.dataset.success;
      } catch (_) {
        if (current !== revision) return;
        feedback.dataset.result = 'empty';
        feedback.textContent = 'Could not load the practice page to check your selector. Try again.';
      }
    });
    form.addEventListener('input', clearFeedback);
    form.addEventListener('reset', clearFeedback);
  });

  document.querySelectorAll('[data-quiz]').forEach(form => {
    const saved = state.answers[form.id];
    if (saved) {
      const input = form.querySelector(`input[value="${saved}"]`);
      if (input) { input.checked = true; showFeedback(form); }
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input:checked');
      if (selected) { state.answers[form.id] = selected.value; save(); }
      showFeedback(form, !selected);
    });
    form.addEventListener('change', () => {
      form.querySelector('[data-feedback]').hidden = true;
      delete state.answers[form.id];
      save();
    });
  });

  document.querySelectorAll('[data-complete-lesson]').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.completeLesson);
      state.completed = state.completed.includes(id)
        ? state.completed.filter(value => value !== id) : [...state.completed, id];
      save();
      renderProgress();
      const status = document.querySelector('[data-completion-status]');
      if (status) status.textContent = state.completed.includes(id)
        ? (storageAvailable ? 'Saved in this browser. You can revisit any lesson.' : 'Marked complete for this visit. Browser storage is unavailable.')
        : 'This lesson is no longer marked complete.';
    });
  });

  document.querySelectorAll('[data-reset]').forEach(button => {
    button.addEventListener('click', () => {
      if (!window.confirm('Reset lesson markers and quiz answers saved in this browser?')) return;
      state = freshState();
      save();
      document.querySelectorAll('[data-quiz], [data-inspector-check]').forEach(form => {
        form.reset();
        form.querySelector('[data-feedback]').hidden = true;
        form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
      });
      const status = document.querySelector('[data-completion-status]');
      if (status) status.textContent = 'Progress and quiz answers reset.';
      renderProgress();
    });
  });

  document.querySelectorAll('[data-load-video]').forEach(button => {
    button.addEventListener('click', () => {
      const container = button.closest('[data-video]');
      const url = new URL(`https://www.youtube-nocookie.com/embed/${container.dataset.videoId}`);
      url.search = new URLSearchParams({
        start: container.dataset.start, end: container.dataset.end,
        autoplay: '0', controls: '1', playsinline: '1', rel: '0',
        cc_lang_pref: 'en', cc_load_policy: '1'
      }).toString();
      const frame = document.createElement('iframe');
      frame.src = url.href;
      frame.title = container.dataset.title;
      frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      container.replaceChildren(frame);
      frame.focus();
    });
  });

  const baseUrl = new URL('.', window.location.href).href.replace(/\/$/, '');
  document.querySelectorAll('[data-course-url]').forEach(el => { el.textContent = baseUrl; });
  const currentLesson = Number(document.body.dataset.lesson);
  if ([1, 2, 3].includes(currentLesson)) {
    state.lastLesson = currentLesson;
    save();
  }
  renderProgress();
})();
