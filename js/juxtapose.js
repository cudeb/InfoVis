// 📊 Juxtapose.js (Bootstrap 기반 개선)
const barContainer = document.getElementById("juxtapose-view");
const containerWidth = barContainer.clientWidth;

const barSvg = d3.select("#juxtapose-view")
  .append("svg")
  .attr("width", containerWidth)
  .attr("height", 400)
  .style("background", "white");

const barMargin = { top: 40, right: 20, bottom: 100, left: 60 };
const barWidth = containerWidth - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

const barChartGroup = barSvg.append("g")
  .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

const barX = d3.scaleBand().padding(0.2).range([0, barWidth]);
const barXLinear = d3.scaleLinear().range([0, barWidth]);
const barY = d3.scaleLinear().range([barHeight, 0]);

const barXAxisGroup = barChartGroup.append("g")
  .attr("transform", `translate(0,${barHeight})`)
  .attr("class", "x-axis");
const barYAxisGroup = barChartGroup.append("g").attr("class", "y-axis");

const barColor = d3.scaleOrdinal(d3.schemeTableau10);
const barTooltip = d3.select("body").append("div")
  .attr("class", "custom-tooltip position-absolute bg-dark text-white px-2 py-1 rounded shadow")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("z-index", "9999")
  .style("display", "none");

