const today = new Date();

const plusDays = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const state = {
  activeDraft: "email",
  currentRequest: null,
  ai: {
    configured: false,
    provider: "OpenAI",
    model: "gpt-5-mini",
    mode: "demo"
  },
  requests: [
    {
      id: "CR-2418",
      title: "Global hybrid working principles refresh",
      owner: "Maya Patel",
      businessUnit: "People & Culture",
      audienceSize: 12400,
      priority: "High",
      score: 84,
      status: "Awaiting ELT approval",
      stage: "approval",
      channels: ["Leader email", "Intranet feature", "Manager brief"],
      risk: "Policy language still under legal review"
    },
    {
      id: "CR-2412",
      title: "ERP downtime notification",
      owner: "Daniel Kim",
      businessUnit: "Technology",
      audienceSize: 5300,
      priority: "Critical",
      score: 92,
      status: "Draft ready for final review",
      stage: "review",
      channels: ["Targeted email", "Teams post", "FAQ"],
      risk: "High operational impact if timing changes"
    },
    {
      id: "CR-2405",
      title: "Q3 leadership town hall launch",
      owner: "Sophie Laurent",
      businessUnit: "Corporate Affairs",
      audienceSize: 37400,
      priority: "Medium",
      score: 68,
      status: "Scheduled",
      stage: "active",
      channels: ["Email", "Intranet hero", "Manager toolkit"],
      risk: "Competing with benefits campaign"
    }
  ],
  calendar: [
    {
      title: "CEO Strategy Video",
      date: "Mar 25",
      audience: "All employees",
      channel: "Intranet + email",
      owner: "Corporate Affairs",
      note: "Paired with manager talking points for regional leads."
    },
    {
      title: "Benefits Enrolment Reminder",
      date: "Mar 27",
      audience: "UK and US employees",
      channel: "Email",
      owner: "People & Culture",
      note: "Final reminder before portal closure on Mar 31."
    },
    {
      title: "ERP Maintenance Alert",
      date: "Mar 28",
      audience: "Operations + Finance",
      channel: "Email + Teams",
      owner: "Technology",
      note: "Two-touch cadence with follow-up FAQ."
    },
    {
      title: "Quarter-End Manager Cascade",
      date: "Apr 01",
      audience: "People managers",
      channel: "Manager brief",
      owner: "Comms Ops",
      note: "Includes budget guardrails and expected employee questions."
    }
  ],
  repository: [
    {
      title: "Hybrid Working Principles Toolkit",
      type: "Manager brief",
      owner: "Maya Patel",
      audience: "People managers",
      updated: "2 hours ago",
      tags: ["policy", "hybrid", "manager cascade"],
      description: "Core messages, manager script and FAQ for hybrid policy adoption."
    },
    {
      title: "ERP Downtime FAQ v3",
      type: "FAQ",
      owner: "Daniel Kim",
      audience: "Finance and operations",
      updated: "Today",
      tags: ["technology", "downtime", "erp"],
      description: "Approved answer set for payroll, invoices and procurement interruptions."
    },
    {
      title: "Town Hall Launch Email",
      type: "Email",
      owner: "Sophie Laurent",
      audience: "All employees",
      updated: "Yesterday",
      tags: ["leadership", "town hall", "email"],
      description: "Leadership launch note with registration CTA and webcast details."
    },
    {
      title: "Benefits Enrolment Intranet Story",
      type: "Intranet",
      owner: "Priya Shah",
      audience: "UK and US employees",
      updated: "3 days ago",
      tags: ["benefits", "reward", "enrolment"],
      description: "Evergreen explainer with deadline blocks and provider links."
    }
  ],
  analytics: [
    { label: "Open rate", value: "74%", detail: "Targeted operational emails outperform enterprise average by 16 pts." },
    { label: "Click-through", value: "31%", detail: "Highest on manager-enabled campaigns with action deadline inside 7 days." },
    { label: "Manager adoption", value: "82%", detail: "Managers forwarding or using prepared cascade notes within 24 hours." },
    { label: "FAQ deflection", value: "43%", detail: "Questions resolved via FAQ before reaching HR and IT support queues." }
  ],
  channelPerformance: [
    { label: "Targeted Email", value: 84 },
    { label: "Manager Brief", value: 78 },
    { label: "Intranet Hero", value: 63 },
    { label: "Teams Post", value: 56 },
    { label: "FAQ Hub", value: 71 }
  ],
  insights: [
    {
      title: "Overlapping audience load this week",
      severity: "risk",
      summary: "Corporate employees will receive three enterprise-wide messages within 48 hours.",
      points: [
        "CEO strategy video and town hall invite target the same broad audience.",
        "Benefits reminder could be reframed as audience-targeted instead of all-staff.",
        "Suggested action: move town hall reminder to manager cascade for non-office teams."
      ]
    },
    {
      title: "Possible content duplication",
      severity: "review",
      summary: "Hybrid working request repeats policy language already approved in the March toolkit.",
      points: [
        "Reuse repository asset to shorten review cycle.",
        "Only the policy exceptions section needs fresh legal review."
      ]
    },
    {
      title: "Likely employee questions",
      severity: "active",
      summary: "AI predicts top questions employees will ask on current live campaigns.",
      points: [
        "Will policy exceptions apply to site-based roles?",
        "What should I do if ERP downtime blocks invoice approvals?",
        "Is town hall attendance mandatory for frontline teams?"
      ]
    }
  ]
};

