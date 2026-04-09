// ============================================
// The Cognitive Audit
// ============================================

const QUESTIONS = [
  // Complexity Gap
  {
    framework: 'The Complexity Gap',
    text: 'How often does your team buy or deploy a new AI tool without a clear plan for how people will actually use it?',
    options: [
      { text: 'Almost never. Every tool has a human adoption plan before rollout.', score: 10 },
      { text: 'Sometimes. We try, but execution is inconsistent.', score: 6 },
      { text: 'Often. Tools pile up faster than training can catch up.', score: 3 },
      { text: 'Constantly. It feels like a tool graveyard at this point.', score: 0 }
    ]
  },
  {
    framework: 'The Complexity Gap',
    text: 'When a new AI capability lands, who is the first to evaluate whether it actually helps your people think better?',
    options: [
      { text: 'A designated leader or team owns evaluation and reports back.', score: 10 },
      { text: 'Whoever has time that week. It is a bit ad hoc.', score: 5 },
      { text: 'Nobody. We assume if people are using it, it is working.', score: 1 },
      { text: 'Honestly, we have not thought about it that way.', score: 0 }
    ]
  },
  {
    framework: 'The Complexity Gap',
    text: 'If I asked a random person on your team to explain the difference between using AI well and using AI poorly, what would I hear?',
    options: [
      { text: 'A clear framework with concrete examples.', score: 10 },
      { text: 'A general sense, but nothing rehearsed or systematic.', score: 6 },
      { text: 'Something about prompts being important.', score: 3 },
      { text: 'Probably a shrug.', score: 0 }
    ]
  },

  // Cognitive Offloading
  {
    framework: 'Cognitive Offloading',
    text: 'When your team uses AI to help with a task, are they more likely to copy the output or to interrogate it?',
    options: [
      { text: 'Interrogate. The AI is a thinking partner, not an answer machine.', score: 10 },
      { text: 'Mixed. Some push back, some paste.', score: 5 },
      { text: 'Mostly copy with small edits.', score: 2 },
      { text: 'Copy and move on. Speed is the priority.', score: 0 }
    ]
  },
  {
    framework: 'Cognitive Offloading',
    text: 'How do you measure whether AI is making your people sharper or duller over time?',
    options: [
      { text: 'We track specific cognitive outcomes and review them.', score: 10 },
      { text: 'We look at output volume and speed.', score: 4 },
      { text: 'We do not measure it, but we can feel it.', score: 2 },
      { text: 'We have never thought to measure that.', score: 0 }
    ]
  },
  {
    framework: 'Cognitive Offloading',
    text: 'When someone on your team makes a high-stakes decision, how much of the reasoning can they articulate without AI help?',
    options: [
      { text: 'All of it. The AI supports, it does not replace.', score: 10 },
      { text: 'Most of it, with a few gaps.', score: 6 },
      { text: 'They can describe what AI told them, but not why.', score: 2 },
      { text: 'We are starting to lose that muscle.', score: 0 }
    ]
  },

  // The Factory Mind
  {
    framework: 'The Factory Mind',
    text: 'How much of your team is still being rewarded for doing work that an AI could now do in seconds?',
    options: [
      { text: 'Very little. We have redesigned roles around higher-order thinking.', score: 10 },
      { text: 'Some. A few roles have shifted, most have not.', score: 5 },
      { text: 'Most roles are still the same, even as the tools change.', score: 2 },
      { text: 'All of it. We have not rethought anything.', score: 0 }
    ]
  },
  {
    framework: 'The Factory Mind',
    text: 'Does your organization reward compliance with process, or reward people who ask better questions?',
    options: [
      { text: 'Questions are celebrated openly.', score: 10 },
      { text: 'Both, depending on the manager.', score: 5 },
      { text: 'Mostly compliance. It is safer.', score: 2 },
      { text: 'We run on process. Questions slow us down.', score: 0 }
    ]
  },
  {
    framework: 'The Factory Mind',
    text: 'How often does your team confuse "being busy" with "producing real value"?',
    options: [
      { text: 'Rarely. We measure outcomes, not hours.', score: 10 },
      { text: 'Sometimes. We know we do it, we are working on it.', score: 5 },
      { text: 'Often. Calendars are full, outcomes are thin.', score: 2 },
      { text: 'Being busy is basically the culture.', score: 0 }
    ]
  },

  // Universal Basic Upgrading
  {
    framework: 'Universal Basic Upgrading',
    text: 'How much of your team development budget goes to tool training versus cognitive development?',
    options: [
      { text: 'We invest in how people think, not just what they use.', score: 10 },
      { text: 'Mostly tools, a bit of thinking.', score: 5 },
      { text: 'Almost entirely tool training.', score: 2 },
      { text: 'We do not really have a development budget.', score: 0 }
    ]
  },
  {
    framework: 'Universal Basic Upgrading',
    text: 'When a new skill is needed, do you hire for it, train for it, or build it from the inside out?',
    options: [
      { text: 'Build from inside. We develop people vertically.', score: 10 },
      { text: 'Train for it when we can.', score: 6 },
      { text: 'Mostly hire for it.', score: 3 },
      { text: 'We have not had to think about this yet.', score: 1 }
    ]
  },
  {
    framework: 'Universal Basic Upgrading',
    text: 'If your top performer left tomorrow, how much of their expert context would walk out the door with them?',
    options: [
      { text: 'Almost none. We have extracted and systemized their thinking.', score: 10 },
      { text: 'Some. We have docs but not the reasoning behind them.', score: 5 },
      { text: 'Most of it. They are the system.', score: 2 },
      { text: 'All of it. We would be in trouble.', score: 0 }
    ]
  },

  // The Architecture
  {
    framework: 'The Architecture',
    text: 'Does your organization have a deliberate design for how humans and AI work together, or is it mostly ad hoc?',
    options: [
      { text: 'Deliberate design, reviewed regularly.', score: 10 },
      { text: 'Loose guidelines that individuals interpret.', score: 5 },
      { text: 'Mostly ad hoc. People figure it out.', score: 2 },
      { text: 'No design at all.', score: 0 }
    ]
  },
  {
    framework: 'The Architecture',
    text: 'When a new problem shows up, does your team reach for a tool first or reach for a framework first?',
    options: [
      { text: 'Framework first, then the right tool.', score: 10 },
      { text: 'Depends on who is leading.', score: 5 },
      { text: 'Tool first. Google or ChatGPT before anything.', score: 2 },
      { text: 'Panic first, then a tool.', score: 0 }
    ]
  },
  {
    framework: 'The Architecture',
    text: 'How confident are you that your organization will be stronger in two years because of AI, not weaker?',
    options: [
      { text: 'Very confident. We have a plan and we are executing it.', score: 10 },
      { text: 'Cautiously optimistic. The plan is still forming.', score: 6 },
      { text: 'Worried. We are reacting, not designing.', score: 3 },
      { text: 'Genuinely scared. This is why I took the audit.', score: 1 }
    ]
  }
];

