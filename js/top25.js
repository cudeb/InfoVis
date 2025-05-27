// 📊 top25.js (Bootstrap 기반 리팩토링 + .cell 클래스 추가)

function renderTop25(data) {
  const filtered = data.slice().sort((a, b) => d3.descending(a.Clip_Score, b.Clip_Score)).slice(0, 25);

  const grid = d3.select("#grid");
  grid.html("");

  const cell = grid.selectAll("div")
    .data(filtered)
    .enter()
    .append("div")
    .attr("class", "card cell p-1 text-center")
    .style("width", "120px");

  cell.append("img")
    .attr("src", d => d.Image_Path)
    .attr("alt", d => d.Prompt)
    .attr("class", "card-img-top rounded")
    .style("height", "80px")
    .style("object-fit", "cover")
    .style("border", "1px solid #ccc");

  const body = cell.append("div").attr("class", "card-body p-1");

  body.append("div")
    .attr("class", "small text-muted")
    .text(d => `CLIP: ${d.Clip_Score.toFixed(4)}`);
}

function setupTop25Filters(data) {
  const styles = [...new Set(data.map(d => d.Style))];
  const objects = [...new Set(data.map(d => d.Object))];
  const backgrounds = [...new Set(data.map(d => d.Background))];
  const models = [...new Set(data.map(d => d.Model))];

  function createOptions(selectId, values) {
    const sel = d3.select(`#${selectId}`);
    sel.selectAll("option")
      .data(["All", ...values])
      .enter()
      .append("option")
      .text(d => d);
  }

  createOptions("style-filter", styles);
  createOptions("object-filter", objects);
  createOptions("background-filter", backgrounds);
  createOptions("model-filter", models);

  d3.selectAll("select").on("change", () => {
    const style = d3.select("#style-filter").property("value");
    const object = d3.select("#object-filter").property("value");
    const background = d3.select("#background-filter").property("value");
    const model = d3.select("#model-filter").property("value");

    const filtered = window.sharedData.filter(d => {
      return (style === "All" || d.Style === style) &&
             (object === "All" || d.Object === object) &&
             (background === "All" || d.Background === background) &&
             (model === "All" || d.Model === model);
    });

    renderTop25(filtered);
  });
}

if (!window.sharedData) {
  d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
    window.sharedData = data;
    setupTop25Filters(data);
    renderTop25(data);
  });
} else {
  setupTop25Filters(window.sharedData);
  renderTop25(window.sharedData);
}