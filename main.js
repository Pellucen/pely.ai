// Scroll reveals via IntersectionObserver
const ro = new IntersectionObserver(
  (entries) => {
    entries.forEach((el) => {
      if (el.isIntersecting) el.target.classList.add('visible');
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);
document
  .querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.scroll-line')
  .forEach((el) => ro.observe(el));

// Mission word-by-word animation
const m = document.getElementById('mission-text');
let animM = null;

if (m) {
  const tmp = document.createElement('div');
  tmp.innerHTML = m.innerHTML;

  function wrapWords(node) {
    const result = [];
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) {
        c.textContent.split(/(\s+)/).forEach((w) => {
          result.push(w.trim() ? '<span class="mission-word">' + w + '</span>' : w);
        });
      } else if (c.nodeType === 1) {
        const inner = [];
        c.childNodes.forEach((i) => {
          if (i.nodeType === 3)
            i.textContent.split(/(\s+)/).forEach((w) => {
              inner.push(w.trim() ? '<span class="mission-word">' + w + '</span>' : w);
            });
        });
        result.push(
          '<' + c.tagName.toLowerCase() + '>' + inner.join('') + '</' + c.tagName.toLowerCase() + '>'
        );
      }
    });
    return result.join('');
  }

  m.innerHTML = wrapWords(tmp);
  const words = m.querySelectorAll('.mission-word');

  animM = function () {
    const rect = m.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
    const n = Math.floor(p * words.length * 1.8);
    words.forEach((w, i) => w.classList.toggle('lit', i < n));
  };

  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        animM();
        missionActive = true;
      } else {
        missionActive = false;
      }
    },
    { threshold: 0.1 }
  ).observe(m);
}

// Unified scroll handler
let missionActive = false;
let scrollTicking = false;

function onScroll() {
  // Nav background toggle
  document.getElementById('nav').classList.toggle('scrolled', scrollY > 60);

  // Mission word animation
  if (missionActive && animM) animM();

  // Parallax on case study visuals + skyline horizontal scroll
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      document.querySelectorAll('.case-study-visual').forEach((el) => {
        if (el._isTilting) return; // skip parallax while tilt is active
        const r = el.getBoundingClientRect();
        el.style.transform =
          'translateY(' + ((r.top + r.height / 2 - innerHeight / 2) * 0.06) + 'px)';
      });

      // Skyline horizontal scroll: moves left to right as user scrolls down
      const skyline = document.querySelector('.manchester-skyline img');
      if (skyline) {
        const container = skyline.parentElement;
        const rect = container.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
        const overflow = skyline.offsetWidth - container.offsetWidth;
        skyline.style.transform = 'translateX(' + (-overflow * progress) + 'px)';
      }

      scrollTicking = false;
    });
    scrollTicking = true;
  }
}

addEventListener('scroll', onScroll);

// Contact form — submit via fetch then redirect to /thank-you
// Contact form — submit via fetch then redirect to /thank-you
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault(); // This stops FormSubmit from taking over
    const data = new FormData(contactForm);
    
    // Optional: Change button text so users know it's sending
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'info@pely.ai', // <-- Change to your personal Gmail if preferred!
        subject: 'New Website Enquiry',
        fields: {
          Name: data.get('name'),
          Email: data.get('email'),
          Message: data.get('message')
        }
      })
    }).then(() => {
      window.location.href = '/thank-you';
    }).catch(err => {
      console.error("Email failed:", err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Error - Try Again';
      }
    });
  });
}

// Hero orb mouse tracking
const hero = document.querySelector('.hero');
if (hero) {
  hero.addEventListener('mousemove', (e) => {
    const x = (e.clientX / innerWidth - 0.5) * 30;
    const y = (e.clientY / innerHeight - 0.5) * 30;
    document.querySelectorAll('.hero-orb-1,.hero-orb-2,.hero-orb-3').forEach((o, i) => {
      const s = (i + 1) * 0.4;
      o.style.transform = 'translate(' + x * s + 'px,' + y * s + 'px)';
    });
  });
}

// ─── TYPEWRITER EFFECT ON TERMINAL CODE BLOCKS ───
(function () {
  const codeBlocks = document.querySelectorAll('.cs-code');
  const typed = new Set();

  const typeObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !typed.has(entry.target)) {
          typed.add(entry.target);
          typeOut(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  codeBlocks.forEach((block) => {
    block._fullHTML = block.innerHTML;
    block.innerHTML = '';
    typeObs.observe(block);
  });

  function typeOut(el) {
    const html = el._fullHTML;
    let i = 0;
    el.classList.add('typing');

    function step() {
      if (i >= html.length) {
        el.classList.remove('typing');
        return;
      }
      // Skip over HTML tags instantly
      if (html[i] === '<') {
        const close = html.indexOf('>', i);
        if (close !== -1) {
          i = close + 1;
          el.innerHTML = html.slice(0, i);
          step();
          return;
        }
      }
      i++;
      el.innerHTML = html.slice(0, i);
      // Newlines get a longer pause
      const delay = html[i - 1] === '\n' ? 60 : 12;
      setTimeout(step, delay);
    }
    step();
  }
})();

// ─── 3D TILT ON CASE STUDY CARDS ───
(function () {
  document.querySelectorAll('.case-study-visual').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      card._isTilting = true;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tiltX = y * -12; // degrees
      const tiltY = x * 12;
      card.style.transform =
        'perspective(800px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
      card._isTilting = false;
      card.style.transform = '';
    });
  });
})();

// ─── MAGNETIC BUTTONS ───
(function () {
  const buttons = document.querySelectorAll('.hero-cta, .nav-cta, .pilot-cta, .contact-form button');
  const threshold = 80; // px distance to start pulling

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pull = Math.max(0, 1 - dist / threshold);
      btn.style.transform = 'translate(' + (dx * pull * 0.3) + 'px,' + (dy * pull * 0.3) + 'px)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
      btn.style.transform = '';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });
})();

// ─── ANIMATED COUNT-UP NUMBERS ───
(function () {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  const counted = new Set();

  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !counted.has(entry.target)) {
          counted.add(entry.target);
          animateCount(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => countObs.observe(el));

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

// ─── ROI CALCULATOR ───
(function () {
  const hours = document.getElementById('roi-hours');
  const rate = document.getElementById('roi-rate');
  if (!hours || !rate) return;

  const hoursVal = document.getElementById('roi-hours-val');
  const rateVal = document.getElementById('roi-rate-val');
  const hoursSaved = document.getElementById('roi-hours-saved');
  const moneySaved = document.getElementById('roi-money-saved');
  function update() {
    const h = parseInt(hours.value, 10);
    const r = parseInt(rate.value, 10);
    const annualHours = h * 52;
    const annualMoney = annualHours * r;

    hoursVal.textContent = h + ' hrs';
    rateVal.textContent = '\u00A3' + r;
    hoursSaved.textContent = annualHours.toLocaleString();
    moneySaved.textContent = '\u00A3' + annualMoney.toLocaleString();

    // Subtle pop on the numbers
    hoursSaved.style.transform = 'scale(1.08)';
    moneySaved.style.transform = 'scale(1.08)';
    setTimeout(() => {
      hoursSaved.style.transform = '';
      moneySaved.style.transform = '';
    }, 200);
  }

  hours.addEventListener('input', update);
  rate.addEventListener('input', update);
  update();
})();

// ─── FAQ ACCORDION ───
(function () {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      items.forEach((i) => {
        i.classList.remove('open');
        i.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if it wasn't already open)
      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        if (typeof plausible !== 'undefined') plausible('FAQ Opened', { props: { question: trigger.querySelector('.faq-question').textContent } });
      }
    });
  });
})();

// ─── BEFORE / AFTER SLIDER ───
(function () {
  var slider = document.getElementById('ba-slider');
  if (!slider) return;

  var wrapper = slider.parentElement;
  var afterPanel = wrapper.querySelector('.ba-after');
  var handle = slider.querySelector('.ba-slider-handle');
  var dragging = false;

  function setPosition(clientX) {
    var rect = wrapper.getBoundingClientRect();
    var pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    afterPanel.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
    slider.style.left = pct + '%';
    handle.setAttribute('aria-valuenow', Math.round(pct));
  }

  function onStart(e) {
    e.preventDefault();
    dragging = true;
    document.body.style.userSelect = 'none';
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(clientX);
  }

  function onMove(e) {
    if (!dragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(clientX);
  }

  function onEnd() {
    dragging = false;
    document.body.style.userSelect = '';
  }

  slider.addEventListener('mousedown', onStart);
  slider.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);

  // Keyboard support
  handle.addEventListener('keydown', function (e) {
    var rect = wrapper.getBoundingClientRect();
    var current = parseFloat(slider.style.left) || 50;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setPosition(rect.left + (Math.max(0, current - 2) / 100) * rect.width);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setPosition(rect.left + (Math.min(100, current + 2) / 100) * rect.width);
    }
  });
})();