const elements = {
  aiModeLabel: document.querySelector("#ai-mode-label"),
  aiStatusBadge: document.querySelector("#ai-status-badge"),
  aiProvider: document.querySelector("#ai-provider"),
  aiModel: document.querySelector("#ai-model"),
  aiBehavior: document.querySelector("#ai-behavior"),
  generationStatus: document.querySelector("#generation-status"),
  liveQueueCount: document.querySelector("#live-queue-count"),
  approvalCount: document.querySelector("#approval-count"),
  todayLabel: document.querySelector("#today-label"),
  form: document.querySelector("#request-form"),
  scoreSummary: document.querySelector("#score-summary"),
  urgencyBar: document.querySelector("#urgency-bar"),
  reachBar: document.querySelector("#reach-bar"),
  riskBar: document.querySelector("#risk-bar"),
  complexityBar: document.querySelector("#complexity-bar"),
  recommendation: document.querySelector("#recommendation-output"),
  draftOutput: document.querySelector("#draft-output"),
  workflowList: document.querySelector("#workflow-list"),
  calendarGrid: document.querySelector("#calendar-grid"),
  repositoryList: document.querySelector("#repository-list"),
  repositorySearch: document.querySelector("#repository-search"),
  analyticsCards: document.querySelector("#analytics-cards"),
  channelPerformance: document.querySelector("#channel-performance"),
  insightsList: document.querySelector("#insights-list"),
  tabs: document.querySelectorAll(".tab"),
  scrollButtons: document.querySelectorAll("[data-scroll-target]")
};

function updateGenerationNote(message, isError = false) {
  elements.generationStatus.textContent = message;
  elements.generationStatus.style.color = isError ? "var(--red)" : "var(--muted)";
}

function renderAiStatus() {
  elements.aiModeLabel.textContent = state.ai.mode === "live" ? "Live OpenAI" : "Demo";
  elements.aiStatusBadge.textContent = state.ai.mode === "live" ? "Live OpenAI" : "Demo mode";
  elements.aiStatusBadge.className = `tag ${state.ai.mode === "live" ? "live" : "neutral"}`;
  elements.aiProvider.textContent = state.ai.provider;
  elements.aiModel.textContent = state.ai.model;
  elements.aiBehavior.textContent =
    state.ai.mode === "live"
      ? "Recommendations, drafts and insights are being generated through the OpenAI Responses API."
      : "Recommendations, drafts and insights are currently using the built-in demo engine until an OpenAI key is configured.";
}

