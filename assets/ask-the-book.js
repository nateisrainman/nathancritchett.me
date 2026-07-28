/* Ask the Book: a curated, front-end explorer for Cognitive Architecture.
   No backend. Answers are drawn from the book's frameworks and matched to the
   reader's question with simple keyword scoring. Upgradeable to a live model
   later by swapping resolve() for an API call. */
(function () {
  "use strict";

  var KB = [
    {
      id: "about",
      q: "What is the book about?",
      keywords: ["about", "premise", "thesis", "summary", "main idea", "the point"],
      a: "The system you build for AI is the system that builds your people. Most organizations optimize AI for output and ignore the humans who have to evaluate, apply, and lead with what it produces. Cognitive Architecture is the architecture for designing AI systems that make people sharper instead of more obsolete. Not a book about prompts. A book about how humans and machines think together.",
    },
    {
      id: "who",
      q: "Who is it for?",
      keywords: ["who", "audience", "reader", "for me", "should i read", "who is it for"],
      a: "Leaders who refuse to be left behind by their own tools: executives, operators, and boards; superintendents and school leaders; managers, teachers, and coaches; and parents and lifelong learners. Anyone responsible for the cognitive growth of others, or of themselves.",
    },
    {
      id: "supply",
      q: "What is the Cognitive Supply Chain?",
      keywords: ["cognitive supply chain", "supply chain", "supply"],
      a: "The Cognitive Supply Chain is the most important system you will ever manage: the one that ensures the wisdom in your organization grows as fast as the tools you give it. When tools outpace judgment, the chain breaks and output quietly degrades. The book shows how to keep the two in balance.",
    },
    {
      id: "centaur",
      q: "What is the Centaur Architecture?",
      keywords: ["centaur", "lane", "two lane"],
      a: "The Centaur Architecture: build your own intelligence in Lane 1, then direct the machine's intelligence in Lane 2. It is the metacognitive practice that separates an Architect of Intelligence from a passive user. Stay in the loop where judgment matters, and delegate where it does not.",
    },
    {
      id: "antifragile",
      q: "What is the Antifragile Ego?",
      keywords: ["antifragile", "ego", "resilience", "pressure"],
      a: "The Antifragile Ego is an internal architecture that grows stronger from disruption. A self-regulating system that treats failure as truth-seeking rather than an attack on self-image. It is what lets a person, or a team, grow through pressure instead of breaking under it.",
    },
    {
      id: "horizontal",
      q: "What is the horizontal versus vertical distinction?",
      keywords: ["horizontal", "vertical", "more tools", "steering"],
      a: "Adding tools is horizontal growth. Growing the capacity to evaluate and wield them is vertical growth. A faster engine with no steering wheel is dangerous, not powerful. The book makes the case for investing in the steering, the vertical capacity most organizations skip.",
    },
    {
      id: "architect",
      q: "What does Architect of Intelligence mean?",
      keywords: ["architect", "identity", "architect of intelligence"],
      a: "Architect of Intelligence is the identity shift the book is engineered to produce. Stop identifying with your tool, your degree, or your job title. Start identifying with the value you create between systems. An Architect builds the wisdom to wield the tools, not just the tools themselves.",
    },
    {
      id: "question",
      q: "Will AI take my job?",
      keywords: ["job", "replace", "arbitrage", "career", "obsolete", "fired"],
      a: "Wrong question: how do I protect my job? Better question: where is the arbitrage between the new technology and the old human needs? That single question is the basis for many of the next big companies, and for the careers that thrive rather than merely survive.",
    },
    {
      id: "prompts",
      q: "How is this different from a book about prompts?",
      keywords: ["prompt", "prompts", "different"],
      a: "This is not a book about prompts. Prompts age in weeks. This is a book about the architecture of how humans and AI think together, and how leaders design organizations that thrive because of that partnership rather than in spite of it. Architecture lasts.",
    },
    {
      id: "evidence",
      q: "What is the evidence behind it?",
      keywords: ["evidence", "research", "proof", "science", "harvard", "study", "data"],
      a: "The frameworks draw on cognitive science, organizational design, and field data from more than 100 organizations. One anchor: Harvard found elite consultants relying on AI were 19 percentage points less accurate on tasks at the edge of its capabilities. The book explains why, and what to do about it.",
    },
    {
      id: "when",
      q: "When does it come out?",
      keywords: ["when", "release", "ship", "launch", "come out", "available"],
      a: "The book is in pre-sale now, shipping in 2026. Reserve a copy to join the first cohort of Cognitive Architects and receive the intro, the Cognitive Audit, and launch-day access before it ships.",
    },
    {
      id: "get",
      q: "How do I get a copy?",
      keywords: ["get", "buy", "copy", "order", "reserve", "presale", "price", "cost", "how much", "purchase"],
      a: "Reserve it from the pre-sale using the Reserve button. Joining the Architects List comes with a kit that puts the book's frameworks to work the day you sign up. The About the Book page has the full details and the value stack.",
    },
  ];

  var FALLBACK =
    "Good question. Cognitive Architecture covers the architecture of thinking with AI, from the Cognitive Supply Chain to the Antifragile Ego to the identity of an Architect of Intelligence. Try one of the suggestions below, or reserve a copy for the full picture.";

  var GREETING =
    "Hello. This is Cognitive Architecture. Ask what the book argues, who it is for, or how any of its frameworks work. Pick a question below or type your own.";

  var CHIP_IDS = ["about", "who", "question", "prompts", "when"];

  var byId = {};
  KB.forEach(function (e) { byId[e.id] = e; });

  var messages = document.getElementById("ask-messages");
  var chipsWrap = document.getElementById("ask-chips");
  var form = document.getElementById("ask-form");
  var input = document.getElementById("ask-input");
  if (!messages || !form || !input) return;

  function norm(s) {
    return (" " + String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " ");
  }
  function has(hay, kw) {
    return hay.indexOf(" " + kw + " ") !== -1 || (kw.indexOf(" ") !== -1 && hay.indexOf(kw) !== -1);
  }

  function resolve(text) {
    var n = norm(text);
    var best = null, bestScore = 0;
    KB.forEach(function (e) {
      var score = 0;
      e.keywords.forEach(function (kw) { if (has(n, kw)) score += kw.length; });
      if (score > bestScore) { bestScore = score; best = e; }
    });
    return bestScore > 0 && best ? best.a : FALLBACK;
  }

  function bubble(role, text) {
    var el = document.createElement("div");
    el.className = "msg msg-" + role;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function answer(text) {
    var typing = document.createElement("div");
    typing.className = "msg msg-book msg-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    setTimeout(function () {
      messages.removeChild(typing);
      bubble("book", text);
      if (window.track) window.track("ask_the_book", { q: text.slice(0, 60) });
    }, 480);
  }

  function askText(text) {
    if (!text || !text.trim()) return;
    bubble("user", text.trim());
    answer(resolve(text));
  }
  function askId(id) {
    var e = byId[id];
    if (!e) return;
    bubble("user", e.q);
    answer(e.a);
  }

  function renderChips() {
    CHIP_IDS.forEach(function (id) {
      var e = byId[id];
      if (!e) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ask-chip";
      b.textContent = e.q;
      b.addEventListener("click", function () { askId(id); });
      chipsWrap.appendChild(b);
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = input.value;
    input.value = "";
    askText(v);
  });

  // Framework cards elsewhere on the page can drive the panel.
  document.querySelectorAll("[data-ask]").forEach(function (card) {
    card.addEventListener("click", function () {
      var id = card.getAttribute("data-ask");
      askId(id);
      var panel = document.getElementById("ask-panel");
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // Seed
  bubble("book", GREETING);
  renderChips();
})();
