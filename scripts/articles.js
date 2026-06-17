/**
 * Article registry + topic clusters for the writing library.
 *
 * Each article's title, description, and type are read straight from its
 * HTML at build time (see build-seo.js), so this file only carries what
 * cannot be inferred: which cluster a piece belongs to and its FAQ.
 *
 * To add a new article: drop the HTML in /writing and add an entry here.
 */

const REVIEW_DATE = "2026-06-17"; // last library-wide structured review

const clusters = {
  "complexity-gap": {
    label: "The Complexity Gap",
    blurb:
      "The distance between what AI can produce and what people can actually " +
      "evaluate, and why more tools without more thinking widens it.",
  },
  vertical: {
    label: "Vertical Development",
    blurb:
      "Growing the thinker, not just the toolset: cognitive complexity, orders " +
      "of mind, and why AI literacy alone is not enough.",
  },
  "cognitive-science": {
    label: "Cognitive Science of AI",
    blurb:
      "What the research says about cognitive offloading, cognitive debt, and " +
      "whether AI sharpens or erodes human thinking.",
  },
  "human-ai-learning": {
    label: "Designing Human-AI Learning",
    blurb:
      "The Centaur model, assessment, and classroom design that build thinkers " +
      "instead of dependents.",
  },
  "district-strategy": {
    label: "District Strategy & Metrics",
    blurb:
      "Cognitive Runway, LCAP cost, and the metrics and professional development " +
      "that actually move a district in the AI era.",
  },
};

