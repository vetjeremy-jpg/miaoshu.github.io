(() => {
  const journeys = Array.isArray(window.MIAOSHU_JOURNEYS) ? [...window.MIAOSHU_JOURNEYS] : [];
  journeys.sort((a, b) => b.date.localeCompare(a.date));

  const timeline = document.getElementById("journey-timeline");
  const map = document.getElementById("journey-map");
  if (!timeline || !map || !journeys.length) return;

  const filters = document.getElementById("journey-filters");
  const detail = document.getElementById("journey-detail");
  const nodes = document.getElementById("journey-nodes");

  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const bounds = {
    minLat: 21.8, maxLat: 25.5,
    minLng: 119.3, maxLng: 122.1
  };

  function position(location) {
    const x = 8 + ((location.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 84;
    const y = 8 + ((bounds.maxLat - location.lat) / (bounds.maxLat - bounds.minLat)) * 84;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  }

  function showDetail(journey, button) {
    nodes.querySelectorAll(".journey-node").forEach(node => node.classList.remove("is-active"));
    if (button) button.classList.add("is-active");
    detail.innerHTML =
      "<span>" + escapeHtml(journey.date) + " · " + escapeHtml(journey.region) + "</span>" +
      "<strong>" + escapeHtml(journey.title) + "</strong>" +
      "<small>" + escapeHtml(journey.location.name) + " · " + escapeHtml(journey.journeyPoints.join(" → ")) + "</small>" +
      '<a href="' + escapeHtml(journey.articleUrl) + '">閱讀這篇札記 →</a>';
  }

  function render(region = "全部") {
    const list = region === "全部" ? journeys : journeys.filter(j => j.region === region);

    timeline.innerHTML = list.map(j => {
      const parts = j.date.split("-");
      return '<li id="timeline-' + escapeHtml(j.id) + '">' +
        '<time datetime="' + escapeHtml(j.date) + '"><span>' + parts[0] + "</span>" + parts[1] + "." + parts[2] + "</time>" +
        '<div><span class="timeline-type">' + escapeHtml(j.region + "・" + j.category) + "</span>" +
        "<h3>" + escapeHtml(j.title) + "</h3><p>" + escapeHtml(j.summary) + "</p>" +
        '<a href="' + escapeHtml(j.articleUrl) + '">閱讀這篇札記 ↓</a></div></li>';
    }).join("");

    nodes.innerHTML = list.map((j, index) => {
      const p = position(j.location);
      return '<button type="button" class="journey-node" style="left:' + p.x + "%;top:" + p.y +
        '%" data-index="' + journeys.indexOf(j) + '" aria-label="' +
        escapeHtml(j.region + "：" + j.title) + '"><span>' + (index + 1) + "</span></button>";
    }).join("");

    nodes.querySelectorAll(".journey-node").forEach(button => {
      button.addEventListener("click", () => showDetail(journeys[Number(button.dataset.index)], button));
    });

    if (list[0]) showDetail(list[0], nodes.querySelector(".journey-node"));
  }

  const regions = ["全部", ...new Set(journeys.map(j => j.region))];
  filters.innerHTML = regions.map((region, index) =>
    '<button type="button" data-region="' + escapeHtml(region) + '"' +
    (index === 0 ? ' class="is-active"' : "") + ">" + escapeHtml(region) + "</button>"
  ).join("");

  filters.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      filters.querySelectorAll("button").forEach(b => b.classList.toggle("is-active", b === button));
      render(button.dataset.region);
    });
  });

  render();
})();