// ─── AUTOMATION QUIZ ───
(function () {
  var card = document.getElementById('quiz-card');
  if (!card) return;

  var steps = card.querySelectorAll('.quiz-step');
  var progressBar = document.getElementById('quiz-progress-bar');
  var resultEl = document.getElementById('quiz-result');
  var totalSteps = steps.length;
  var currentStep = 0;
  var answers = {};
  var isTransitioning = false;
  var isStandalone = window.location.pathname.indexOf('/quiz') !== -1;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Data structures ──

  var recommendations = {
    orders: { service: 'Workflow Automation' },
    data: { service: 'Data Pipeline' },
    outreach: { service: 'AI Agent' },
    research: { service: 'AI Integration' },
    invoicing: { service: 'Data Pipeline' },
    reporting: { service: 'AI Integration' }
  };

  var taskWeights = {
    orders: 0.35, data: 0.25, outreach: 0.30,
    research: 0.22, invoicing: 0.18, reporting: 0.22
  };

  // hoursByTeam and readinessMultipliers removed — hours now come from user slider input

  var industryFraming = {
    ecommerce: {
      headline: 'Your e-commerce workflow, automated',
      framingPrefix: 'We\u2019ll automate your ',
      examples: {
        orders: 'order routing, fulfilment syncing, and inventory updates \u2014 so you never copy-paste an order again.',
        data: 'product feeds, sales reporting, and stock reconciliation \u2014 your spreadsheets update themselves.',
        outreach: 'abandoned-cart follow-ups, review requests, and win-back campaigns \u2014 so your team focuses on selling.',
        research: 'competitor tracking, pricing analysis, and compliance checks \u2014 surfacing what matters without the manual trawl.',
        invoicing: 'invoice generation, payment chasing, and reconciliation \u2014 from order to cash without the admin.',
        reporting: 'sales dashboards, inventory reports, and trend analysis \u2014 real-time insight without exporting a single CSV.'
      }
    },
    health: {
      headline: 'Your clinic ops, streamlined',
      framingPrefix: 'We\u2019ll automate your ',
      examples: {
        orders: 'appointment scheduling, patient intake, and referral routing \u2014 no more double-bookings or lost forms.',
        data: 'patient records, reporting, and audit trails \u2014 accurate data without the admin overhead.',
        outreach: 'appointment reminders, follow-up sequences, and feedback collection \u2014 keeping patients engaged effortlessly.',
        research: 'regulatory checks, literature reviews, and compliance monitoring \u2014 so you stay ahead of changing standards.',
        invoicing: 'billing, insurance claims, and payment tracking \u2014 less time on admin, more time with patients.',
        reporting: 'clinical metrics, patient outcome tracking, and compliance reports \u2014 generated automatically.'
      }
    },
    finance: {
      headline: 'Your financial ops, supercharged',
      framingPrefix: 'We\u2019ll automate your ',
      examples: {
        orders: 'transaction processing, reconciliation, and settlement workflows \u2014 eliminating manual matching.',
        data: 'reporting pipelines, portfolio dashboards, and data aggregation \u2014 real-time insight without the legwork.',
        outreach: 'client onboarding, KYC follow-ups, and periodic review reminders \u2014 so nothing falls through the cracks.',
        research: 'market screening, regulatory monitoring, and due-diligence checks \u2014 surface signals faster than any analyst.',
        invoicing: 'fee calculations, client billing, and payment reconciliation \u2014 accurate and on time, every time.',
        reporting: 'portfolio performance, risk dashboards, and regulatory filings \u2014 built from live data, not last week\u2019s export.'
      }
    },
    services: {
      headline: 'Your service delivery, on autopilot',
      framingPrefix: 'We\u2019ll automate your ',
      examples: {
        orders: 'project intake, task assignment, and delivery tracking \u2014 from enquiry to invoice without the friction.',
        data: 'timesheets, utilisation reports, and client dashboards \u2014 up-to-date numbers without chasing anyone.',
        outreach: 'lead nurturing, proposal follow-ups, and review requests \u2014 so your pipeline keeps moving while you deliver.',
        research: 'industry benchmarking, tender tracking, and compliance reviews \u2014 staying competitive without the busywork.',
        invoicing: 'time-to-invoice, expense tracking, and payment reminders \u2014 so you get paid on time without the chase.',
        reporting: 'utilisation rates, project margins, and client health scores \u2014 all generated from the tools you already use.'
      }
    },
    creative: {
      headline: 'Your creative workflow, automated',
      framingPrefix: 'We\u2019ll automate your ',
      examples: {
        orders: 'briefs, project kickoffs, and delivery scheduling \u2014 so your team focuses on the work, not the admin.',
        data: 'asset tagging, file organisation, and version tracking \u2014 accurate records without the manual overhead.',
        outreach: 'client follow-ups, pitch decks, and new-business outreach \u2014 keeping your pipeline warm without the chase.',
        research: 'trend monitoring, competitor analysis, and brand audits \u2014 surfacing insights without the manual trawl.',
        invoicing: 'time tracking, invoice generation, and payment chasing \u2014 from deliverable to cash without the admin.',
        reporting: 'project profitability, utilisation dashboards, and client reports \u2014 live numbers from the tools you already use.'
      }
    },
    other: {
      headline: 'Your operations, streamlined',
      framingPrefix: 'We\u2019ll automate your ',
      examples: {
        orders: 'intake processing, task routing, and delivery tracking \u2014 so work flows through your team without bottlenecks.',
        data: 'data entry, record-keeping, and reconciliation \u2014 accurate information without the manual overhead.',
        outreach: 'follow-ups, nurture sequences, and feedback loops \u2014 keeping relationships warm without the daily grind.',
        research: 'information gathering, compliance checks, and competitive intelligence \u2014 surfacing what matters faster.',
        invoicing: 'billing, payment chasing, and financial reconciliation \u2014 so you get paid without the paperwork.',
        reporting: 'dashboards, KPI tracking, and periodic reports \u2014 built automatically from your live data.'
      }
    }
  };

  var toolStartingPoints = {
    amazon: { label: 'Amazon integration', detail: 'We\u2019ll connect SP-API and MCF for end-to-end fulfilment.' },
    tiktok: { label: 'TikTok Shop integration', detail: 'We\u2019ll wire up TikTok\u2019s commerce API to your workflow.' },
    squarespace: { label: 'Squarespace integration', detail: 'We\u2019ll connect directly to your storefront\u2019s API.' },
    shopify: { label: 'Shopify integration', detail: 'We\u2019ll plug into Shopify\u2019s ecosystem for seamless automation.' },
    xero: { label: 'Xero / QuickBooks integration', detail: 'We\u2019ll sync your accounting data into the automation pipeline.' },
    spreadsheets: { label: 'Spreadsheet automation', detail: 'We\u2019ll pull data from your sheets and push updates back automatically.' },
    custom: { label: 'Custom API integration', detail: 'We\u2019ll build bespoke connectors for your internal tools.' },
    nothing: { label: 'A clean-slate setup', detail: 'We\u2019ll design the right tool stack and connect everything from scratch.' },
    ehr: { label: 'EHR / patient system integration', detail: 'We\u2019ll connect your electronic health records into the automation pipeline.' },
    trading: { label: 'Trading / analytics platform integration', detail: 'We\u2019ll wire up your trading and analytics data feeds.' },
    crm: { label: 'CRM integration', detail: 'We\u2019ll connect your CRM so client data flows automatically.' },
    pm: { label: 'Project management integration', detail: 'We\u2019ll sync your PM tool so tasks and deadlines update themselves.' },
    dam: { label: 'DAM / asset library integration', detail: 'We\u2019ll connect your digital asset manager so files flow into every workflow.' },
    design: { label: 'Design tool integration', detail: 'We\u2019ll wire up Figma, Adobe, or Canva so assets export and sync automatically.' }
  };

  var toolPriority = ['amazon', 'tiktok', 'squarespace', 'shopify', 'ehr', 'trading', 'crm', 'pm', 'design', 'dam', 'xero', 'spreadsheets', 'custom', 'nothing'];

  // Industry-specific tool sets for step 3
  var industryToolIcons = {
    squarespace: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    shopify: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
    amazon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    spreadsheets: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
    custom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    xero: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    nothing: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    ehr: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    trading: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    crm: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    pm: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
    dam: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    design: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>'
  };

  var industryToolLabels = {
    squarespace: 'Squarespace',
    shopify: 'Shopify',
    amazon: 'Amazon / Amazon MCF',
    tiktok: 'TikTok Shop',
    spreadsheets: 'Spreadsheets (Excel / Sheets)',
    custom: 'Custom / internal systems',
    xero: 'Xero / QuickBooks',
    nothing: 'Nothing specific',
    ehr: 'EHR / Patient System',
    trading: 'Trading / Analytics Platform',
    crm: 'CRM (HubSpot, Salesforce, etc.)',
    pm: 'Project Management (Asana, Monday, etc.)',
    dam: 'DAM / Asset Library',
    design: 'Figma / Adobe / Canva'
  };

  var industryTools = {
    ecommerce: ['squarespace', 'shopify', 'amazon', 'tiktok', 'xero', 'spreadsheets', 'custom', 'nothing'],
    health: ['ehr', 'xero', 'spreadsheets', 'custom', 'nothing'],
    finance: ['trading', 'xero', 'spreadsheets', 'custom', 'nothing'],
    services: ['crm', 'pm', 'xero', 'spreadsheets', 'custom', 'nothing'],
    creative: ['design', 'dam', 'pm', 'xero', 'spreadsheets', 'custom', 'nothing'],
    other: ['xero', 'spreadsheets', 'custom', 'nothing']
  };

  // Industry-specific time-sink labels for step 2
  var industryTimeSinks = {
    ecommerce: [
      { key: 'orders', label: 'Order processing & fulfilment' },
      { key: 'data', label: 'Product data & stock reconciliation' },
      { key: 'outreach', label: 'Customer & creator outreach' },
      { key: 'research', label: 'Competitor & pricing research' },
      { key: 'invoicing', label: 'Invoicing & payment chasing' },
      { key: 'reporting', label: 'Sales & inventory reporting' }
    ],
    health: [
      { key: 'orders', label: 'Patient admin & scheduling' },
      { key: 'data', label: 'Records & data entry' },
      { key: 'outreach', label: 'Appointment follow-ups & reminders' },
      { key: 'research', label: 'Regulatory & clinical compliance' },
      { key: 'invoicing', label: 'Billing & insurance claims' },
      { key: 'reporting', label: 'Clinical metrics & compliance reports' }
    ],
    finance: [
      { key: 'orders', label: 'Transaction processing' },
      { key: 'data', label: 'Data aggregation & pipelines' },
      { key: 'outreach', label: 'Client onboarding & KYC' },
      { key: 'research', label: 'Market screening & due diligence' },
      { key: 'invoicing', label: 'Fee calculations & billing' },
      { key: 'reporting', label: 'Portfolio & risk reporting' }
    ],
    services: [
      { key: 'orders', label: 'Project intake & delivery' },
      { key: 'data', label: 'Timesheets & utilisation data' },
      { key: 'outreach', label: 'Lead nurturing & proposals' },
      { key: 'research', label: 'Benchmarking & tender tracking' },
      { key: 'invoicing', label: 'Invoicing & expense tracking' },
      { key: 'reporting', label: 'Utilisation & margin reporting' }
    ],
    creative: [
      { key: 'orders', label: 'Briefs & project kickoffs' },
      { key: 'data', label: 'Asset tagging & file management' },
      { key: 'outreach', label: 'Client follow-ups & pitches' },
      { key: 'research', label: 'Trend monitoring & competitor analysis' },
      { key: 'invoicing', label: 'Time tracking & invoicing' },
      { key: 'reporting', label: 'Project profitability & reporting' }
    ],
    other: [
      { key: 'orders', label: 'Order / intake processing' },
      { key: 'data', label: 'Data entry & spreadsheets' },
      { key: 'outreach', label: 'Customer outreach & follow-ups' },
      { key: 'research', label: 'Research & compliance' },
      { key: 'invoicing', label: 'Invoicing & admin' },
      { key: 'reporting', label: 'Reporting & analytics' }
    ]
  };

  var timeSinkIcons = {
    orders: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    data: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    outreach: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    research: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    invoicing: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    reporting: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
  };

  function renderStep2TimeSinks() {
    var industry = answers['0'] || 'other';
    var sinks = industryTimeSinks[industry] || industryTimeSinks.other;
    var step2 = card.querySelector('.quiz-step[data-step="2"]');
    if (!step2) return;
    var container = step2.querySelector('.quiz-options');
    if (!container) return;

    var existing = answers['2'] || [];
    container.innerHTML = '';
    sinks.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      if (existing.indexOf(item.key) !== -1) btn.classList.add('selected');
      btn.dataset.value = item.key;
      var iconSpan = document.createElement('span');
      iconSpan.className = 'quiz-option-icon';
      iconSpan.innerHTML = timeSinkIcons[item.key] || '';
      btn.appendChild(iconSpan);
      btn.appendChild(document.createTextNode(' ' + item.label));
      container.appendChild(btn);
    });

    // Show continue button if selections already exist
    var contBtn = step2.querySelector('.quiz-continue');
    if (contBtn) {
      if (existing.length > 0) {
        contBtn.classList.add('visible');
      } else {
        contBtn.classList.remove('visible');
      }
    }
  }

  function renderStep3Tools() {
    var industry = answers['0'] || 'other';
    var toolKeys = industryTools[industry] || industryTools.other;
    var step3 = card.querySelector('.quiz-step[data-step="3"]');
    if (!step3) return;
    var container = step3.querySelector('.quiz-options');
    if (!container) return;

    container.innerHTML = '';
    toolKeys.forEach(function (key) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.dataset.value = key;
      var iconSpan = document.createElement('span');
      iconSpan.className = 'quiz-option-icon';
      iconSpan.innerHTML = industryToolIcons[key] || '';
      btn.appendChild(iconSpan);
      btn.appendChild(document.createTextNode(' ' + (industryToolLabels[key] || key)));
      container.appendChild(btn);
    });

    // Reset selections and continue button
    var contBtn = step3.querySelector('.quiz-continue');
    if (contBtn) contBtn.classList.remove('visible');
  }

  var caseStudies = {
    middleware: { title: 'E-commerce Middleware', summary: 'Squarespace-to-Amazon order sync, fully automated', metric: '45 min/day \u2192 zero', anchor: '#cs-middleware' },
    andinn: { title: 'Andinn Research Tool', summary: 'AI-powered evidence engine processing 847 clinical studies', metric: '847 studies in under 2 hours', anchor: '#cs-andinn' },
    tiktok: { title: 'TikTok Affiliate Agent', summary: 'Autonomous creator discovery, outreach, and compliance', metric: '94 creators discovered per cycle', anchor: '#cs-tiktok' },
    hedgefund: { title: 'Little Hedgefund', summary: 'Autonomous macro research and position management', metric: '15 currency pairs analysed before market open', anchor: '#cs-hedgefund' }
  };

  var industryCaseStudy = {
    ecommerce: 'middleware', health: 'andinn', finance: 'hedgefund',
    services: 'tiktok', creative: 'tiktok', other: 'tiktok'
  };

  var serviceIcons = {
    'Workflow Automation': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    'Data Pipeline': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    'AI Agent': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2a4 4 0 014 4v5H8V6a4 4 0 014-4z"/><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1"/><circle cx="15.5" cy="16" r="1"/></svg>',
    'AI Integration': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M9 15h6"/></svg>'
  };

  var fallbackParagraphs = {
    'Workflow Automation': 'Your biggest gains are in automating the repetitive process work that\u2019s eating your team\u2019s day. A serverless bridge between your existing platforms would eliminate the manual steps entirely \u2014 most clients see results within the first week.',
    'Data Pipeline': 'The data entry and spreadsheet work you\u2019re doing manually is exactly what a structured pipeline solves. We\u2019d connect your sources, automate the processing, and give you clean, queryable data without anyone touching a spreadsheet.',
    'AI Agent': 'Outreach at scale without losing the personal touch \u2014 that\u2019s what an AI agent handles. It discovers, qualifies, and manages the conversation so your team only steps in when it matters.',
    'AI Integration': 'Research and compliance work follows patterns even when it feels complex. An AI integration can process, score, and surface what matters \u2014 turning hours of reading into seconds of structured insight.'
  };

  // ── Hours slider (step 4) ──

  var hoursSlider = document.getElementById('quiz-hours-slider');
  var hoursValueEl = document.getElementById('quiz-hours-value');
  if (hoursSlider && hoursValueEl) {
    hoursSlider.addEventListener('input', function () {
      hoursValueEl.textContent = hoursSlider.value + ' hrs';
    });
  }

  // ── Progress ──

  function updateProgress() {
    progressBar.style.width = (currentStep / totalSteps) * 100 + '%';
  }

  // ── Directional step transitions ──

  function goToStep(index, direction) {
    if (isTransitioning) return;
    if (index < 0 || index >= totalSteps) return;
    isTransitioning = true;

    var exitClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
    var enterClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';

    var currentEl = steps[currentStep];
    currentEl.classList.remove('active');
    currentEl.classList.add(exitClass);

    setTimeout(function () {
      currentEl.classList.remove(exitClass);
      currentStep = index;
      updateProgress();

      // Render industry-specific options when entering steps 2 and 3
      if (index === 2) renderStep2TimeSinks();
      if (index === 3) renderStep3Tools();

      var nextEl = steps[currentStep];
      nextEl.classList.add('active', enterClass);
      setTimeout(function () {
        nextEl.classList.remove(enterClass);
        isTransitioning = false;
      }, 350);
    }, 300);
  }

  // ── Multi-select helpers ──

  function isMultiStep(stepEl) {
    return stepEl.hasAttribute('data-multi');
  }

  function getMultiMax(stepEl) {
    var max = parseInt(stepEl.dataset.multi, 10);
    return max || Infinity;
  }

  function getMultiSelections(stepEl) {
    var vals = [];
    stepEl.querySelectorAll('.quiz-option.selected').forEach(function (s) { vals.push(s.dataset.value); });
    return vals;
  }

  function updateMultiState(stepEl) {
    var max = getMultiMax(stepEl);
    var count = stepEl.querySelectorAll('.quiz-option.selected').length;
    var contBtn = stepEl.querySelector('.quiz-continue');
    if (contBtn) {
      if (count > 0) { contBtn.classList.add('visible'); }
      else { contBtn.classList.remove('visible'); }
    }
    if (max !== Infinity && count >= max) {
      stepEl.querySelectorAll('.quiz-option:not(.selected)').forEach(function (o) { o.classList.add('maxed'); });
    } else {
      stepEl.querySelectorAll('.quiz-option.maxed').forEach(function (o) { o.classList.remove('maxed'); });
    }
  }

  // ── Calculation ──

  function calculateHours() {
    var tasks = answers['2'] || ['orders'];
    var tools = answers['3'] || ['spreadsheets'];
    var userHours = parseInt(answers['4'], 10) || 15;

    var sumWeights = 0;
    tasks.forEach(function (t) { sumWeights += (taskWeights[t] || 0.25); });
    var maxWeight = tasks.length === 1 ? 0.35 : 0.65;
    var taskWeight = Math.min(sumWeights / maxWeight, 1);

    var toolCount = tools.indexOf('nothing') !== -1 ? 0 : tools.length;
    var toolBonus = Math.min(1 + 0.05 * Math.max(0, toolCount - 1), 1.20);

    // Cap the saveable percentage at 85% of user's stated hours
    var saveableFraction = Math.min(taskWeight * toolBonus * 0.7, 0.85);
    return Math.round(userHours * saveableFraction);
  }

  // ── Timeline estimate ──

  function getTimeline(hours, toolCount) {
    // More hours saved or more tools = slightly longer build
    if (hours <= 10 && toolCount <= 2) return '1\u20132 weeks';
    if (hours <= 25) return '2\u20133 weeks';
    return '2\u20134 weeks';
  }

  // ── Send quiz results via email ──