const articles = [
  // ---- Cluster 1: The Complexity Gap ----
  {
    slug: "the-complexity-gap",
    cluster: "complexity-gap",
    pillar: true,
    faq: [
      {
        q: "What is the Complexity Gap?",
        a: "The Complexity Gap is the distance between what AI tools can produce and what the people using them can actually process, evaluate, and apply. AI capability is growing exponentially while human working memory and judgment are not, so each new tool can widen the gap instead of closing it.",
      },
      {
        q: "Why do AI tools often make experts worse?",
        a: "When AI produces output that exceeds a person's capacity to evaluate it, they tend to trust the confident, well-formatted surface and stop thinking critically. In the Harvard Business School study of BCG consultants, those who used GPT-4 on tasks beyond its reliable boundary were about 19 percentage points less accurate than consultants who used no AI at all.",
      },
      {
        q: "How do you close the Complexity Gap?",
        a: "You close it by sequencing cognitive development ahead of, or alongside, technology. Build the capacity to evaluate AI output first, match tools to that capacity second, and measure judgment quality rather than adoption rates. This is vertical work, and it compounds.",
      },
    ],
  },
  { slug: "the-bottleneck-isnt-technology", cluster: "complexity-gap" },
  { slug: "nobody-using-ai-tools", cluster: "complexity-gap" },

  // ---- Cluster 2: Vertical Development ----
  {
    slug: "horizontal-vs-vertical",
    cluster: "vertical",
    pillar: true,
    faq: [
      {
        q: "What is the difference between horizontal and vertical development?",
        a: "Horizontal development adds more knowledge, skills, and tools to the same way of thinking. Vertical development grows the complexity of the thinking itself, the capacity to hold competing perspectives, evaluate ambiguous information, and make sound judgments. AI can replicate horizontal skills; it cannot replicate vertical capacity.",
      },
      {
        q: "Why isn't most AI training for educators working?",
        a: "Most AI professional development teaches people how to operate tools, which is horizontal. It rarely builds the evaluative thinking required to judge what those tools produce, so practice in the classroom does not change. Training people on tools that are obsolete next quarter is a losing investment compared with growing how they think.",
      },
      {
        q: "Is AI literacy enough?",
        a: "AI literacy is necessary but not sufficient. It teaches people to use tools; it does not develop the cognitive complexity that keeps human judgment valuable as the tools improve. The durable investment is in the thinker, not the toolset.",
      },
    ],
  },
  { slug: "horizontal-vs-vertical-distinction", cluster: "vertical" },
  { slug: "the-factory-mind", cluster: "vertical" },
  { slug: "universal-basic-upgrading", cluster: "vertical" },
  { slug: "the-2-lane-framework", cluster: "vertical" },

  // ---- Cluster 3: Cognitive Science of AI ----
  {
    slug: "cognitive-offloading",
    cluster: "cognitive-science",
    pillar: true,
    faq: [
      {
        q: "What is cognitive offloading?",
        a: "Cognitive offloading is using an external aid, like AI, to reduce the mental effort a task would otherwise require. It is not inherently bad: offloading the right work frees attention for harder thinking. The danger is offloading the thinking that was supposed to build the skill in the first place.",
      },
      {
        q: "Does using AI weaken critical thinking?",
        a: "The research is mixed but points to real risk when AI replaces effortful thinking rather than supporting it. Studies have linked heavier AI reliance to weaker reasoning and reduced cognitive engagement, an effect some researchers call cognitive debt. The deciding factor is whether the AI does the thinking for the student or makes the student think harder.",
      },
      {
        q: "How can students use AI without eroding their thinking?",
        a: "Design the task so the human stays in the evaluative seat: use AI to generate things to critique, stress-test, and improve rather than to produce final answers. When students wrestle with AI output instead of accepting it, the tool builds judgment instead of replacing it.",
      },
    ],
  },
  {
    slug: "is-ai-making-students-dumber",
    cluster: "cognitive-science",
    faq: [
      {
        q: "Is AI making students dumber?",
        a: "Not by itself. Research shows AI correlates with weaker critical thinking when students use it to get answers (GPS mode), but the same tools can strengthen thinking when used to challenge and refine ideas (Mirror mode). The outcome depends on how the tool is used, not whether it is used.",
      },
      {
        q: "What is the difference between GPS mode and Mirror mode?",
        a: "In GPS mode, AI hands you the destination and you stop building the underlying map; the thinking is offloaded. In Mirror mode, AI reflects your thinking back so you can examine and improve it. The same tool can do either, and the design choice decides which.",
      },
      {
        q: "What is one question parents can ask about AI use?",
        a: "Ask whether the AI did the thinking or made your child think harder. If your child can explain, defend, and improve on what the AI produced, the tool is building capacity. If they can only hand over the output, it is replacing it.",
      },
    ],
  },

  // ---- Cluster 4: Designing Human-AI Learning ----
  {
    slug: "the-centaur-classroom",
    cluster: "human-ai-learning",
    pillar: true,
    faq: [
      {
        q: "What is the Centaur model in education?",
        a: "The Centaur model pairs human judgment with machine power so the human directs and the AI executes. In a classroom, that means students use AI as a sparring partner that increases cognitive demand, not as an answer machine that removes it.",
      },
      {
        q: "How do you design AI learning that builds thinkers, not dependents?",
        a: "Put the student in the evaluative role: have them prompt, critique, and refine AI output toward a standard they can defend. Assess the thinking behind the work, not just the polished product, so the AI cannot do the part that matters.",
      },
    ],
  },
  { slug: "the-centaur-assignment", cluster: "human-ai-learning" },
  { slug: "stop-grading-ai-output", cluster: "human-ai-learning" },
  { slug: "ai-literacy-isnt-enough", cluster: "human-ai-learning" },
  { slug: "two-careers-ai-cant-kill", cluster: "human-ai-learning" },
  { slug: "your-school-was-designed-in-1806", cluster: "human-ai-learning" },

  // ---- Cluster 5: District Strategy & Metrics ----
  {
    slug: "net-income-to-cognitive-runway",
    cluster: "district-strategy",
    pillar: true,
    faq: [
      {
        q: "What is Cognitive Runway?",
        a: "Cognitive Runway is a forward-looking measure of an organization's collective capacity to adapt to what is coming, rather than how it performed on yesterday's metrics. Test scores measure the past; Cognitive Runway estimates how well people can learn, judge, and adjust as conditions change.",
      },
      {
        q: "Why aren't test scores enough in the age of AI?",
        a: "Test scores optimize for a stable world. When the environment shifts as fast as AI is shifting it, the districts that adapt fastest can outperform the ones with the highest current scores. Optimizing only for today's metric can quietly starve the adaptive capacity you will need tomorrow.",
      },
    ],
  },
  {
    slug: "how-much-does-lcap-cost",
    cluster: "district-strategy",
    faq: [
      {
        q: "How much does LCAP actually cost a district?",
        a: "Beyond direct expenses, the LCAP cycle consumes an estimated 200 to 400 hours and up to roughly $48,000 in senior leadership salary per cycle. The larger cost is the strategic thinking capacity those hours displace when senior leaders spend them on formatting and compliance.",
      },
      {
        q: "Can AI reduce the cost of LCAP compliance?",
        a: "Yes, when it is aimed at the mechanical work. AI can absorb much of the templating and formatting so leaders spend their hours on the genuine strategic planning the LCAP is meant to capture, inverting the ratio of effort from paperwork to thinking.",
      },
    ],
  },
  { slug: "the-metric-your-board-isnt-tracking", cluster: "district-strategy" },
  { slug: "high-scores-low-adaptability", cluster: "district-strategy" },
  { slug: "the-200-hour-problem", cluster: "district-strategy" },
  { slug: "lcap-compliance-to-intelligence", cluster: "district-strategy" },
  { slug: "why-ai-pd-isnt-changing-practice", cluster: "district-strategy" },
  { slug: "what-we-got-wrong-at-first", cluster: "district-strategy" },
];

module.exports = { REVIEW_DATE, clusters, articles };