const FRAMEWORK_INSIGHTS = {
  'The Complexity Gap': {
    label: 'The gap between what your tools can produce and what your people can evaluate is the biggest risk in your architecture.',
    action: 'This week, pick one AI tool your team uses and run a single evaluation meeting. Ask each person to show how they decide whether the AI output is actually good. If the answers are vague, that is the lever. Before buying your next tool, build the evaluation system for the tools you already have.'
  },
  'Cognitive Offloading': {
    label: 'Your team is trading short-term speed for long-term thinking capacity. That trade compounds.',
    action: 'Starting this week, add one question to every high-stakes decision: "If the AI disappeared, could you still make this call?" If the answer is no, the decision needs to be restructured so the thinking happens with the AI, not because of it.'
  },
  'The Factory Mind': {
    label: 'You are paying people to do work the machine can do better. That is a structural problem, not a training problem.',
    action: 'Pick one role on your team and redesign it this month. Not the tasks. The identity. What is the highest-order contribution a human in that seat can make that an AI cannot? Make that the job. Delete everything else.'
  },
  'Universal Basic Upgrading': {
    label: 'Your team is developing horizontally while the world demands vertical growth. The floor is rising faster than your people.',
    action: 'Stop sending people to tool training for the next 90 days. Replace it with one weekly hour of structured cognitive development. A case study, a hard question, a framework. Vertical growth, not another dashboard tutorial.'
  },
  'The Architecture': {
    label: 'The rest of your frameworks are strong, but they are not stitched into a system. You have pieces, not architecture.',
    action: 'Block two hours this week and draw the current state of how AI flows through your organization. Who uses what, for which decisions, with what oversight. Then draw the state you want. The gap between the two is your roadmap.'
  }
};

let currentQuestion = 0;
let answers = new Array(QUESTIONS.length).fill(null);