function showBarTooltip(event, d, labelPrefix = '') {
  barTooltip.style("display", "block")
    .html(`<strong>${labelPrefix}${d.key}</strong><br>Avg CLIP: ${d.avg.toFixed(4)}`)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 30}px`);
}

function updateSingleBar(attr, data) {
  d3.select("#multi-view").html("");
  barSvg.style("display", "block");
  barChartGroup.selectAll(".line, .dot").remove();

  const grouped = d3.groups(data, d => d[attr])
    .map(([key, values]) => ({ key, avg: d3.mean(values, v => v.Clip_Score) }))
    .sort((a, b) => d3.descending(a.avg, b.avg));

  barX.domain(grouped.map(d => d.key));
  barY.domain([0, d3.max(grouped, d => d.avg)]);
  barColor.domain(grouped.map(d => d.key));

  barXAxisGroup.transition().duration(500).call(d3.axisBottom(barX));
  barYAxisGroup.transition().duration(500).call(d3.axisLeft(barY));

  const bars = barChartGroup.selectAll(".bar").data(grouped, d => d.key);

  bars.enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => barX(d.key))
    .attr("width", barX.bandwidth())
    .attr("y", barHeight)
    .attr("height", 0)
    .attr("fill", d => barColor(d.key))
    .on("mouseover", (event, d) => showBarTooltip(event, d))
    .on("mouseout", () => barTooltip.style("display", "none"))
    .transition().duration(500)
    .attr("y", d => barY(d.avg))
    .attr("height", d => barHeight - barY(d.avg));

  bars.transition().duration(500)
    .attr("x", d => barX(d.key))
    .attr("width", barX.bandwidth())
    .attr("y", d => barY(d.avg))
    .attr("height", d => barHeight - barY(d.avg))
    .attr("fill", d => barColor(d.key));

  bars.exit().transition().duration(300)
    .attr("y", barHeight)
    .attr("height", 0)
    .remove();
}

function updateLineChart(data) {
  d3.select("#multi-view").html("");
  barSvg.style("display", "block");
  barChartGroup.selectAll(".bar").remove();

  const grouped = d3.groups(data, d => d.Guidance_Scale)
    .map(([key, values]) => ({ key: +key, avg: d3.mean(values, v => v.Clip_Score) }))
    .sort((a, b) => a.key - b.key);

  barXLinear.domain(d3.extent(grouped, d => d.key));
  barY.domain([0, d3.max(grouped, d => d.avg)]);

  barXAxisGroup.transition().duration(500).call(d3.axisBottom(barXLinear));
  barYAxisGroup.transition().duration(500).call(d3.axisLeft(barY));

  const line = d3.line()
    .x(d => barXLinear(d.key))
    .y(d => barY(d.avg));

  barChartGroup.append("path")
    .datum(grouped)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  barChartGroup.selectAll(".dot")
    .data(grouped)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => barXLinear(d.key))
    .attr("cy", d => barY(d.avg))
    .attr("r", 4)
    .on("mouseover", (event, d) => showBarTooltip(event, d, 'Scale '))
    .on("mouseout", () => barTooltip.style("display", "none"));
}

function drawSmallJuxtapose(type, data, title) {
  const w = 200, h = 175;
  const svg = d3.create("svg").attr("width", w).attr("height", h);
  const g = svg.append("g").attr("transform", `translate(40,30)`);
  const innerW = w - 60, innerH = h - 70;

  const x = type === 'line' ? d3.scaleLinear().range([0, innerW]) : d3.scaleBand().padding(0.2).range([0, innerW]);
  const y = d3.scaleLinear().range([innerH, 0]);

  const grouped = type === 'line'
    ? d3.groups(data, d => d.Guidance_Scale).map(([k, v]) => ({ key: +k, avg: d3.mean(v, d => d.Clip_Score) })).sort((a, b) => a.key - b.key)
    : d3.groups(data, d => d[title]).map(([k, v]) => ({ key: k, avg: d3.mean(v, d => d.Clip_Score) })).sort((a, b) => d3.descending(a.avg, b.avg));

  if (type === 'line') x.domain(d3.extent(grouped, d => d.key));
  else x.domain(grouped.map(d => d.key));
  y.domain([0, d3.max(grouped, d => d.avg)]);

  g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-30)").style("text-anchor", "end");
  g.append("g").call(d3.axisLeft(y));

  if (type === 'line') {
    g.append("path").datum(grouped).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 1.5).attr("d", d3.line().x(d => x(d.key)).y(d => y(d.avg)));
    g.selectAll("circle").data(grouped).enter().append("circle").attr("cx", d => x(d.key)).attr("cy", d => y(d.avg)).attr("r", 3);
  } else {
    g.selectAll("rect").data(grouped).enter().append("rect")
      .attr("x", d => x(d.key)).attr("y", d => y(d.avg))
      .attr("width", x.bandwidth()).attr("height", d => innerH - y(d.avg))
      .attr("fill", d => barColor(d.key));
  }

  svg.append("text")
    .attr("x", w / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text(title);

  document.getElementById("multi-view").appendChild(svg.node());
}

function setupBarControls(data) {
  const control = d3.select("#juxtapose-view")
    .insert("div", ":first-child")
    .attr("class", "d-flex flex-wrap gap-2 mb-3");

  ["Model", "Style", "Object", "Background"].forEach(attr => {
    control.append("button")
      .text(`Group by ${attr}`)
      .attr("data-attr", attr)
      .attr("class", "btn btn-outline-primary btn-sm")
      .on("click", () => updateSingleBar(attr, data));
  });

  control.append("button")
    .text("Line Chart: Guidance Scale")
    .attr("id", "guidance-line")
    .attr("class", "btn btn-outline-danger btn-sm")
    .on("click", () => updateLineChart(data));

  control.append("button")
    .text("Juxtapose All")
    .attr("id", "juxtapose")
    .attr("class", "btn btn-outline-success btn-sm")
    .on("click", () => {
      barSvg.style("display", "none");
      d3.select("#multi-view").html("");
      drawSmallJuxtapose("bar", data, "Model");
      drawSmallJuxtapose("bar", data, "Style");
      drawSmallJuxtapose("bar", data, "Object");
      drawSmallJuxtapose("bar", data, "Background");
      drawSmallJuxtapose("line", data, "Guidance Scale");
    });
}

if (!window.sharedData) {
  d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
    window.sharedData = data;
    setupBarControls(data);
    updateSingleBar("Model", data);
  });
} else {
  setupBarControls(window.sharedData);
  updateSingleBar("Model", window.sharedData);
}
