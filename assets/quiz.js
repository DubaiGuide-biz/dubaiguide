function initQuiz(config) {
  let answers = {};
  let lastRecommendation = '';

  const quizEl = document.getElementById('quiz');
  const ctaEl = document.getElementById('cta');
  const progressFill = document.getElementById('progress-fill');
  const resultEl = document.getElementById('result');
  const resultBody = document.getElementById('result-body');
  const actionLinksEl = document.getElementById('action-links');
  const leadForm = document.getElementById('lead-form');
  const confirmEl = document.getElementById('confirm');

  function renderQuiz() {
    quizEl.innerHTML = '';
    config.questions.forEach((q) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question';
      const label = document.createElement('label');
      label.textContent = q.label + (q.multi ? ' — select all that apply' : '');
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

  function trackEvent(name, params) {
    if (typeof gtag !== 'undefined') {
      gtag('event', name, params);
    }
  }

  ctaEl.addEventListener('click', async () => {
    trackEvent('quiz_completed', {
      vertical: config.vertical,
      budget: answers.budget || '',
      type: answers.type || '',
      purpose: answers.purpose || '',
      area: Array.isArray(answers.area) ? answers.area.join(', ') : (answers.area || ''),
      priority: answers.priority || ''
    });

    ctaEl.disabled = true;
    resultEl.classList.add('show');
    resultBody.innerHTML = '<div class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span style="margin-left:4px">Finding your match</span></div>';

    if (actionLinksEl) actionLinksEl.innerHTML = '';

    // Remove any previous email capture
    const prevCapture = document.getElementById('email-capture');
    if (prevCapture) prevCapture.remove();

    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical: config.vertical, answers })
      });
      const data = await response.json();
      lastRecommendation = data.recommendation || 'Could not generate a match right now.';
      resultBody.innerHTML = lastRecommendation;

      // ── Email capture (single field, low friction) ──────────────
      const emailCapture = document.createElement('div');
      emailCapture.id = 'email-capture';
      emailCapture.style.cssText = [
        'margin:1.25rem 0',
        'padding:1.25rem 1.5rem',
        'background:rgba(255,255,255,0.03)',
        'border:1px solid rgba(255,255,255,0.08)',
        'border-radius:12px'
      ].join(';');
      emailCapture.innerHTML = `
        <p style="font-size:13px;color:rgba(255,255,255,0.45);margin-bottom:.75rem;">
          📩 Want this match saved? Enter your email and we'll send it to you.
        </p>
        <form id="email-only-form" style="display:flex;gap:8px;flex-wrap:wrap;">
          <input
            type="email"
            id="eo-email"
            placeholder="your@email.com"
            required
            style="flex:1;min-width:180px;padding:10px 16px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);font-family:inherit;font-size:13px;color:#fff;outline:none;"
          >
          <button
            type="submit"
            style="padding:10px 20px;border-radius:100px;border:none;background:#00c9a7;color:#000;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;"
          >
            Send →
          </button>
        </form>
        <div id="eo-confirm" style="display:none;font-size:13px;color:rgba(0,201,167,0.8);margin-top:.6rem;">
          ✓ Sent — check your inbox
        </div>
      `;

      resultBody.after(emailCapture);

      document.getElementById('email-only-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('eo-email').value.trim();
        if (!email) return;

        trackEvent('email_capture_submitted', {
          vertical: config.vertical,
          budget: answers.budget || ''
        });

        try {
          await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vertical: config.vertical,
              answers,
              recommendation: lastRecommendation,
              contact: { name: 'Email capture only', email, phone: 'n/a' },
              submittedAt: new Date().toISOString()
            })
          });
        } catch (err) {
          console.error('email capture failed', err);
        }

        this.style.display = 'none';
        document.getElementById('eo-confirm').style.display = 'block';
        trackEvent('email_capture_success', { vertical: config.vertical });
      });

      // ── Action links ────────────────────────────────────────────
      if (actionLinksEl) {
        actionLinksEl.innerHTML = '';

        if (data.vertical === 'property') {
          if (data.bayutListingsUrl) {
            actionLinksEl.innerHTML += `<a href="${data.bayutListingsUrl}" target="_blank" rel="noopener" class="action-link">Browse matching listings on Bayut →</a>`;
          }
          if (data.bayutInsightsUrl) {
            actionLinksEl.innerHTML += `<a href="${data.bayutInsightsUrl}" target="_blank" rel="noopener" class="action-link">Area transaction data (DLD) →</a>`;
          }
          actionLinksEl.innerHTML += `<a href="/property/guides/mortgage-eligibility-expats/" class="action-link">Mortgage guide →</a>`;
        }

        if (data.vertical === 'business' && data.businessLinks) {
          const bl = data.businessLinks;
          if (bl.apply) {
            actionLinksEl.innerHTML += `<a href="${bl.apply.url}" target="_blank" rel="noopener" class="action-link">${bl.apply.label}</a>`;
          }
          if (bl.nameCheck) {
            actionLinksEl.innerHTML += `<a href="${bl.nameCheck.url}" target="_blank" rel="noopener" class="action-link secondary">${bl.nameCheck.label}</a>`;
          }
          if (bl.ftaRegister) {
            actionLinksEl.innerHTML += `<a href="${bl.ftaRegister.url}" target="_blank" rel="noopener" class="action-link secondary">${bl.ftaRegister.label}</a>`;
          }
          if (bl.visa) {
            actionLinksEl.innerHTML += `<a href="${bl.visa.url}" target="_blank" rel="noopener" class="action-link secondary">${bl.visa.label}</a>`;
          }
        }
      }

    } catch (e) {
      lastRecommendation = 'Could not reach the matching engine — try again.';
      resultBody.innerHTML = lastRecommendation;
    }

    ctaEl.disabled = false;
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('lf-name').value.trim();
    const email = document.getElementById('lf-email').value.trim();
    const phone = document.getElementById('lf-phone').value.trim();
    if (!name || !email || !phone) return;

    trackEvent('lead_submitted', {
      vertical: config.vertical,
      budget: answers.budget || '',
      area: Array.isArray(answers.area) ? answers.area.join(', ') : (answers.area || '')
    });

    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: config.vertical,
          answers,
          recommendation: lastRecommendation,
          contact: { name, email, phone },
          submittedAt: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('lead submit failed', err);
    }

    leadForm.style.display = 'none';
    document.getElementById('confirm-text').textContent = `Thanks, ${name.split(' ')[0]} — a specialist will be in touch shortly.`;
    confirmEl.classList.add('show');
  });

  renderQuiz();
}