// ---- Element refs ----
const introScreen = document.getElementById('intro-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const startBtn = document.getElementById('start-audit');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressFill = document.getElementById('progress-fill');
const progressCurrent = document.getElementById('progress-current');
const progressTotal = document.getElementById('progress-total');
const quizFramework = document.getElementById('quiz-framework');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const scoreRing = document.getElementById('score-ring');
const scoreValue = document.getElementById('score-value');
const scoreLabel = document.getElementById('score-label');
const frameworkBreakdown = document.getElementById('framework-breakdown');
const auditForm = document.getElementById('audit-form');
const resultsGate = document.getElementById('results-gate');
const resultsUnlocked = document.getElementById('results-unlocked');
const recommendationEl = document.getElementById('recommendation');
const gateSubmit = document.getElementById('gate-submit');

// ---- Nav scroll ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ---- Start ----
progressTotal.textContent = QUESTIONS.length;
startBtn.addEventListener('click', () => {
  introScreen.classList.remove('active');
  quizScreen.classList.add('active');
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- Render question ----
function renderQuestion() {
  const q = QUESTIONS[currentQuestion];
  quizFramework.textContent = q.framework;
  quizQuestion.textContent = q.text;
  quizOptions.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    if (answers[currentQuestion] === i) btn.classList.add('selected');
    btn.innerHTML = '<span class="quiz-option-marker"></span><span>' + opt.text + '</span>';
    btn.addEventListener('click', () => {
      answers[currentQuestion] = i;
      renderQuestion();
      nextBtn.disabled = false;
    });
    quizOptions.appendChild(btn);
  });

  const pct = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  progressFill.style.width = pct + '%';
  progressCurrent.textContent = currentQuestion + 1;

  prevBtn.disabled = currentQuestion === 0;
  nextBtn.disabled = answers[currentQuestion] === null;
  nextBtn.textContent = currentQuestion === QUESTIONS.length - 1 ? 'See Results \u2192' : 'Next \u2192';
}

prevBtn.addEventListener('click', () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentQuestion < QUESTIONS.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    showResults();
  }
});

// ---- Results ----
function calculateScores() {
  const frameworkTotals = {};
  const frameworkCounts = {};

  QUESTIONS.forEach((q, i) => {
    const a = answers[i];
    if (a === null) return;
    const score = q.options[a].score;
    if (!frameworkTotals[q.framework]) {
      frameworkTotals[q.framework] = 0;
      frameworkCounts[q.framework] = 0;
    }
    frameworkTotals[q.framework] += score;
    frameworkCounts[q.framework] += 10;
  });

  const breakdown = {};
  Object.keys(frameworkTotals).forEach(f => {
    breakdown[f] = Math.round((frameworkTotals[f] / frameworkCounts[f]) * 100);
  });

  const total = Math.round(
    Object.values(breakdown).reduce((a, b) => a + b, 0) / Object.keys(breakdown).length
  );

  let weakest = Object.keys(breakdown)[0];
  Object.keys(breakdown).forEach(f => {
    if (breakdown[f] < breakdown[weakest]) weakest = f;
  });

  return { total, breakdown, weakest };
}

function showResults() {
  quizScreen.classList.remove('active');
  resultsScreen.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const { total, breakdown, weakest } = calculateScores();

  setTimeout(() => {
    animateNumber(scoreValue, 0, total, 1500);
    const circumference = 440;
    const offset = circumference - (total / 100) * circumference;
    scoreRing.style.strokeDashoffset = offset;
  }, 300);

  scoreLabel.textContent = getScoreLabel(total);

  frameworkBreakdown.innerHTML = '';
  Object.keys(breakdown).forEach(f => {
    const row = document.createElement('div');
    row.className = 'framework-row';
    row.innerHTML =
      '<div class="framework-row-name">' + f + '</div>' +
      '<div class="framework-row-score">' + breakdown[f] + '/100</div>' +
      '<div class="framework-bar"><div class="framework-bar-fill" style="width: 0%"></div></div>';
    frameworkBreakdown.appendChild(row);
    setTimeout(() => {
      row.querySelector('.framework-bar-fill').style.width = breakdown[f] + '%';
    }, 500);
  });

  const insight = FRAMEWORK_INSIGHTS[weakest];
  recommendationEl.innerHTML =
    '<p class="recommendation-label">Your First Lever To Pull</p>' +
    '<h3>' + weakest + '</h3>' +
    '<p>' + insight.label + '</p>' +
    '<p><strong>What to do this week:</strong> ' + insight.action + '</p>';

  window._auditResults = { total, breakdown, weakest };
}

function getScoreLabel(score) {
  if (score >= 85) return 'You are already designing. Keep widening the lead.';
  if (score >= 65) return 'Solid foundation. A few levers left to pull for a real edge.';
  if (score >= 40) return 'The gap is real and getting wider. Time to start architecting.';
  return 'You are in the danger zone. The good news: the leverage is enormous.';
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

// ---- Form submission ----
auditForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(auditForm);
  const name = formData.get('name');
  const email = formData.get('email');

  gateSubmit.disabled = true;
  gateSubmit.textContent = 'Sending...';

  try {
    const res = await fetch('https://architects-list.nathancritch.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        source: 'audit',
        score: window._auditResults
      })
    });

    if (!res.ok) throw new Error('Submission failed');

    resultsGate.style.display = 'none';
    resultsUnlocked.classList.add('visible');
    window.scrollTo({ top: resultsUnlocked.offsetTop - 100, behavior: 'smooth' });
  } catch (err) {
    gateSubmit.disabled = false;
    gateSubmit.textContent = 'Try Again';
    alert('Something went wrong. Please try again or email nathan.critch@outlook.com directly.');
  }
});