function renderTopbar() {
  const approvalItems = state.requests.filter((request) => request.stage === "approval").length;
  elements.liveQueueCount.textContent = String(state.requests.length);
  elements.approvalCount.textContent = String(approvalItems);
  elements.todayLabel.textContent = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

async function fetchAiStatus() {
  try {
    const response = await fetch("/api/status");
    const payload = await response.json();
    state.ai = {
      configured: payload.configured,
      provider: payload.provider || "OpenAI",
      model: payload.model || "gpt-5-mini",
      mode: payload.mode || "demo"
    };
    renderAiStatus();
    updateGenerationNote(
      state.ai.mode === "live"
        ? `Live OpenAI mode is active on ${state.ai.model}.`
        : "Demo mode active. Add `OPENAI_API_KEY` on the server to enable live generation."
    );
  } catch {
    renderAiStatus();
  }
}

function setDefaultDates() {
  elements.form.deadline.value = plusDays(4);
  elements.form.actionDate.value = plusDays(6);
}

function scoreRequest(request) {
  const deadlineDelta = Math.max(
    1,
    Math.ceil((new Date(request.deadline) - today) / (1000 * 60 * 60 * 24))
  );
  const actionDelta = Math.max(
    1,
    Math.ceil((new Date(request.actionDate) - today) / (1000 * 60 * 60 * 24))
  );

  const urgency = Math.min(100, Math.round((10 / deadlineDelta) * 14));
  const reach = Math.min(100, Math.round((Number(request.audienceSize) / 40000) * 100));
  const risk = Math.min(100, Number(request.sensitivity) * 10);
  const complexity = Math.min(
    100,
    Math.round((request.brief.length / 240) * 35 + (request.managerCascade ? 20 : 0) + (actionDelta <= 7 ? 25 : 8))
  );

  const total = Math.round(urgency * 0.3 + reach * 0.18 + risk * 0.3 + complexity * 0.22);

  let band = "Planned";
  if (total >= 85) band = "Critical";
  else if (total >= 70) band = "High";
  else if (total >= 50) band = "Medium";

  return { urgency, reach, risk, complexity, total, band };
}

function getRecommendations(request, score) {
  const audience =
    Number(request.audienceSize) > 10000
      ? "All employees with regional segmentation"
      : Number(request.audienceSize) > 2500
        ? "Targeted employee cohort plus managers"
        : "Specific impacted teams and direct managers";

  const channels = [];
  if (score.risk >= 80) channels.push("Targeted email");
  if (request.managerCascade) channels.push("Manager brief");
  if (request.objective === "Change adoption" || request.objective === "Awareness") channels.push("Intranet story");
  if (request.objective === "Risk mitigation") channels.push("FAQ page");
  if (channels.length < 3) channels.push("Teams / channel post");

  const cadence =
    score.urgency >= 80
      ? "Issue first message within 4 business hours and follow with FAQ in the same day."
      : "Launch with email, reinforce on intranet within 24 hours and use a manager cascade if questions persist.";

  const rationale =
    request.objective === "Leadership visibility"
      ? "Use visible channels first and equip managers with contextual talking points."
      : "Use targeted channels first to reduce noise while preserving action clarity.";

  return { audience, channels, cadence, rationale };
}

function buildDrafts(request, recommendation, score) {
  const actionDate = new Date(request.actionDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return {
    email:
`Subject: ${request.title}

Hello team,

We are sharing an important update regarding ${request.title.toLowerCase()}. This communication is intended for ${recommendation.audience.toLowerCase()} and is prioritised as a ${score.band.toLowerCase()} internal communications request.

What is happening
- ${request.brief}

What employees need to do
- Review the update and complete any required action by ${actionDate}.
- Speak with your manager if your team needs local clarification.

Why this matters
- This request supports ${request.objective.toLowerCase()} and has elevated importance because of timing, business impact and employee reach.

Further support
- A detailed FAQ and manager brief are being published alongside this update.

Thank you,
Internal Comms Operations`,
    intranet:
`Headline: ${request.title}
Standfirst: Clear guidance for ${recommendation.audience.toLowerCase()} with actions, timing and support resources.

Summary
${request.brief}

What changes for employees
- Primary objective: ${request.objective}
- Target action date: ${actionDate}
- Recommended channels: ${recommendation.channels.join(", ")}

What support is available
- Manager talking points
- FAQ with likely questions
- Follow-up reminders based on response analytics

Call to action
Employees should review the detail today and complete any required next step before the action date.`,
    faq:
`FAQ: ${request.title}

1. What is changing?
${request.brief}

2. Who is affected?
${recommendation.audience}

3. When does this take effect?
The key action date is ${actionDate}, with communications beginning ahead of the deadline.

4. Where can I get help?
Employees should use the published FAQ, speak to their manager and escalate role-specific issues through the normal support channel.

5. Why am I hearing about this now?
The request has been prioritised as ${score.band.toLowerCase()} because it combines timing, risk and audience impact.`,
    manager:
`Manager Brief: ${request.title}

Core narrative
- ${request.brief}

What you should say
- Explain what is changing in plain language.
- Reinforce why the update matters to local teams.
- Confirm the key action date: ${actionDate}.

Questions to prepare for
- How does this affect my team specifically?
- What happens if someone misses the deadline?
- Where do exceptions or edge cases get resolved?

Manager action
- Share the message in your next team touchpoint.
- Route unresolved questions back to Internal Comms Ops for FAQ updates.`
  };
}

function buildLocalInsights(request, recommendation, score) {
  return [
    {
      title: `New request risk scan: ${request.title}`,
      severity: score.risk >= 80 ? "risk" : "review",
      summary: `AI flagged this request as ${score.band.toLowerCase()} priority with score ${score.total}.`,
      points: [
        `Audience recommendation: ${recommendation.audience}.`,
        `Suggested channels: ${recommendation.channels.join(", ")}.`,
        score.risk >= 80
          ? "Escalate to legal or executive reviewer before publication."
          : "No major duplication detected; proceed to draft refinement."
      ]
    }
  ];
}

function buildLocalPack(request, score) {
  const recommendation = getRecommendations(request, score);
  const drafts = buildDrafts(request, recommendation, score);
  const insights = buildLocalInsights(request, recommendation, score);
  return { recommendation, drafts, insights };
}

async function generateAiPack(request, score) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ request, score })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to generate AI content.");
  }

  state.ai.provider = payload.provider || "OpenAI";
  state.ai.model = payload.model || state.ai.model;
  state.ai.mode = "live";
  renderAiStatus();
  return payload.pack;
}

