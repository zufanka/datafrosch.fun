(() => {
  'use strict';
  document.querySelectorAll('[data-python-exercise]').forEach(exercise => {
    const editor = exercise.querySelector('[data-python-code]');
    const run = exercise.querySelector('[data-python-run]');
    const stop = exercise.querySelector('[data-python-stop]');
    const reset = exercise.querySelector('[data-python-reset]');
    const indentButtons = exercise.querySelectorAll('[data-python-indent], [data-python-unindent]');
    const status = exercise.querySelector('[data-python-status]');
    const output = exercise.querySelector('[data-python-output]');
    const result = exercise.querySelector('[data-python-result]');
    const starter = editor.defaultValue;
    // Firefox can restore a textarea value across reloads before this script runs.
    // Start from the HTML starter so versioned storage decides what is restored.
    editor.value = starter;
    const key = `datafrosch-scraping-code-v3:${exercise.dataset.pythonExercise}`;
    let worker;
    let timer;
    let sequence = 0;
    let busy = false;
    let printed = false;
    let storageAvailable = true;
    editor.maxLength = 30000;

    function storageWarning() {
      storageAvailable = false;
      document.querySelectorAll('[data-storage-notice]').forEach(el => {
        el.textContent = 'Browser storage is unavailable. You can still run Python, but code and progress will not be saved between pages.';
        el.hidden = false;
      });
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null && saved.length <= editor.maxLength) {
        editor.value = saved;
        status.textContent = 'Your saved code is restored. Run Python to check it again, or Reset code to replay the exercise.';
      }
    } catch (_) { storageWarning(); }

    function save() {
      if (!storageAvailable) return;
      try { localStorage.setItem(key, editor.value); }
      catch (_) { storageWarning(); }
    }
    function setBusy(value) {
      busy = value;
      run.disabled = value;
      reset.disabled = value;
      indentButtons.forEach(button => { button.disabled = value; });
      stop.disabled = !value;
      editor.readOnly = value;
      exercise.setAttribute('aria-busy', String(value));
    }
    function finish() {
      clearTimeout(timer);
      setBusy(false);
    }
    function terminate(message) {
      if (worker) worker.terminate();
      worker = null;
      sequence += 1;
      finish();
      result.hidden = true;
      status.textContent = message;
    }
    function armTimeout(milliseconds, message) {
      clearTimeout(timer);
      timer = setTimeout(() => terminate(message), milliseconds);
    }
    function renderChecks(checks) {
      result.replaceChildren();
      const passed = checks.length > 0 && checks.every(check => check.ok);
      result.dataset.result = passed ? 'correct' : 'incorrect';
      const title = document.createElement('strong');
      title.textContent = passed ? 'All checks passed.' : 'Not there yet. Check the points below, then run again.';
      const list = document.createElement('ul');
      checks.forEach(check => {
        const item = document.createElement('li');
        item.textContent = `${check.ok ? '✓' : 'Still to do:'} ${check.message}`;
        list.append(item);
      });
      result.append(title, list);
      result.hidden = false;
    }
    function createWorker() {
      const instance = new Worker(new URL('python-worker.js', document.baseURI), { type: 'module' });
      instance.onmessage = ({ data }) => {
        if (data.id !== sequence || instance !== worker) return;
        if (data.type === 'running') {
          status.textContent = 'Running your Python against the practice pages…';
          armTimeout(15000, 'Stopped after 15 seconds. Check for a loop that never ends, then run again.');
        } else if (data.type === 'output') {
          if (!printed) { output.textContent = ''; printed = true; }
          if (output.textContent.length < 41000) output.textContent += data.text;
        } else if (data.type === 'done') {
          finish();
          if (!printed) output.textContent = '(No printed output. Add print(...) to inspect a value.)';
          renderChecks(data.checks);
          status.textContent = 'Run finished. Compare your output with the source pages and the checks below.';
        } else if (data.type === 'error') {
          if (!printed) output.textContent = '';
          output.textContent = `${output.textContent}${printed ? '\n' : ''}${data.message}`.slice(-41000);
          // Discard the interpreter after errors, so another Run is a clean retry.
          terminate('Python stopped on an error. Read the last line of the output, fix the code, then run again. If Python could not load, check your connection.');
        }
      };
      instance.onerror = event => {
        event.preventDefault();
        if (instance !== worker) return;
        output.textContent = 'The Python runtime could not load. Check your internet connection and whether cdn.jsdelivr.net is blocked, then try again.';
        terminate('Python could not start. You can retry with Run Python.');
      };
      return instance;
    }

    run.addEventListener('click', () => {
      if (busy) return;
      if (!editor.value.trim()) {
        status.textContent = 'The editor is empty. Write some Python or choose Reset code.';
        editor.focus();
        return;
      }
      save();
      printed = false;
      result.hidden = true;
      output.textContent = 'Waiting for Python…';
      status.textContent = worker ? 'Starting a fresh run…' : 'Loading Python and its packages. The first run needs an internet connection and may take a moment…';
      setBusy(true);
      armTimeout(120000, 'Python took too long to load. Check your connection, then try Run Python again.');
      try {
        if (!worker) worker = createWorker();
        worker.postMessage({ id: ++sequence, exercise: exercise.dataset.pythonExercise, code: editor.value });
      } catch (_) {
        terminate('This browser could not start the Python worker. Try a current browser with JavaScript enabled.');
      }
    });
    stop.addEventListener('click', () => terminate('Stopped. Run again to start a fresh Python session.'));
    reset.addEventListener('click', () => {
      if (editor.value !== starter && !window.confirm('Replace your code with the starter for this exercise?')) return;
      editor.value = starter;
      save();
      result.hidden = true;
      output.textContent = 'Your output will appear here.';
      status.textContent = 'Starter code restored. Follow the task above, then run it.';
    });
    indentButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (busy) return;
        const value = editor.value;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const from = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1;
        // A selection ending at the next line's start does not include that line.
        const selectedEnd = end > start && value[end - 1] === '\n' ? end - 1 : end;
        const newline = value.indexOf('\n', selectedEnd);
        const to = newline < 0 ? value.length : newline;
        const reverse = button.hasAttribute('data-python-unindent');
        const replacement = value.slice(from, to).split('\n')
          .map(line => reverse ? line.replace(/^( {1,4}|\t)/, '') : `    ${line}`).join('\n');
        editor.setRangeText(replacement, from, to, 'select');
        editor.focus();
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    editor.addEventListener('input', () => {
      save();
      result.hidden = true;
      status.textContent = 'Code changed. Run Python to check this version.';
    });
    editor.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!busy) run.click();
      }
    });
    window.addEventListener('pagehide', () => {
      if (worker) terminate('Python stopped when you left this page. Run Python to start again.');
    });
  });
})();
