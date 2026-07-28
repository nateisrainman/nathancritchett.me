/* Ask the Book: a curated, front-end explorer for Cognitive Architecture.
   No backend. Answers are drawn from the book's frameworks and matched to the
   reader's question with keyword scoring. Off-topic or unknown questions fall
   back gracefully rather than guessing. Upgradeable to a live model later by
   swapping resolve() for an API call. */
(function () {
  "use strict";

  var KB = [
    {
      id: "about",
      q: "What is the book about?",
      keywords: ["book about", "about the book", "really about", "big idea", "the point", "premise", "thesis", "summary", "summarize", "tl dr", "tldr", "problem does it solve", "why it matters", "why does this book matter", "what will i learn", "takeaway", "worth reading", "just hype", "ai hype", "another ai book", "why should i care", "is it worth"],
      a: "The system you build for AI is the system that builds your people. Most organizations optimize AI for output and ignore the humans who have to evaluate, apply, and lead with what it produces. Cognitive Architecture is the architecture for designing AI systems that make people sharper instead of more obsolete. Not a book about prompts. A book about how humans and machines think together.",
    },
    {
      id: "who",
      q: "Who is it for?",
      keywords: ["who is it for", "who should", "audience", "for me", "meant for", "right reader", "is this for me"],
      a: "Leaders who refuse to be left behind by their own tools: executives, operators, and boards; superintendents and school leaders; managers, teachers, and coaches; and parents and lifelong learners. Anyone responsible for the cognitive growth of others, or of themselves.",
    },
    {
      id: "author",
      q: "Who wrote it?",
      keywords: ["who wrote", "author", "credential", "credentials", "qualified", "qualifications", "is he an expert", "expert", "trust the author", "who is nathan", "nathan critchett", "about the author", "his background"],
      a: "Cognitive Architecture is by Nathan Critchett, a cognitive strategist and builder who has worked with more than 100 organizations on AI strategy and adoption, authored research on the future of human thinking, and built Arq.Training, a platform that makes the thinking process visible. The book is the synthesis of that work.",
    },
    {
      id: "apply",
      q: "How do I actually use it?",
      keywords: ["example", "apply", "actionable", "how do i use", "use this", "practical", "in practice", "how do i apply", "put it to work", "exercise", "worksheet", "how is this actionable"],
      a: "The book is built to be used, not just read. Every framework is paired with practice, and reserving brings a working kit: the Cognitive Audit and self-audit worksheets for your organization or classroom. The goal is one shift, from consuming ideas to architecting how you and your team think with AI.",
    },
    {
      id: "education",
      q: "Is it useful for schools?",
      keywords: ["teacher", "teachers", "school", "schools", "student", "students", "classroom", "superintendent", "district", "education", "educator"],
      a: "Education is where the stakes for cognitive development are highest, and it runs through the book. The Cognitive Supply Chain framework turns AI adoption into a vehicle for student growth instead of student decline, with a classroom edition of the self-audit for teachers and school leaders.",
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
      keywords: ["centaur", "centuar", "lane", "lane 1", "lane 2", "two lane"],
      a: "The Centaur Architecture: build your own intelligence in Lane 1, then direct the machine's intelligence in Lane 2. It is the metacognitive practice that separates an Architect of Intelligence from a passive user. Stay in the loop where judgment matters, and delegate where it does not.",
    },
    {
      id: "antifragile",
      q: "What is the Antifragile Ego?",
      keywords: ["antifragile", "antifragil", "ego", "resilience", "pressure"],
      a: "The Antifragile Ego is an internal architecture that grows stronger from disruption. A self-regulating system that treats failure as truth-seeking rather than an attack on self-image. It is what lets a person, or a team, grow through pressure instead of breaking under it.",
    },
    {
      id: "horizontal",
      q: "What is the horizontal versus vertical distinction?",
      keywords: ["horizontal", "vertical", "more tools", "steering", "vertical growth", "horizontal growth", "capacity"],
      a: "Adding tools is horizontal growth. Growing the capacity to evaluate and wield them is vertical growth. A faster engine with no steering wheel is dangerous, not powerful. The book makes the case for investing in the steering, the vertical capacity most organizations skip.",
    },
    {
      id: "architect",
      q: "What does Architect of Intelligence mean?",
      keywords: ["architect", "identity", "architect of intelligence", "stay relevant", "future proof", "left behind"],
      a: "Architect of Intelligence is the identity shift the book is engineered to produce. Stop identifying with your tool, your degree, or your job title. Start identifying with the value you create between systems. An Architect builds the wisdom to wield the tools, not just the tools themselves.",
    },
    {
      id: "question",
      q: "Will AI take my job?",
      keywords: ["job", "replace", "arbitrage", "career", "obsolete", "fired", "scared", "lose my job", "job safe", "career safe"],
      a: "Wrong question: how do I protect my job? Better question: where is the arbitrage between the new technology and the old human needs? That single question is the basis for many of the next big companies, and for the careers that thrive rather than merely survive.",
    },
    {
      id: "prompts",
      q: "How is this different from a book about prompts?",
      keywords: ["prompt", "prompts", "prompt engineering", "different from every", "different from other"],
      a: "This is not a book about prompts. Prompts age in weeks. This is a book about the architecture of how humans and AI think together, and how leaders design organizations that thrive because of that partnership rather than in spite of it. Architecture lasts.",
    },
    {
      id: "evidence",
      q: "What is the evidence behind it?",
      keywords: ["evidence", "research", "proof", "science", "harvard", "study", "studies", "data", "backed by"],
      a: "The frameworks draw on cognitive science, organizational design, and field data from more than 100 organizations. One anchor: Harvard found elite consultants relying on AI were 19 percentage points less accurate on tasks at the edge of its capabilities. The book explains why, and what to do about it.",
    },
    {
      id: "format",
      q: "What format does it come in?",
      keywords: ["audiobook", "ebook", "e book", "kindle", "paperback", "hardcover", "how many pages", "pages", "format", "how long is the book", "length", "print", "shipping", "ship internationally"],
      a: "Cognitive Architecture is a short guide for leaders, designed to be cherished. Format and edition details are being finalized for launch. Reserve a copy to lock in Architects pricing and be first to get the details the day it ships.",
    },
    {
      id: "when",
      q: "When does it come out?",
      keywords: ["when", "release date", "comes out", "come out", "launch", "available", "publish", "published", "out yet"],
      a: "The book is in pre-sale now, shipping in 2026. Reserve a copy to join the first cohort of Cognitive Architects and receive the intro, the Cognitive Audit, and launch-day access before it ships.",
    },
    {
      id: "get",
      q: "How do I get a copy?",
      keywords: ["get a copy", "buy", "copy", "order", "reserve", "presale", "pre sale", "price", "cost", "how much", "purchase", "where can i buy"],
      a: "Reserve it from the pre-sale using the Reserve button. Joining the Architects List comes with a kit that puts the book's frameworks to work the day you sign up. The About the Book page has the full details and the value stack.",
    },
    {
      id: "meta",
      q: "Is this a real AI?",
      keywords: ["are you an ai", "is this a real ai", "is this ai", "chatbot", "how does this work", "real ai", "talking to a", "is this chatgpt"],
      a: "This is a guided explorer of the book's ideas, not a live AI. It answers from Cognitive Architecture's frameworks. Ask about the Cognitive Supply Chain, the Centaur Architecture, or the Antifragile Ego, or reserve a copy for the full picture.",
    },
    {
      id: "hello",
      q: "Hello",
      keywords: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"],
      a: "Welcome. Ask Cognitive Architecture what it argues, who it is for, or how any of its frameworks work, such as the Cognitive Supply Chain or the Antifragile Ego. Pick a question below or type your own.",
    },
  ];

  var FALLBACK =
    "That one is not in the guided preview yet. Cognitive Architecture covers the architecture of thinking with AI: the Cognitive Supply Chain, the Centaur Architecture, the Antifragile Ego, and the shift into an Architect of Intelligence. Try one of the questions below, or reserve a copy for the full picture.";

  var GREETING =
    "Hello. This is Cognitive Architecture. Ask what the book argues, who it is for, or how any of its frameworks work. Pick a question below or type your own.";

  var CHIP_IDS = ["about", "who", "apply", "question", "when"];

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
      if (typing.parentNode) messages.removeChild(typing);
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