function renderScorecard(score) {
  elements.scoreSummary.innerHTML = `
    <div class="score-card">
      <h4>Priority Band</h4>
      <div class="score-total">${score.total}</div>
      <p>${score.band} priority recommended for operator queue placement.</p>
    </div>
    <div class="metadata">
      <span class="pill">Urgency ${score.urgency}</span>
      <span class="pill">Reach ${score.reach}</span>
      <span class="pill">Risk ${score.risk}</span>
      <span class="pill">Complexity ${score.complexity}</span>
    </div>
  `;

  elements.urgencyBar.style.width = `${score.urgency}%`;
  elements.reachBar.style.width = `${score.reach}%`;
  elements.riskBar.style.width = `${score.risk}%`;
  elements.complexityBar.style.width = `${score.complexity}%`;
}

function renderRecommendation(recommendation, request, score) {
  elements.recommendation.innerHTML = `
    <div class="recommendation-block">
      <h4>Recommended audience</h4>
      <p>${recommendation.audience}</p>
    </div>
    <div class="recommendation-block">
      <h4>Channel mix</h4>
      <div class="recommendation-list">
        ${recommendation.channels.map((channel) => `<span class="pill">${channel}</span>`).join("")}
      </div>
    </div>
    <div class="recommendation-block">
      <h4>Distribution guidance</h4>
      <p>${recommendation.cadence}</p>
    </div>
    <div class="recommendation-block">
      <h4>Why AI chose this mix</h4>
      <p>${recommendation.rationale} Current score is ${score.total} and the objective is ${request.objective.toLowerCase()}.</p>
    </div>
  `;
}

