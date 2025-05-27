// 📈 scatterplot.js (index.html 구조에 맞춰 전체 정리)
let scatterData = [];
let scatterColorScale;
let scatterCurrentAttr = "Model";

const scatterWidth = 350;
const scatterHeight = 350;
const scatterPadding = 40;

const scatterSvg = d3.select("#scatter-view")
  .append("div")
  .attr("class", "d-flex flex-column gap-3")
  .append("div")
  .attr("class", "d-flex align-items-start gap-3")
  .append("svg")
  .attr("width", scatterWidth)
  .attr("height", scatterHeight)
  .style("background", "white");

const scatterTooltip = d3.select("body")
  .append("div")
  .attr("class", "custom-tooltip position-absolute bg-dark text-white px-2 py-1 rounded shadow")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("z-index", "9999")
  .style("display", "none");

const legendDiv = d3.select("#scatter-view .d-flex.align-items-start")
  .append("div")
  .attr("id", "scatter-legend")
  .attr("class", "small mt-1");

function updateScatterColors(attribute) {
  const categories = [...new Set(scatterData.map(d => d[attribute]))].filter(Boolean);
  scatterColorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeTableau10.concat(d3.schemePastel1));

  d3.select("#scatter-view svg").selectAll("circle")
    .transition().duration(300)
    .attr("fill", d => scatterColorScale(d[attribute] ?? "Unknown"));

  legendDiv.html("");
  legendDiv.append("div")
    .attr("class", "fw-bold mb-1")
    .text(`Color by ${attribute}`);

  categories.forEach(cat => {
    const row = legendDiv.append("div")
      .attr("class", "d-flex align-items-center mb-1");

    row.append("div")
      .style("width", "14px")
      .style("height", "14px")
      .style("margin-right", "6px")
      .style("border-radius", "50%")
      .style("background-color", scatterColorScale(cat));

    row.append("span").text(cat);
  });
}

function drawScatter(data) {
  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);

  const xScale = d3.scaleLinear().domain(xExtent).range([scatterPadding, scatterWidth - scatterPadding]);
  const yScale = d3.scaleLinear().domain(yExtent).range([scatterHeight - scatterPadding, scatterPadding]);

  d3.select("#scatter-view svg").selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("fill", d => scatterColorScale(d[scatterCurrentAttr] ?? "Unknown"))
    .on("mouseover", (event, d) => {
      scatterTooltip
        .style("display", "block")
        .html(`
          <div><strong>Model:</strong> ${d.Model}</div>
          <div><strong>Prompt:</strong> ${d.Prompt}</div>
          <div><strong>CLIP:</strong> ${d.Clip_Score.toFixed(4)}</div>
          <div class='mt-1'><img src="${d.Image_Path}" width="100" class="img-thumbnail" /></div>
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => scatterTooltip.style("display", "none"));
}

function setupScatterControls(data) {
  const container = d3.select("#scatter-view .d-flex.flex-column");
  const controlDiv = container.insert("div", ":first-child")
    .attr("class", "d-flex flex-wrap gap-2 mb-2");

  ["Model", "Style", "Object", "Background"].forEach(attr => {
    controlDiv.append("button")
      .text(`Color by ${attr}`)
      .attr("class", "btn btn-outline-primary btn-sm")
      .on("click", () => {
        scatterCurrentAttr = attr;
        updateScatterColors(attr);
      });
  });
}

if (!window.sharedData) {
  d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
    window.sharedData = data;
    scatterData = data;
    updateScatterColors(scatterCurrentAttr);
    drawScatter(data);
    setupScatterControls(data);
  });
} else {
  scatterData = window.sharedData;
  updateScatterColors(scatterCurrentAttr);
  drawScatter(scatterData);
  setupScatterControls(scatterData);
}