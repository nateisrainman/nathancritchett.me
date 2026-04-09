// ============================================
// Architects List Worker
// Accepts signups from book.html and audit.html,
// sends welcome email via Resend with all kit links.
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://nathancritchett.me',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const { name, email, source, score } = body;

    if (!email || !isValidEmail(email)) {
      return json({ error: 'Valid email required' }, 400);
    }

    const firstName = (name || 'there').split(' ')[0].trim();

    // Build the email HTML
    const html = welcomeEmailHtml(firstName, source, score);
    const text = welcomeEmailText(firstName, source, score);

    // Send via Resend
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Nathan Critchett <nathan@nathancritchett.me>',
          to: [email],
          reply_to: 'nathan.critch@outlook.com',
          subject: `${firstName}, welcome to The Architects List`,
          html,
          text,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.text();
        console.error('Resend error:', err);
        return json({ error: 'Email send failed' }, 500);
      }

      // Also notify Nathan
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Architects List <nathan@nathancritchett.me>',
          to: ['nathan.critch@outlook.com'],
          subject: `New Architects List signup: ${firstName} (${source || 'book'})`,
          html: notifyHtml(name || firstName, email, source, score),
          text: notifyText(name || firstName, email, source, score),
        }),
      });

      return json({ success: true });
    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Server error' }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function welcomeEmailHtml(firstName, source, score) {
  const scoreBlock = score ? scoreHtmlBlock(score) : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, 'Plus Jakarta Sans', Arial, sans-serif; background: #060A14; color: #F0ECF8; margin: 0; padding: 0; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 40px 30px; }
  .logo { font-size: 12px; font-weight: 700; letter-spacing: 3px; color: #C4874D; text-transform: uppercase; margin-bottom: 40px; }
  h1 { font-family: Georgia, serif; font-size: 32px; line-height: 1.2; color: #F0ECF8; margin: 0 0 20px; }
  p { font-size: 16px; line-height: 1.7; color: #B0B4CC; margin: 0 0 16px; }
  strong { color: #F0ECF8; }
  .kit { background: #1E2A48; border: 1px solid rgba(196, 135, 77, 0.3); border-radius: 16px; padding: 28px; margin: 32px 0; }
  .kit-title { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #C4874D; text-transform: uppercase; margin-bottom: 20px; }
  .kit-item { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .kit-item:last-child { border-bottom: none; }
  .kit-item a { color: #00D4B8; text-decoration: none; font-size: 17px; font-family: Georgia, serif; display: block; margin-bottom: 4px; }
  .kit-item span { font-size: 14px; color: #8088A8; }
  .score-box { background: linear-gradient(135deg, rgba(196, 135, 77, 0.1), rgba(0, 212, 184, 0.06)); border: 1px solid rgba(196, 135, 77, 0.25); border-radius: 12px; padding: 24px; margin: 24px 0; }
  .score-num { font-family: Georgia, serif; font-size: 48px; color: #F0ECF8; line-height: 1; }
  .score-denom { font-size: 20px; color: #8088A8; }
  .signoff { margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); }
  .footer { font-size: 12px; color: #5A6080; margin-top: 40px; text-align: center; }
  .footer a { color: #C4874D; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">Nathan Critchett</div>

  <h1>Welcome to The Architects List, ${escapeHtml(firstName)}.</h1>

  <p>You did something most people will not do. You chose to start the work before the book even ships. That choice matters. This list is not a notification. It is the first cohort of Cognitive Architects, and everything I build for the launch lands here first.</p>

  ${scoreBlock}

  <div class="kit">
    <div class="kit-title">Your Kit</div>

    <div class="kit-item">
      <a href="https://nathancritchett.me/audit.html">The Cognitive Audit &rarr;</a>
      <span>Take it whenever you want a fresh read on where the gap is widest.</span>
    </div>

    <div class="kit-item">
      <a href="https://nathancritchett.me/assets/intro-and-mandate.pdf">The Intro + The Architect's Mandate (PDF) &rarr;</a>
      <span>The opening of the book. Start the journey tonight.</span>
    </div>

    <div class="kit-item">
      <a href="https://nathancritchett.me/worksheets/supply-chain-org.html">Cognitive Supply Chain Self-Audit: Org Edition &rarr;</a>
      <span>Fillable worksheet. Map your organization's chain in one sitting.</span>
    </div>

    <div class="kit-item">
      <a href="https://nathancritchett.me/worksheets/supply-chain-classroom.html">Cognitive Supply Chain Self-Audit: Classroom Edition &rarr;</a>
      <span>Same worksheet, rebuilt for teachers and school leaders.</span>
    </div>

    <div class="kit-item">
      <a href="https://nathancritchett.me/book.html">Architects Pricing on Launch Day &rarr;</a>
      <span>You are on the list. 30% off ($20 instead of $30) + first-edition guarantee.</span>
    </div>
  </div>

  <p>If you do just one thing tonight, open the Intro. It is short. It will tell you whether the book is going to be worth your time. I think it will.</p>

  <p>If I can answer anything, just hit reply. I read every email on this list.</p>

  <div class="signoff">
    <p>Architecting with you,<br><strong>Nathan</strong></p>
  </div>

  <div class="footer">
    Nathan Critchett &middot; <a href="https://nathancritchett.me">nathancritchett.me</a>
  </div>
</div>
</body>
</html>`;
}

function scoreHtmlBlock(score) {
  if (!score || !score.total) return '';
  return `
  <div class="score-box">
    <div style="font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #00D4B8; text-transform: uppercase; margin-bottom: 10px;">Your Cognitive Architecture Score</div>
    <div><span class="score-num">${score.total}</span><span class="score-denom">/100</span></div>
    ${score.weakest ? `<p style="margin-top: 12px; margin-bottom: 0; font-size: 15px;">Your weakest link: <strong>${escapeHtml(score.weakest)}</strong>. That is where the leverage is.</p>` : ''}
  </div>`;
}

function welcomeEmailText(firstName, source, score) {
  const scoreText = score && score.total ? `\n\nYour Cognitive Architecture Score: ${score.total}/100\nWeakest link: ${score.weakest || 'N/A'}\n` : '';
  return `Welcome to The Architects List, ${firstName}.

You did something most people will not do. You chose to start the work before the book even ships. That choice matters.
${scoreText}
YOUR KIT:

1. The Cognitive Audit
   https://nathancritchett.me/audit.html

2. The Intro + The Architect's Mandate (PDF)
   https://nathancritchett.me/assets/intro-and-mandate.pdf

3. Cognitive Supply Chain Self-Audit: Org Edition
   https://nathancritchett.me/worksheets/supply-chain-org.html

4. Cognitive Supply Chain Self-Audit: Classroom Edition
   https://nathancritchett.me/worksheets/supply-chain-classroom.html

5. Architects Pricing on Launch Day
   You are on the list. 30% off ($20 instead of $30) + first-edition guarantee.
   https://nathancritchett.me/book.html

If you do just one thing tonight, open the Intro.

Hit reply if I can answer anything. I read every email on this list.

Architecting with you,
Nathan

---
Nathan Critchett
https://nathancritchett.me`;
}

function notifyHtml(name, email, source, score) {
  const scoreLine = score && score.total ? `<p><strong>Audit Score:</strong> ${score.total}/100 &middot; Weakest: ${escapeHtml(score.weakest || 'N/A')}</p>` : '';
  return `
<div style="font-family: -apple-system, Arial, sans-serif; padding: 20px;">
  <h2 style="font-family: Georgia, serif;">New Architects List Signup</h2>
  <p><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
  <p><strong>Source:</strong> ${escapeHtml(source || 'book page')}</p>
  ${scoreLine}
  <p style="color: #666; font-size: 12px; margin-top: 20px;">Welcome email sent automatically.</p>
</div>`;
}

function notifyText(name, email, source, score) {
  const scoreLine = score && score.total ? `Audit Score: ${score.total}/100, Weakest: ${score.weakest || 'N/A'}\n` : '';
  return `New Architects List Signup

Name: ${name}
Email: ${email}
Source: ${source || 'book page'}
${scoreLine}
Welcome email sent automatically.`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