function renderDraft() {
  if (!state.currentRequest) return;
  elements.draftOutput.textContent = state.currentRequest.drafts[state.activeDraft];
}

function renderWorkflow() {
  elements.workflowList.innerHTML = [...state.requests]
    .sort((a, b) => b.score - a.score)
    .map(
      (request) => `
        <article class="workflow-item">
          <div class="workflow-top">
            <div>
              <h4>${request.id} · ${request.title}</h4>
              <p>${request.owner} · ${request.businessUnit} · Audience ${request.audienceSize.toLocaleString()}</p>
            </div>
            <span class="status-chip ${request.stage}">${request.status}</span>
          </div>
          <p>Priority ${request.priority} · Score ${request.score} · Channels ${request.channels.join(", ")}</p>
          <p>Risk note: ${request.risk}</p>
        </article>
      `
    )
    .join("");
}

function renderCalendar() {
  elements.calendarGrid.innerHTML = state.calendar
    .map(
      (item) => `
        <article class="calendar-card">
          <div class="calendar-top">
            <div>
              <h4>${item.title}</h4>
              <p>${item.date} · ${item.channel}</p>
            </div>
            <span class="pill">${item.owner}</span>
          </div>
          <p>Audience: ${item.audience}</p>
          <p>${item.note}</p>
        </article>
      `
    )
    .join("");
}

