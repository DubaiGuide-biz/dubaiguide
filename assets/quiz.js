function initQuiz(config) {
  let answers = {};
  let lastRecommendation = '';

  const quizEl = document.getElementById('quiz');
  const ctaEl = document.getElementById('cta');
  const progressFill = document.getElementById('progress-fill');
  const resultEl = document.getElementById('result');
  const resultBody = document.getElementById('result-body');
  const leadForm = document.getElementById('lead-form');
  const confirmEl = document.getElementById('confirm');

  function renderQuiz() {
    quizEl.innerHTML = '';
    config.questions.forEach((q) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question';
      const label = document.createElement('label');
      label.textContent = q.label + (q.multi ? ' (select all that apply)' : '');
      qDiv.appendChild(label);
      const opts = document.createElement('div');
      opts.className = 'options';
      q.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'opt';
        btn.type = 'button';
        btn.textContent = opt;
        btn.onclick = () => selectOption(q.id, opt, btn, qDiv, q.multi);
        opts.appendChild(btn);
      });
      qDiv.appendChild(opts);
      quizEl.appendChild(qDiv);
    });
    updateProgress();
  }

  function selectOption(qId, value, btn, qDiv, multi) {
    if (multi) {
      btn.classList.toggle('selected');
      if (!Array.isArray(answers[qId])) answers[qId] = [];
      if (answers[qId].includes(value)) {
        answers[qId] = answers[qId].filter((v) => v !== value);
      } else {
        answers[qId].push(value);
      }
      if (answers[qId].length === 0) delete answers[qId];
    } else {
      qDiv.querySelectorAll('.opt').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      answers[qId] = value;
    }
    updateProgress();
  }

  function updateProgress() {
    const total = config.questions.length;
    const done = Object.keys(answers).length;
    progressFill.style.width = Math.round((done / total) * 100) + '%';
    ctaEl.disabled = done < total;
  }

  ctaEl.addEventListener('click', async () => {
  ctaEl.disabled = true;
  resultEl.classList.add('show');
  resultBody.innerHTML = '<div class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span>Matching your answers</span></div>';
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vertical: config.vertical, answers })
    });
    const data = await response.json();
    lastRecommendation = data.recommendation || 'Could not generate a match right now.';

    const btnStyle = `display:inline-block;margin-top:.75rem;margin-right:.5rem;padding:9px 16px;background:#fff;border:1.5px solid var(--accent);color:var(--accent);border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;`;

    let html = '<p>' + lastRecommendation + '</p><div style="margin-top:1rem;">';

    if (data.bayutListingsUrl) {
      html += `<a href="${data.bayutListingsUrl}" target="_blank" rel="noopener" style="${btnStyle}">Browse listings on Bayut →</a>`;
    }
    if (data.bayutInsightsUrl) {
      html += `<a href="${data.bayutInsightsUrl}" target="_blank" rel="noopener" style="${btnStyle}">Area transaction data →</a>`;
    }
    if (data.vertical === 'property') {
      html += `<a href="/property/guides/mortgage-eligibility-expats/" style="${btnStyle}">Mortgage guide →</a>`;
    }

    html += '</div>';
    resultBody.innerHTML = html;

  } catch (e) {
    lastRecommendation = 'Could not reach the matching engine right now — try again in a moment.';
    resultBody.innerHTML = '<p>' + lastRecommendation + '</p>';
  }
  ctaEl.disabled = false;
});