// ── Send quiz results via email ──
  function sendQuizEmail(data) {
    try {
      const emailFields = {
        'Business Name': data.businessName || 'Not provided',
        'Industry': data.industry,
        'Team Size': data.teamSize,
        'Time Sinks': data.timeSinks,
        'Current Tools': data.tools,
        'Hours Lost Per Week': data.hoursPerWeek,
        'Estimated Hours Saveable': data.hoursSaved,
        'Recommendation': data.recommendation,
        'Completed At': new Date().toLocaleString('en-GB')
      };
      
      if (data.specificPain) emailFields['Specific Pain Point'] = data.specificPain;
      if (data.idealTool) emailFields['Ideal Solution'] = data.idealTool;

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'info@pely.ai', // <-- Where you want to receive it
          subject: 'Quiz completed' + (data.businessName ? ' — ' + data.businessName : ''),
          fields: emailFields
        })
      });
    } catch (e) { /* silent fail */ }
  }

  // ── Contact form pre-fill ──

  var quizResultContext = null; // stored when result is shown

  function setQuizContext(bizName, service, hours, industry) {
    quizResultContext = { bizName: bizName, service: service, hours: hours, industry: industry };
  }

  function prefillContactForm() {
    if (!quizResultContext) return;
    var ctx = quizResultContext;

    // Context banner
    var banner = document.getElementById('form-context-banner');
    var bannerText = document.getElementById('form-context-text');
    if (banner && bannerText) {
      var text = 'Enquiring about ' + ctx.service;
      if (ctx.bizName) text += ' for ' + ctx.bizName;
      bannerText.textContent = text;
      banner.hidden = false;
    }

    // Pre-fill message
    var msgEl = document.getElementById('contact-message');
    if (msgEl && !msgEl.value) {
      var msg = 'Hi \u2014 I just took the automation quiz';
      if (ctx.bizName) msg += ' for ' + ctx.bizName;
      msg += '. It suggested ' + ctx.service + ' could save us ~' + ctx.hours + ' hours/week. I\u2019d love to chat about what that looks like.';
      msgEl.value = msg;
    }

    // Hidden field for your reference
    var hiddenEl = document.getElementById('form-quiz-context');
    if (hiddenEl) {
      hiddenEl.value = JSON.stringify(ctx);
    }
  }

  // ── Dynamic LLM questions ──

  function generateDynamicQuestion(questionNumber) {
    var qEl = document.getElementById('dynamic-q' + questionNumber);
    var contBtn = document.getElementById('quiz-continue-' + (questionNumber === 1 ? 6 : 7));
    if (!qEl) return;

    // Show shimmer while loading
    qEl.textContent = '\u00A0';
    qEl.classList.add('shimmer');
    if (contBtn) contBtn.classList.remove('visible');

    var industry = answers['0'] || 'services';
    var teamSize = answers['1'] || 'small';
    var timeSinks = (answers['2'] || ['orders']).join(', ');
    var tools = (answers['3'] || ['spreadsheets']).join(', ');
    var hoursPerWeek = answers['4'] || 15;
    var bizName = (answers['5'] || '').trim();

    var context = 'You are helping qualify a prospect for Pely.ai, an AI automation company.\n\n' +
      'Here\'s what we know:\n' +
      '- Industry: ' + industry + '\n' +
      '- Team size: ' + teamSize + '\n' +
      '- Time sinks: ' + timeSinks + '\n' +
      '- Tools: ' + tools + '\n' +
      '- Hours lost per week: ' + hoursPerWeek + '\n' +
      '- Business name: ' + (bizName || 'Not provided') + '\n\n';

    var instruction;
    if (questionNumber === 1) {
      instruction = 'Generate exactly ONE short, specific follow-up question (1 sentence) that asks them to describe the single most repetitive or time-consuming task in their workflow. Make it specific to their industry and pain points \u2014 not generic. Output ONLY the question text, nothing else.';
    } else {
      context += '- Their answer about repetitive tasks: ' + (answers['6'] || '') + '\n\n';
      instruction = 'Generate exactly ONE short follow-up question (1 sentence) that helps us understand what the ideal automated solution would look like for them \u2014 what would it do, what would it connect, what would change. Reference their specific answer. Output ONLY the question text, nothing else.';
    }

    fetch('/api/quiz-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat',
        system: context + instruction,
        messages: [{ role: 'user', content: 'Generate the question.' }]
      })
    })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      if (data.text) {
        qEl.textContent = data.text;
        qEl.classList.remove('shimmer');
        if (contBtn) contBtn.classList.add('visible');
      } else {
        skipDynamicSteps();
      }
    })
    .catch(function () {
      skipDynamicSteps();
    });
  }

  function skipDynamicSteps() {
    // API unavailable — skip dynamic questions and go straight to result
    answers['6'] = '';
    answers['7'] = '';
    // Wait for any in-progress transition to finish before showing result
    if (isTransitioning) {
      var waitForTransition = setInterval(function () {
        if (!isTransitioning) {
          clearInterval(waitForTransition);
          showResult();
        }
      }, 100);
    } else {
      showResult();
    }
  }

  // ── Result screen ──

  function showResult() {
    if (isTransitioning) return;
    isTransitioning = true;

    var currentEl = steps[currentStep];
    currentEl.classList.remove('active');
    currentEl.classList.add('slide-out-left');

    setTimeout(function () {
      currentEl.classList.remove('slide-out-left');
      progressBar.style.width = '100%';

      var industry = answers['0'] || 'services';
      var tasks = answers['2'] || ['orders'];
      var tools = answers['3'] || ['spreadsheets'];
      var bizName = (answers['5'] || '').trim();

      var primaryTask = tasks[0];
      var secondaryTask = tasks.length > 1 ? tasks[1] : null;
      var rec = recommendations[primaryTask];
      var framing = industryFraming[industry];
      var hours = calculateHours();

      // Element 1: Header
      document.getElementById('qr-business').textContent = bizName ? 'for ' + bizName : '';

      // Element 2: Hero stat (set to 0, count up later)
      var hoursEl = document.getElementById('qr-hours');
      hoursEl.textContent = '0';
      document.getElementById('qr-hours-annual').textContent = '';

      // Element 3: Service card
      document.getElementById('qr-service-icon').innerHTML = serviceIcons[rec.service] || '';
      document.getElementById('qr-service-name').textContent = rec.service;
      document.getElementById('qr-service-desc').textContent = framing.framingPrefix + framing.examples[primaryTask];

      var secondaryEl = document.getElementById('qr-secondary');
      if (secondaryTask) {
        secondaryEl.style.display = '';
        document.getElementById('qr-secondary-name').textContent = recommendations[secondaryTask].service;
      } else {
        secondaryEl.style.display = 'none';
      }

      // Starting point — pick best tool by priority
      var bestTool = 'nothing';
      for (var i = 0; i < toolPriority.length; i++) {
        if (tools.indexOf(toolPriority[i]) !== -1) { bestTool = toolPriority[i]; break; }
      }
      var sp = toolStartingPoints[bestTool];
      document.getElementById('qr-starting-point').innerHTML = '<strong>Starting point:</strong> ' + sp.label + ' \u2014 ' + sp.detail;

      // Element 4: Case study
      var csKey = industryCaseStudy[industry];
      if (tools.indexOf('squarespace') !== -1 || tools.indexOf('amazon') !== -1) csKey = 'middleware';
      else if (tools.indexOf('tiktok') !== -1 && primaryTask === 'outreach') csKey = 'tiktok';
      var cs = caseStudies[csKey];
      document.getElementById('qr-cs-title').textContent = cs.title;
      document.getElementById('qr-cs-summary').textContent = cs.summary;
      document.getElementById('qr-cs-metric').textContent = cs.metric;
      document.getElementById('qr-cs-link').href = (isStandalone ? 'https://pely.ai/' : '') + cs.anchor;

      // Timeline estimate
      var toolCount = tools.indexOf('nothing') !== -1 ? 0 : tools.length;
      var timeline = getTimeline(hours, toolCount);
      document.getElementById('qr-timeline').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Your first automation could be running in ' + timeline;

      // Store context for contact form pre-fill
      setQuizContext(bizName, rec.service, hours, industry);

      // Show result container
      if (typeof plausible !== 'undefined') plausible('Quiz Completed', { props: { industry: industry, service: rec.service } });
      resultEl.classList.add('active');
      isTransitioning = false;

      // Staggered reveal of elements
      var els = resultEl.querySelectorAll('.quiz-result-el');
      els.forEach(function (el) { el.classList.remove('visible'); });
      var delays = [0, 300, 600, 900, 1200, 1500];
      els.forEach(function (el, idx) {
        if (idx < delays.length) {
          setTimeout(function () { el.classList.add('visible'); }, reducedMotion ? 0 : delays[idx]);
        }
      });

      // Count-up on hours (synced with stat element reveal at 300ms)
      var userHours = parseInt(answers['4'], 10) || 15;
      setTimeout(function () {
        quizCountUp(hoursEl, hours, ' of your ' + userHours + ' hours saved per week', '');
        document.getElementById('qr-hours-annual').textContent = 'That\u2019s ' + (hours * 52).toLocaleString() + ' hours a year your team gets back';
      }, reducedMotion ? 0 : 300);

      // AI paragraph (at 1200ms when its element reveals)
      var aiTextEl = document.getElementById('qr-ai-text');
      aiTextEl.textContent = '';
      aiTextEl.classList.add('shimmer');

      var aiDelay = reducedMotion ? 0 : 1200;
      setTimeout(function () {
        var fallbackText = fallbackParagraphs[rec.service] || fallbackParagraphs['Workflow Automation'];
        if (bizName) {
          fallbackText = 'At ' + bizName + ', ' + fallbackText.charAt(0).toLowerCase() + fallbackText.slice(1);
        }

        function renderAiText(text) {
          aiTextEl.classList.remove('shimmer');
          if (reducedMotion) {
            aiTextEl.textContent = text;
            var ctaEl = document.getElementById('qr-ctas');
            if (ctaEl) ctaEl.classList.add('visible');
          } else {
            typeText(aiTextEl, text, function () {
              var ctaEl = document.getElementById('qr-ctas');
              if (ctaEl) ctaEl.classList.add('visible');
            });
          }
        }

        // Try the API proxy with an 8-second timeout, fall back on failure
        var aiDone = false;
        var aiTimeout = setTimeout(function () {
          if (!aiDone) { aiDone = true; renderAiText(fallbackText); }
        }, 8000);

        fetch('/api/quiz-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: bizName,
            industry: industry,
            teamSize: answers['1'] || 'small',
            timeSinks: tasks.join(', '),
            tools: tools.join(', '),
            hoursPerWeek: answers['4'] || 15,
            hours: hours,
            specificPain: answers['6'] || '',
            idealTool: answers['7'] || ''
          })
        })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          if (!aiDone && data.text) {
            aiDone = true; clearTimeout(aiTimeout);
            renderAiText(data.text);
          }
        })
        .catch(function () {
          if (!aiDone) { aiDone = true; clearTimeout(aiTimeout); renderAiText(fallbackText); }
        });
      }, aiDelay);

      // Save to localStorage
      try {
        localStorage.setItem('pely_quiz', JSON.stringify({
          timestamp: Date.now(),
          businessName: bizName,
          industry: industry,
          teamSize: answers['1'] || 'small',
          timeSinks: tasks,
          tools: tools,
          hoursPerWeek: answers['4'] || 15,
          hoursSaved: hours,
          recommendation: rec.service,
          specificPain: answers['6'] || '',
          idealTool: answers['7'] || ''
        }));
      } catch (e) { /* localStorage unavailable */ }

      // Email quiz results
      sendQuizEmail({
        businessName: bizName, industry: industry,
        teamSize: answers['1'] || 'small', timeSinks: tasks.join(', '),
        tools: tools.join(', '), hoursPerWeek: answers['4'] || 15,
        hoursSaved: hours, recommendation: rec.service,
        specificPain: answers['6'] || '', idealTool: answers['7'] || ''
      });
    }, 300);
  }

  // ── Count-up animation ──

  function quizCountUp(el, target, suffix, prefix) {
    var pre = prefix || '';
    var suf = suffix || '';
    if (reducedMotion) { el.textContent = pre + target.toLocaleString() + suf; return; }
    var duration = 1500;
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = pre + Math.round(eased * target).toLocaleString() + suf;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Typing animation ──

  function typeText(el, text, callback) {
    var i = 0;
    var cursor = document.createElement('span');
    cursor.className = 'quiz-ai-cursor';
    el.textContent = '';
    el.appendChild(cursor);
    function step() {
      if (i >= text.length) {
        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
        if (callback) callback();
        return;
      }
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      setTimeout(step, 30);
    }
    step();
  }

  // ── Click handler ──

  card.addEventListener('click', function (e) {
    // Back button
    var backBtn = e.target.closest('.quiz-back');
    if (backBtn) {
      var backStep = backBtn.closest('.quiz-step');
      if (backStep) {
        var backIndex = parseInt(backStep.dataset.step, 10);
        if (backIndex > 0) goToStep(backIndex - 1, 'backward');
      }
      return;
    }

    // Continue button (multi-select advance + step 5 submit)
    var contBtn = e.target.closest('.quiz-continue');
    if (contBtn) {
      var contStep = contBtn.closest('.quiz-step');
      if (!contStep) return;
      var contIndex = parseInt(contStep.dataset.step, 10);
      if (isMultiStep(contStep)) {
        answers[String(contIndex)] = getMultiSelections(contStep);
      }
      if (contIndex === 4) {
        var slider = document.getElementById('quiz-hours-slider');
        answers['4'] = slider ? parseInt(slider.value, 10) : 15;
        goToStep(5, 'forward');
        return;
      }
      if (contIndex === 5) {
        var inputEl = document.getElementById('quiz-biz-name');
        answers['5'] = inputEl ? inputEl.value : '';
        generateDynamicQuestion(1);
        goToStep(6, 'forward');
        return;
      }
      if (contIndex === 6) {
        answers['6'] = (document.getElementById('dynamic-a1') || {}).value || '';
        generateDynamicQuestion(2);
        goToStep(7, 'forward');
        return;
      }
      if (contIndex === 7) {
        answers['7'] = (document.getElementById('dynamic-a2') || {}).value || '';
        showResult();
        return;
      }
      if (contIndex < totalSteps - 1) {
        goToStep(contIndex + 1, 'forward');
      } else {
        showResult();
      }
      return;
    }

    // Option selection
    var btn = e.target.closest('.quiz-option');
    if (!btn || isTransitioning) return;
    var step = btn.closest('.quiz-step');
    if (!step) return;

    var stepIndex = parseInt(step.dataset.step, 10);

    if (isMultiStep(step)) {
      var value = btn.dataset.value;
      // "Nothing specific" deselects all others and vice versa (step 3)
      if (stepIndex === 3 && value === 'nothing') {
        step.querySelectorAll('.quiz-option').forEach(function (o) {
          if (o !== btn) o.classList.remove('selected');
        });
        btn.classList.toggle('selected');
      } else if (stepIndex === 3) {
        var nothingBtn = step.querySelector('.quiz-option[data-value="nothing"]');
        if (nothingBtn) nothingBtn.classList.remove('selected');
        btn.classList.toggle('selected');
      } else {
        btn.classList.toggle('selected');
      }
      updateMultiState(step);
    } else {
      // Single-select: gold highlight → 400ms pause → advance
      answers[String(stepIndex)] = btn.dataset.value;
      step.querySelectorAll('.quiz-option').forEach(function (o) { o.classList.remove('selected'); });
      btn.classList.add('selected');
      setTimeout(function () {
        if (stepIndex < totalSteps - 1) {
          goToStep(stepIndex + 1, 'forward');
        } else {
          showResult();
        }
      }, 400);
    }
  });

  // ── Restart ──

  document.getElementById('quiz-restart').addEventListener('click', function () {
    answers = {};
    resultEl.classList.remove('active');
    resultEl.querySelectorAll('.quiz-result-el').forEach(function (el) { el.classList.remove('visible'); });
    card.querySelectorAll('.quiz-option.selected').forEach(function (o) { o.classList.remove('selected'); });
    card.querySelectorAll('.quiz-option.maxed').forEach(function (o) { o.classList.remove('maxed'); });
    card.querySelectorAll('.quiz-continue').forEach(function (b) { b.classList.remove('visible'); });
    var inputEl = document.getElementById('quiz-biz-name');
    if (inputEl) inputEl.value = '';
    // Reset hours slider
    var sliderEl = document.getElementById('quiz-hours-slider');
    var sliderValEl = document.getElementById('quiz-hours-value');
    if (sliderEl) sliderEl.value = 15;
    if (sliderValEl) sliderValEl.textContent = '15 hrs';
    // Clear dynamic question steps
    var da1 = document.getElementById('dynamic-a1');
    var da2 = document.getElementById('dynamic-a2');
    if (da1) da1.value = '';
    if (da2) da2.value = '';
    var dq1 = document.getElementById('dynamic-q1');
    var dq2 = document.getElementById('dynamic-q2');
    if (dq1) { dq1.textContent = '\u00A0'; dq1.classList.add('shimmer'); }
    if (dq2) { dq2.textContent = '\u00A0'; dq2.classList.add('shimmer'); }
    var dc6 = document.getElementById('quiz-continue-6');
    var dc7 = document.getElementById('quiz-continue-7');
    if (dc6) dc6.classList.remove('visible');
    if (dc7) dc7.classList.remove('visible');
    currentStep = 0;
    progressBar.style.width = '0%';
    steps.forEach(function (s) {
      s.classList.remove('active', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    });
    steps[0].classList.add('active');
    var banner = document.getElementById('quiz-banner');
    if (banner) banner.classList.remove('visible');
  });

  // ── localStorage: returning user banner ──

  try {
    var saved = JSON.parse(localStorage.getItem('pely_quiz'));
    if (saved && saved.timestamp) {
      var age = Date.now() - saved.timestamp;
      var sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (age < sevenDays) {
        var banner = document.getElementById('quiz-banner');
        var date = new Date(saved.timestamp);
        var dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        banner.innerHTML = 'You last took this on ' + dateStr + ' \u2014 <a id="quiz-banner-results">see your results</a> or <a id="quiz-banner-retake">retake</a>';
        banner.classList.add('visible');

        document.getElementById('quiz-banner-results').addEventListener('click', function (ev) {
          ev.preventDefault();
          answers = {
            '0': saved.industry,
            '1': saved.teamSize,
            '2': saved.timeSinks,
            '3': saved.tools,
            '4': saved.hoursPerWeek || 15,
            '5': saved.businessName || ''
          };
          banner.classList.remove('visible');
          steps.forEach(function (s) { s.classList.remove('active'); });
          showResult();
        });

        document.getElementById('quiz-banner-retake').addEventListener('click', function (ev) {
          ev.preventDefault();
          banner.classList.remove('visible');
          try { localStorage.removeItem('pely_quiz'); } catch (ex) { /* noop */ }
        });
      }
    }
  } catch (e) { /* localStorage unavailable */ }

  // ── Chat mode ──

  var chatContainer = document.getElementById('quiz-chat-container');
  var chatMessages = document.getElementById('quiz-chat-messages');
  var chatChips = document.getElementById('quiz-chat-chips');
  var chatInput = document.getElementById('quiz-chat-input');
  var chatSend = document.getElementById('quiz-chat-send');
  var apiAvailable = false;
  var healthChecked = false;
  var chatActive = false;
  var chatHistory = []; // { role, content } for API
  var chatCollected = {}; // data collected during chat
  var chatWaiting = false; // waiting for API response

  // Fire health check on first step-0 click
  function checkApiHealth() {
    if (healthChecked) return;
    healthChecked = true;
    fetch('/api/quiz-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'health' })
    })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      if (data.status === 'ok') apiAvailable = true;
    })
    .catch(function () { apiAvailable = false; });
  }

  // System prompt for Claude
  function buildSystemPrompt() {
    var industry = answers['0'] || 'services';
    var teamSize = answers['1'] || 'small';
    var tasks = answers['2'] || ['orders'];

    // Build industry-aware tool examples
    var toolKeys = industryTools[industry] || industryTools.other;
    var toolExamples = toolKeys.map(function (k) { return industryToolLabels[k] || k; }).join(', ');

    return 'You are a friendly AI assistant on the Pely.ai website — a Manchester-based company that builds AI workflow automations for small businesses.\n\n' +
      'The user just completed part of our automation quiz. Here is what we know:\n' +
      '- Industry: ' + industry + '\n' +
      '- Team size: ' + teamSize + '\n' +
      '- Biggest time sinks: ' + tasks.join(', ') + '\n\n' +
      'Your job is to collect the remaining information through friendly, natural conversation. You need to find out:\n' +
      '1. What tools/platforms they currently use (relevant to their industry, e.g. ' + toolExamples + ')\n' +
      '2. Roughly how many hours a week their team loses to these repetitive tasks (a number, e.g. 5, 10, 20, 30, 40+)\n' +
      '3. Their business name (optional)\n' +
      '4. A specific question about their most painful repetitive workflow — what exact task or process eats the most time\n' +
      '5. A follow-up about what the ideal automated solution would look like — what would it do, connect, or replace\n\n' +
      'Guidelines:\n' +
      '- Be warm, conversational, and concise (2-3 sentences max per message)\n' +
      '- Reference their industry and pain points naturally\n' +
      '- Ask ONE question at a time\n' +
      '- After collecting tools and hours, ask the two probing questions (items 4 and 5) before generating the result\n' +
      '- When you have enough info (tools + hours + specific pain + ideal tool at minimum), generate the result\n' +
      '- Do NOT mention that you are collecting data or generating a result — keep it natural\n\n' +
      'When you have collected enough data, end your FINAL message with a result block in EXACTLY this format (on new lines, no extra text after):\n\n' +
      '===RESULT===\n' +
      'tools: comma-separated tool keys from [' + toolKeys.join(', ') + ']\n' +
      'hoursPerWeek: the number they gave (e.g. 15)\n' +
      'businessName: the name they gave or empty\n' +
      'specificPain: their answer about the most painful repetitive task\n' +
      'idealTool: their answer about what the ideal solution would do\n' +
      '===END===\n\n' +
      'The visible part of your final message (before ===RESULT===) should be a brief, encouraging wrap-up like "Great, let me put your report together..."';
  }

  function enterChatMode() {
    chatActive = true;
    chatHistory = [];
    chatCollected = {};

    // Hide steps, show chat
    steps.forEach(function (s) { s.classList.remove('active', 'slide-out-left', 'slide-out-right'); });
    card.classList.add('chat-mode');
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.height = '100%';
    progressBar.style.width = '50%';

    // Send initial AI message
    var industry = answers['0'] || 'services';
    var tasks = answers['2'] || ['orders'];
    var sinks = industryTimeSinks[industry] || industryTimeSinks.other;
    var sinkLabelMap = {};
    sinks.forEach(function (s) { sinkLabelMap[s.key] = s.label.toLowerCase(); });
    var taskStr = tasks.map(function (t) { return sinkLabelMap[t] || t; }).join(' and ');

    var industryToolKeys = industryTools[industry] || industryTools.other;
    var exampleTools = industryToolKeys.slice(0, 3).map(function (k) { return industryToolLabels[k] || k; }).join(', ');
    var openingMsg = 'Nice — so ' + taskStr + ' is eating most of your time. Let me ask a couple more questions to build your automation report.\n\nWhat tools or platforms does your team currently use? Things like ' + exampleTools + ' — anything you rely on day to day.';

    addChatBubble('ai', openingMsg);
    chatHistory.push({ role: 'assistant', content: openingMsg });

    // Show tool chips
    showToolChips();
  }

  function addChatBubble(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    var typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chat-typing-indicator';
    typing.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    var el = document.getElementById('chat-typing-indicator');
    if (el) el.parentNode.removeChild(el);
  }

  function showToolChips() {
    chatChips.innerHTML = '';
    var industry = answers['0'] || 'other';
    var toolKeys = industryTools[industry] || industryTools.other;

    toolKeys.forEach(function (key) {
      var chip = document.createElement('button');
      chip.className = 'chat-chip';
      chip.dataset.value = key;
      chip.textContent = industryToolLabels[key] || key;
      chatChips.appendChild(chip);
    });

    var doneBtn = document.createElement('button');
    doneBtn.className = 'chat-chip-done';
    doneBtn.id = 'chat-chips-done';
    doneBtn.textContent = 'Done \u2713';
    chatChips.appendChild(doneBtn);

    // Chip click handlers
    chatChips.addEventListener('click', handleChipClick);
  }

  function handleChipClick(e) {
    var chip = e.target.closest('.chat-chip');
    var doneBtn = e.target.closest('.chat-chip-done');

    if (chip) {
      var val = chip.dataset.value;
      // "Nothing specific" logic
      if (val === 'nothing') {
        chatChips.querySelectorAll('.chat-chip').forEach(function (c) {
          if (c !== chip) c.classList.remove('selected');
        });
        chip.classList.toggle('selected');
      } else {
        var nothingChip = chatChips.querySelector('.chat-chip[data-value="nothing"]');
        if (nothingChip) nothingChip.classList.remove('selected');
        chip.classList.toggle('selected');
      }
      // Show done button if any selected
      var doneEl = document.getElementById('chat-chips-done');
      var anySelected = chatChips.querySelectorAll('.chat-chip.selected').length > 0;
      if (doneEl) doneEl.classList.toggle('visible', anySelected);
      return;
    }

    if (doneBtn) {
      var selected = [];
      chatChips.querySelectorAll('.chat-chip.selected').forEach(function (c) {
        selected.push(c.dataset.value);
      });
      if (selected.length === 0) return;

      chatCollected.tools = selected;
      var labels = [];
      chatChips.querySelectorAll('.chat-chip.selected').forEach(function (c) {
        labels.push(c.textContent);
      });

      // Show as user message and clear chips
      addChatBubble('user', labels.join(', '));
      chatChips.innerHTML = '';
      chatChips.removeEventListener('click', handleChipClick);

      // Send to Claude
      chatHistory.push({ role: 'user', content: 'I use: ' + labels.join(', ') });
      sendChatMessage();
    }
  }

  function showHoursChips() {
    chatChips.innerHTML = '';
    var options = [
      { value: 5, label: '~5 hrs' },
      { value: 10, label: '~10 hrs' },
      { value: 20, label: '~20 hrs' },
      { value: 30, label: '~30 hrs' },
      { value: 40, label: '40+ hrs' }
    ];

    options.forEach(function (o) {
      var chip = document.createElement('button');
      chip.className = 'chat-chip';
      chip.dataset.value = o.value;
      chip.textContent = o.label;
      chip.addEventListener('click', function () {
        chatCollected.hoursPerWeek = o.value;
        addChatBubble('user', o.label + '/week');
        chatChips.innerHTML = '';
        chatHistory.push({ role: 'user', content: o.label + ' per week' });
        sendChatMessage();
      });
      chatChips.appendChild(chip);
    });
  }

  function sendChatMessage() {
    if (chatWaiting) return;
    chatWaiting = true;
    chatSend.disabled = true;
    showTypingIndicator();

    fetch('/api/quiz-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat',
        system: buildSystemPrompt(),
        messages: chatHistory
      })
    })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      removeTypingIndicator();
      chatWaiting = false;
      chatSend.disabled = false;

      if (!data.text) { handleChatFailure(); return; }

      var text = data.text;

      // Check for result block
      var resultBlock = parseResultBlock(text);
      if (resultBlock) {
        // Show visible part (before ===RESULT===)
        var visibleText = text.split('===RESULT===')[0].trim();
        if (visibleText) {
          addChatBubble('ai', visibleText);
          chatHistory.push({ role: 'assistant', content: visibleText });
        }
        // Merge parsed data and show result
        if (resultBlock.tools) chatCollected.tools = resultBlock.tools;
        if (resultBlock.hoursPerWeek) chatCollected.hoursPerWeek = resultBlock.hoursPerWeek;
        if (resultBlock.businessName) chatCollected.businessName = resultBlock.businessName;
        if (resultBlock.specificPain) chatCollected.specificPain = resultBlock.specificPain;
        if (resultBlock.idealTool) chatCollected.idealTool = resultBlock.idealTool;

        progressBar.style.width = '90%';
        setTimeout(function () { showResultFromChat(); }, 1200);
        return;
      }

      // Normal message
      addChatBubble('ai', text);
      chatHistory.push({ role: 'assistant', content: text });

      // Detect what chips to show based on response content
      var lowerText = text.toLowerCase();
      if (!chatCollected.tools && (lowerText.indexOf('tool') !== -1 || lowerText.indexOf('platform') !== -1 || lowerText.indexOf('software') !== -1 || lowerText.indexOf('use') !== -1)) {
        showToolChips();
      } else if (!chatCollected.hoursPerWeek && (lowerText.indexOf('hour') !== -1 || lowerText.indexOf('time') !== -1 || lowerText.indexOf('week') !== -1 || lowerText.indexOf('spend') !== -1 || lowerText.indexOf('lose') !== -1)) {
        showHoursChips();
      }
    })
    .catch(function () {
      removeTypingIndicator();
      chatWaiting = false;
      chatSend.disabled = false;
      handleChatFailure();
    });
  }

  function parseResultBlock(text) {
    var startIdx = text.indexOf('===RESULT===');
    var endIdx = text.indexOf('===END===');
    if (startIdx === -1 || endIdx === -1) return null;

    var block = text.substring(startIdx + 12, endIdx).trim();
    var result = {};
    block.split('\n').forEach(function (line) {
      var parts = line.split(':');
      if (parts.length < 2) return;
      var key = parts[0].trim();
      var val = parts.slice(1).join(':').trim();
      if (key === 'tools' && val) {
        result.tools = val.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      } else if (key === 'hoursPerWeek' && val) {
        result.hoursPerWeek = parseInt(val, 10) || 15;
      } else if (key === 'businessName' && val) {
        result.businessName = val;
      } else if (key === 'specificPain' && val) {
        result.specificPain = val;
      } else if (key === 'idealTool' && val) {
        result.idealTool = val;
      }
    });
    return result;
  }

  function showResultFromChat() {
    // Map chat-collected data into answers
    answers['3'] = chatCollected.tools || ['spreadsheets'];
    answers['4'] = chatCollected.hoursPerWeek || 15;
    answers['5'] = chatCollected.businessName || '';
    answers['6'] = chatCollected.specificPain || '';
    answers['7'] = chatCollected.idealTool || '';

    // Collapse chat above result
    chatContainer.classList.add('above-result');
    card.classList.remove('chat-mode');

    // Show the result screen (reuse existing showResult logic)
    showResultDirect();
  }

  // Direct result render (no slide-out transition, used after chat)
  function showResultDirect() {
    var industry = answers['0'] || 'services';
    var tasks = answers['2'] || ['orders'];
    var tools = answers['3'] || ['spreadsheets'];
    var bizName = (answers['5'] || '').trim();

    var primaryTask = tasks[0];
    var secondaryTask = tasks.length > 1 ? tasks[1] : null;
    var rec = recommendations[primaryTask];
    var framing = industryFraming[industry];
    var hours = calculateHours();

    // Element 1: Header
    document.getElementById('qr-business').textContent = bizName ? 'for ' + bizName : '';

    // Element 2: Hero stat
    var hoursEl = document.getElementById('qr-hours');
    hoursEl.textContent = '0';
    document.getElementById('qr-hours-annual').textContent = '';

    // Element 3: Service card
    document.getElementById('qr-service-icon').innerHTML = serviceIcons[rec.service] || '';
    document.getElementById('qr-service-name').textContent = rec.service;
    document.getElementById('qr-service-desc').textContent = framing.framingPrefix + framing.examples[primaryTask];

    var secondaryEl = document.getElementById('qr-secondary');
    if (secondaryTask) {
      secondaryEl.style.display = '';
      document.getElementById('qr-secondary-name').textContent = recommendations[secondaryTask].service;
    } else {
      secondaryEl.style.display = 'none';
    }

    // Starting point
    var bestTool = 'nothing';
    for (var i = 0; i < toolPriority.length; i++) {
      if (tools.indexOf(toolPriority[i]) !== -1) { bestTool = toolPriority[i]; break; }
    }
    var sp = toolStartingPoints[bestTool];
    document.getElementById('qr-starting-point').innerHTML = '<strong>Starting point:</strong> ' + sp.label + ' \u2014 ' + sp.detail;

    // Case study
    var csKey = industryCaseStudy[industry];
    if (tools.indexOf('squarespace') !== -1 || tools.indexOf('amazon') !== -1) csKey = 'middleware';
    else if (tools.indexOf('tiktok') !== -1 && primaryTask === 'outreach') csKey = 'tiktok';
    var cs = caseStudies[csKey];
    document.getElementById('qr-cs-title').textContent = cs.title;
    document.getElementById('qr-cs-summary').textContent = cs.summary;
    document.getElementById('qr-cs-metric').textContent = cs.metric;
    document.getElementById('qr-cs-link').href = (isStandalone ? 'https://pely.ai/' : '') + cs.anchor;

    // Timeline estimate
    var toolCount = tools.indexOf('nothing') !== -1 ? 0 : tools.length;
    var timeline = getTimeline(hours, toolCount);
    document.getElementById('qr-timeline').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Your first automation could be running in ' + timeline;

    // Store context for contact form pre-fill
    setQuizContext(bizName, rec.service, hours, industry);

    // Show result
    progressBar.style.width = '100%';
    resultEl.classList.add('active');

    // Staggered reveal
    var els = resultEl.querySelectorAll('.quiz-result-el');
    els.forEach(function (el) { el.classList.remove('visible'); });
    var delays = [0, 300, 600, 900, 1200, 1500];
    els.forEach(function (el, idx) {
      if (idx < delays.length) {
        setTimeout(function () { el.classList.add('visible'); }, reducedMotion ? 0 : delays[idx]);
      }
    });

    // Count-up
    var userHoursD = parseInt(answers['4'], 10) || 15;
    setTimeout(function () {
      quizCountUp(hoursEl, hours, ' of your ' + userHoursD + ' hours saved per week', '');
      document.getElementById('qr-hours-annual').textContent = 'That\u2019s ' + (hours * 52).toLocaleString() + ' hours a year your team gets back';
    }, reducedMotion ? 0 : 300);

    // AI paragraph
    var aiTextEl = document.getElementById('qr-ai-text');
    aiTextEl.textContent = '';
    aiTextEl.classList.add('shimmer');

    var aiDelay = reducedMotion ? 0 : 1200;
    setTimeout(function () {
      var fallbackText = fallbackParagraphs[rec.service] || fallbackParagraphs['Workflow Automation'];
      if (bizName) {
        fallbackText = 'At ' + bizName + ', ' + fallbackText.charAt(0).toLowerCase() + fallbackText.slice(1);
      }

      function renderAiText(text) {
        aiTextEl.classList.remove('shimmer');
        if (reducedMotion) {
          aiTextEl.textContent = text;
          var ctaEl = document.getElementById('qr-ctas');
          if (ctaEl) ctaEl.classList.add('visible');
        } else {
          typeText(aiTextEl, text, function () {
            var ctaEl = document.getElementById('qr-ctas');
            if (ctaEl) ctaEl.classList.add('visible');
          });
        }
      }

      var aiDone = false;
      var aiTimeout = setTimeout(function () {
        if (!aiDone) { aiDone = true; renderAiText(fallbackText); }
      }, 8000);

      fetch('/api/quiz-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: bizName,
          industry: industry,
          teamSize: answers['1'] || 'small',
          timeSinks: tasks.join(', '),
          tools: tools.join(', '),
          hoursPerWeek: answers['4'] || 15,
          hours: hours,
          specificPain: answers['6'] || '',
          idealTool: answers['7'] || ''
        })
      })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (data) {
        if (!aiDone && data.text) {
          aiDone = true; clearTimeout(aiTimeout);
          renderAiText(data.text);
        }
      })
      .catch(function () {
        if (!aiDone) { aiDone = true; clearTimeout(aiTimeout); renderAiText(fallbackText); }
      });
    }, aiDelay);

    // Save to localStorage
    try {
      localStorage.setItem('pely_quiz', JSON.stringify({
        timestamp: Date.now(),
        businessName: bizName,
        industry: industry,
        teamSize: answers['1'] || 'small',
        timeSinks: tasks,
        tools: tools,
        hoursPerWeek: answers['4'] || 15,
        hoursSaved: hours,
        recommendation: rec.service,
        conversational: chatActive,
        specificPain: answers['6'] || '',
        idealTool: answers['7'] || ''
      }));
    } catch (e) { /* localStorage unavailable */ }

    // Email quiz results
    sendQuizEmail({
      businessName: bizName, industry: industry,
      teamSize: answers['1'] || 'small', timeSinks: tasks.join(', '),
      tools: tools.join(', '), hoursPerWeek: answers['4'] || 15,
      hoursSaved: hours, recommendation: rec.service,
      specificPain: answers['6'] || '', idealTool: answers['7'] || ''
    });
  }

  function handleChatFailure() {
    // If we have enough data from chat, show result with what we have
    if (chatCollected.tools || chatCollected.hoursPerWeek) {
      answers['3'] = chatCollected.tools || ['spreadsheets'];
      answers['4'] = chatCollected.hoursPerWeek || 15;
      answers['5'] = chatCollected.businessName || '';
      answers['6'] = chatCollected.specificPain || '';
      answers['7'] = chatCollected.idealTool || '';

      addChatBubble('ai', 'Let me put your report together with what we\u2019ve discussed...');
      setTimeout(function () { showResultFromChat(); }, 1000);
      return;
    }

    // Not enough data — fall back to step 3 of the regular quiz
    chatActive = false;
    card.classList.remove('chat-mode');
    chatContainer.style.display = 'none';
    chatChips.innerHTML = '';
    goToStep(3, 'forward');
  }

  // Chat text input handler
  function handleChatSubmit() {
    if (chatWaiting) return;
    var text = chatInput.value.trim();
    if (!text) return;

    addChatBubble('user', text);
    chatInput.value = '';
    chatChips.innerHTML = ''; // Clear any chips
    chatHistory.push({ role: 'user', content: text });
    sendChatMessage();
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleChatSubmit(); }
    });
  }
  if (chatSend) {
    chatSend.addEventListener('click', handleChatSubmit);
  }

  // Hook into existing click handler — fire health check on first step-0 click
  var origClickHandler = card.onclick;
  card.addEventListener('click', function (e) {
    // Health check on first click in step 0
    if (!healthChecked) {
      var btn = e.target.closest('.quiz-option');
      if (btn) {
        var step = btn.closest('.quiz-step');
        if (step && step.dataset.step === '0') {
          checkApiHealth();
        }
      }
    }
  }, true); // capture phase so it fires before the main handler

  // Intercept continue button on step 2 to potentially fork into chat mode
  var origContBtnHandler = null;
  var step2ContBtn = document.getElementById('quiz-continue-2');
  if (step2ContBtn) {
    step2ContBtn.addEventListener('click', function (e) {
      if (apiAvailable && !chatActive) {
        e.stopPropagation(); // prevent the normal handler
        // Collect step 2 answers
        var step2El = step2ContBtn.closest('.quiz-step');
        if (step2El && isMultiStep(step2El)) {
          answers['2'] = getMultiSelections(step2El);
        }
        enterChatMode();
      }
      // If API not available, let normal click handler proceed to step 3
    }, true); // capture phase
  }

  // Update restart to also reset chat state
  var origRestart = document.getElementById('quiz-restart');
  if (origRestart) {
    origRestart.addEventListener('click', function () {
      chatActive = false;
      chatHistory = [];
      chatCollected = {};
      chatWaiting = false;
      card.classList.remove('chat-mode');
      chatContainer.style.display = '';
      chatContainer.classList.remove('above-result');
      chatMessages.innerHTML = '';
      chatChips.innerHTML = '';
      if (chatInput) chatInput.value = '';
    }, true); // capture phase, fires alongside existing restart handler
  }

  // ── Share button ──

  var shareBtn = document.getElementById('quiz-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var url = window.location.origin + '/quiz#auto-quiz';
      var shareData = {
        title: 'My AI Automation Report — Pely.ai',
        text: 'I just found out how much time AI automation could save my team. Take the quiz and see yours:',
        url: url
      };

      if (navigator.share) {
        navigator.share(shareData).catch(function () {});
      } else {
        // Fallback: copy link
        navigator.clipboard.writeText(url).then(function () {
          showToast('Link copied to clipboard');
        }).catch(function () {
          showToast('Link copied to clipboard');
        });
      }
    });
  }

  function showToast(msg) {
    var existing = document.querySelector('.quiz-share-toast');
    if (existing) existing.parentNode.removeChild(existing);
    var toast = document.createElement('div');
    toast.className = 'quiz-share-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });
    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 2500);
  }

  // ── Contact CTA pre-fill ──

  var contactCta = document.getElementById('quiz-cta-contact');
  if (contactCta) {
    contactCta.addEventListener('click', function () {
      // Pre-fill runs after a tick so the scroll to #contact completes
      setTimeout(prefillContactForm, 100);
    });
  }

  // Context banner dismiss
  var dismissBtn = document.getElementById('form-context-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function () {
      var banner = document.getElementById('form-context-banner');
      if (banner) banner.hidden = true;
    });
  }

  // ── Init ──
  progressBar.style.width = '0%';
})();

