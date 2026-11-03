(() => {
  const labels = {
    rounds_1_5: "Rounds 1–5",
    rounds_6_10: "Rounds 6–10",
    rounds_11_20: "Rounds 11–20",
    rounds_21_plus: "Rounds 21+",
  };

  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  navToggle?.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  }));

  const formatDelta = (value) => `${value > 0 ? "+" : ""}${value}`;
  const deltaClass = (value) => value > 0 ? "delta-positive" : value < 0 ? "delta-negative" : "";

  fetch("/assets/intelligence-report-data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Report data unavailable");
      return response.json();
    })
    .then((data) => {
      const tabs = document.getElementById("round-tabs");
      const summary = document.getElementById("selected-band-summary");
      const body = document.getElementById("team-band-body");
      let selected = "rounds_11_20";

      const render = () => {
        tabs.innerHTML = data.bandSummary.map((band) => `
          <button class="round-tab ${band.teamsImproved > band.teamsWorse ? "positive" : "negative"}"
                  type="button" data-band="${band.roundBand}" aria-pressed="${band.roundBand === selected}">
            <span>${labels[band.roundBand]}</span>
            <strong>${band.teamsImproved} of 30 improve</strong>
            <small>${band.teamsTied} tied · ${band.teamsWorse} worse</small>
          </button>`).join("");

        const band = data.bandSummary.find((item) => item.roundBand === selected);
        summary.innerHTML = `<span><strong>${labels[selected]}</strong> · model better for ${band.teamsImproved} teams</span><span>${band.teamsTied} tied · team better for ${band.teamsWorse}</span>`;

        const teams = data.teamBands
          .filter((item) => item.roundBand === selected)
          .sort((a, b) => b.establishedDelta - a.establishedDelta || b.strictDelta - a.strictDelta || a.team.localeCompare(b.team));

        body.innerHTML = teams.map((row, index) => {
          const result = row.establishedDelta > 0 ? "Model better" : row.establishedDelta < 0 ? "Team better" : "Tied";
          const resultClass = row.establishedDelta > 0 ? "result-model" : row.establishedDelta < 0 ? "result-team" : "result-tied";
          return `<tr>
            <td>#${index + 1} · ${row.team}</td>
            <td>${row.actualEstablished}</td>
            <td>${row.modelEstablished}</td>
            <td class="${deltaClass(row.establishedDelta)}">${formatDelta(row.establishedDelta)}</td>
            <td class="${deltaClass(row.strictDelta)}">${formatDelta(row.strictDelta)}</td>
            <td><span class="result-pill ${resultClass}">${result}</span></td>
          </tr>`;
        }).join("");

        tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
          selected = button.dataset.band;
          render();
        }));
      };

      render();
    })
    .catch(() => {
      document.getElementById("team-band-body").innerHTML = '<tr><td colspan="6" class="loading-cell">The interactive team benchmark could not be loaded.</td></tr>';
    });
})();