function renderRepository(items = state.repository) {
  elements.repositoryList.innerHTML = items
    .map(
      (item) => `
        <article class="repository-item">
          <div class="repository-top">
            <div>
              <h4>${item.title}</h4>
              <p>${item.type} · ${item.owner} · ${item.updated}</p>
            </div>
            <span class="pill">${item.audience}</span>
          </div>
          <p>${item.description}</p>
          <div class="recommendation-list">
            ${item.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderAnalytics() {
  elements.analyticsCards.innerHTML = state.analytics
    .map(
      (metric) => `
        <article class="analytics-card">
          <h4>${metric.label}</h4>
          <div class="score-total">${metric.value}</div>
          <p>${metric.detail}</p>
        </article>
      `
    )
    .join("");

  elements.channelPerformance.innerHTML = state.channelPerformance
    .map(
      (channel) => `
        <div class="bar-row">
          <strong>${channel.label}</strong>
          <div class="bar-track">
            <div class="bar-fill" style="width:${channel.value}%"></div>
          </div>
          <span>${channel.value}</span>
        </div>
      `
    )
    .join("");
}

function renderInsights() {
  elements.insightsList.innerHTML = state.insights
    .map(
      (insight) => `
        <article class="insight-card">
          <div class="insight-top">
            <div>
              <h4>${insight.title}</h4>
              <p>${insight.summary}</p>
            </div>
            <span class="status-chip ${insight.severity}">${insight.severity}</span>
          </div>
          <ul>
            ${insight.points.map((point) => `<li>${point}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function createRequestFromForm(formData) {
  return {
    id: `CR-${Math.floor(2500 + Math.random() * 400)}`,
    title: formData.get("title"),
    owner: formData.get("owner"),
    businessUnit: formData.get("businessUnit"),
    objective: formData.get("objective"),
    brief: formData.get("brief"),
    audienceSize: Number(formData.get("audienceSize")),
    deadline: formData.get("deadline"),
    actionDate: formData.get("actionDate"),
    sensitivity: Number(formData.get("sensitivity")),
    managerCascade: formData.get("managerCascade") === "on"
  };
}

async function submitRequest(event) {
  event.preventDefault();
  const request = createRequestFromForm(new FormData(elements.form));
  const score = scoreRequest(request);
  const submitButton = elements.form.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = state.ai.mode === "live" ? "Generating with OpenAI..." : "Generating...";
  updateGenerationNote(
    state.ai.mode === "live"
      ? `Generating recommendation, drafts and insight pack with ${state.ai.model}...`
      : "Using demo mode to generate recommendation, drafts and insight pack..."
  );

  let pack;
  try {
    pack = state.ai.mode === "live" ? await generateAiPack(request, score) : buildLocalPack(request, score);
  } catch (error) {
    pack = buildLocalPack(request, score);
    state.ai.mode = "demo";
    renderAiStatus();
    updateGenerationNote(`${error.message} Falling back to demo generation.`, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }

  state.currentRequest = {
    ...request,
    score,
    recommendation: pack.recommendation,
    drafts: pack.drafts
  };
  state.activeDraft = "email";

  state.requests.unshift({
    id: request.id,
    title: request.title,
    owner: request.owner,
    businessUnit: request.businessUnit,
    audienceSize: request.audienceSize,
    priority: score.band,
    score: score.total,
    status: "Awaiting operator review",
    stage: score.total >= 80 ? "approval" : "review",
    channels: pack.recommendation.channels,
    risk: score.risk >= 80 ? "Sensitive content requires approval workflow." : "Standard enterprise review path."
  });

  state.repository.unshift({
    title: `${request.title} Draft Pack`,
    type: "Draft pack",
    owner: request.owner,
    audience: pack.recommendation.audience,
    updated: "Just now",
    tags: [request.businessUnit.toLowerCase(), request.objective.toLowerCase(), "new request"],
    description: "Auto-generated draft set created from the intake form and scoring engine."
  });

  state.insights.unshift(...pack.insights.slice(0, 2));

  renderScorecard(score);
  renderRecommendation(pack.recommendation, request, score);
  setActiveDraft("email");
  renderTopbar();
  renderWorkflow();
  renderRepository();
  renderInsights();

  if (state.ai.mode === "live") {
    updateGenerationNote(`Live OpenAI generation completed on ${state.ai.model}.`);
  }
}

function filterRepository(event) {
  const query = event.target.value.trim().toLowerCase();
  if (!query) {
    renderRepository();
    return;
  }

  const filtered = state.repository.filter((item) => {
    const haystack = [
      item.title,
      item.type,
      item.owner,
      item.audience,
      item.description,
      ...(item.tags || [])
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  renderRepository(filtered);
}

function setActiveDraft(type) {
  state.activeDraft = type;
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.draft === type);
  });
  renderDraft();
}

function bindEvents() {
  elements.form.addEventListener("submit", submitRequest);
  elements.repositorySearch.addEventListener("input", filterRepository);
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveDraft(tab.dataset.draft));
  });
  elements.scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function bootstrapDefaultRequest() {
  const seededRequest = {
    id: "CR-2456",
    title: "Benefits enrolment reminder",
    owner: "Priya Shah",
    businessUnit: "People & Culture",
    objective: "Action",
    brief:
      "Employees need a final reminder to complete annual benefits enrolment, with emphasis on deadline, provider support and what happens if no selection is made.",
    audienceSize: 8200,
    deadline: plusDays(3),
    actionDate: plusDays(7),
    sensitivity: 5,
    managerCascade: true
  };
  const score = scoreRequest(seededRequest);
  const recommendation = getRecommendations(seededRequest, score);
  const drafts = buildDrafts(seededRequest, recommendation, score);
  state.currentRequest = { ...seededRequest, score, recommendation, drafts };
  renderScorecard(score);
  renderRecommendation(recommendation, seededRequest, score);
  renderDraft();
}

setDefaultDates();
bootstrapDefaultRequest();
renderAiStatus();
renderTopbar();
renderWorkflow();
renderCalendar();
renderRepository();
renderAnalytics();
renderInsights();
bindEvents();
fetchAiStatus();