// ─── CHATBOT WIDGET ───
(function () {
  var fab = document.getElementById('chatbot-fab');
  var panel = document.getElementById('chatbot-panel');
  if (!fab || !panel) return;

  var messagesEl = document.getElementById('chatbot-messages');
  var inputEl = document.getElementById('chatbot-input');
  var sendBtn = document.getElementById('chatbot-send');
  var history = [];
  var waiting = false;
  var isOpen = false;
  var greeted = false;

  // Health check — only show widget if API is reachable
  fab.style.display = 'none';
  panel.style.display = 'none';

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] })
  })
  .then(function (r) {
    if (r.ok) {
      fab.style.display = '';
      panel.style.display = '';
    }
    // Silently stay hidden on any error
  })
  .catch(function () {
    // API unreachable — widget stays hidden
  });

  // Toggle panel
  fab.addEventListener('click', function () {
    isOpen = !isOpen;
    fab.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      inputEl.focus();
      if (!greeted) {
        greeted = true;
        addBubble('ai', 'Hi! I\u2019m the Pely.ai assistant. I can answer questions about our services, pricing, process, or anything else on the site. What can I help with?');
      }
    }
  });

  function addBubble(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble ' + role;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'chatbot-typing';
    el.id = 'chatbot-typing';
    el.innerHTML = '<div class="chatbot-typing-dot"></div><div class="chatbot-typing-dot"></div><div class="chatbot-typing-dot"></div>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('chatbot-typing');
    if (el) el.parentNode.removeChild(el);
  }

  function sendMessage() {
    if (waiting) return;
    var text = inputEl.value.trim();
    if (!text) return;

    addBubble('user', text);
    inputEl.value = '';
    history.push({ role: 'user', content: text });

    waiting = true;
    sendBtn.disabled = true;
    showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      removeTyping();
      waiting = false;
      sendBtn.disabled = false;
      if (data.text) {
        addBubble('ai', data.text);
        history.push({ role: 'assistant', content: data.text });
      } else {
        addBubble('ai', 'Sorry, I had trouble with that. You can reach us at info@pely.ai or through the contact form.');
      }
    })
    .catch(function () {
      removeTyping();
      waiting = false;
      sendBtn.disabled = false;
      addBubble('ai', 'Sorry, I\u2019m having trouble connecting right now. You can reach us at info@pely.ai or through the contact form.');
    });
  }

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);
})();

// ─── AI ADOPTION CHART ANIMATION ───
(function () {
  const chart = document.getElementById('adopt-chart');
  if (!chart) return;

  let animated = false;
  const chartObs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        chart.classList.add('animated');
        const bars = chart.querySelectorAll('.adopt-bar-filled');
        bars.forEach((bar, i) => {
          const w = bar.dataset.width;
          setTimeout(() => {
            bar.style.width = w + '%';
          }, i * 200);
        });
      }
    },
    { threshold: 0.3 }
  );

  chartObs.observe(chart);
})();

// ─── COOKIE CONSENT ───
(function () {
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  var consent = localStorage.getItem('pely_cookie_consent');
  if (!consent) {
    banner.hidden = false;
  }

  var acceptBtn = document.getElementById('cookie-accept');
  var declineBtn = document.getElementById('cookie-decline');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      localStorage.setItem('pely_cookie_consent', 'accepted');
      banner.hidden = true;
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', function () {
      localStorage.setItem('pely_cookie_consent', 'declined');
      banner.hidden = true;
      // Remove Plausible script if already loaded
      var plausible = document.querySelector('script[data-domain="pely.ai"]');
      if (plausible) plausible.remove();
    });
  }
})();
