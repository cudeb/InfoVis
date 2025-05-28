// 좌상단의 Juxtaposed Bar & Line Chart 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// juxtapose-view 불러옴
const barContainer = document.getElementById("juxtapose-view");
const containerWidth = barContainer.clientWidth;

// juxtapose-view 안에 SVG 생성
const barSvg = d3.select("#juxtapose-view")
  .append("svg")
  .attr("width", containerWidth)
  .attr("height", 400)
  .style("background", "white");

// Bar/Line Chart의 크기 및 여백 설정
const barMargin = { top: 40, right: 20, bottom: 100, left: 60 };
const barWidth = containerWidth - barMargin.left - barMargin.right;
const barHeight = 400 - barMargin.top - barMargin.bottom;

// Bar/Line Chart가 실제로 들어갈 공간을 정의하고 X축,Y축 Scale 정의 +  색상 설정
// ChatGPT4o : 적절한 Scale 설정을 도와줌
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

// Bar or Line Chart에서 출력될 툴팁 설정
const barTooltip = d3.select("body").append("div")
  .attr("class", "custom-tooltip position-absolute bg-dark text-white px-2 py-1 rounded shadow")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("z-index", "9999")
  .style("display", "none");

// 툴팁을 실제로 보여주는 함수
function showBarTooltip(event, d, labelPrefix = '') {
  barTooltip.style("display", "block")
    .html(`<strong>${labelPrefix}${d.key}</strong><br>Avg CLIP: ${d.avg.toFixed(4)}`)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 30}px`);
}

// Bar Chart를 그려줄 함수
function updateSingleBar(attr, data) {
  
  // 기존 Chart 내용 지우기
  d3.select("#multi-view").html("");
  barSvg.style("display", "block");
  barChartGroup.selectAll(".line, .dot").remove();

  // 데이터를 Attribute 기준으로 그룹화 + 평균 Clip Score 계산 + 정렬
  // ChatGPT4o : 그룹핑, 평균 계산, 정렬 부분 코드를 작성해줌 
  const grouped = d3.groups(data, d => d[attr])
    .map(([key, values]) => ({ key, avg: d3.mean(values, v => v.Clip_Score) }))
    .sort((a, b) => d3.descending(a.avg, b.avg));

  // Scale 설정 및 축 그리기
  barX.domain(grouped.map(d => d.key));
  barY.domain([0, d3.max(grouped, d => d.avg)]);
  barColor.domain(grouped.map(d => d.key));

  barXAxisGroup.transition().duration(500).call(d3.axisBottom(barX));
  barYAxisGroup.transition().duration(500).call(d3.axisLeft(barY));

  // Bar Chart에 준비한 데이터 그리기
  const bars = barChartGroup.selectAll(".bar").data(grouped, d => d.key);

  bars.enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => barX(d.key))
    .attr("width", barX.bandwidth())
    .attr("y", barHeight)
    .attr("height", 0)
    .attr("fill", d => barColor(d.key))
    .on("mouseover", (event, d) => showBarTooltip(event, d)) // Mouseover 시 툴팁 출력
    .on("mouseout", () => barTooltip.style("display", "none")) // Mouseout 시 툴팁 제거
    .transition().duration(500)
    .attr("y", d => barY(d.avg))
    .attr("height", d => barHeight - barY(d.avg));
  
  // ChatGPT4o : ChatGPT4o가 넣으면 좋을 것 같다고 추천해준 코드, 데이터가 변경되더라도 부드럽게 변동되게 해주는 코드
  bars.transition().duration(500)
    .attr("x", d => barX(d.key))
    .attr("width", barX.bandwidth())
    .attr("y", d => barY(d.avg))
    .attr("height", d => barHeight - barY(d.avg))
    .attr("fill", d => barColor(d.key));

  // 기존 Bar 삭제
  bars.exit().transition().duration(300)
    .attr("y", barHeight)
    .attr("height", 0)
    .remove();
}

// Line Chart를 그려주는 코드
function updateLineChart(data) {

  // 기존 Chart 내용 지우기
  d3.select("#multi-view").html("");
  barSvg.style("display", "block");
  barChartGroup.selectAll(".bar").remove();

  // 데이터를 Attribute 기준으로 그룹화 + 평균 Clip Score 계산 + 정렬
  // ChatGPT4o : 그룹핑, 평균 계산, 정렬 부분 코드를 작성해줌 
  const grouped = d3.groups(data, d => d.Guidance_Scale)
    .map(([key, values]) => ({ key: +key, avg: d3.mean(values, v => v.Clip_Score) }))
    .sort((a, b) => a.key - b.key);

  // Scale 설정 및 축 그리기
  barXLinear.domain(d3.extent(grouped, d => d.key));
  barY.domain([0, d3.max(grouped, d => d.avg)]);

  barXAxisGroup.transition().duration(500).call(d3.axisBottom(barXLinear));
  barYAxisGroup.transition().duration(500).call(d3.axisLeft(barY));


  // 데이터 point와 point를 잇는 선으로 Line Chart 그리기
  // ChatGPT4o : 선을 부드럽게 그려주는 animation 작성
  const line = d3.line()
    .x(d => barXLinear(d.key))
    .y(d => barY(d.avg));

  barChartGroup.append("path")
  .datum(grouped)
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2)
  .attr("d", line)
  .attr("stroke-dasharray", function() {
    const length = this.getTotalLength();
    return length + " " + length;
  })
  .attr("stroke-dashoffset", function() {
    return this.getTotalLength();
  })
  .transition()
  .duration(1000)
  .attr("stroke-dashoffset", 0);

  barChartGroup.selectAll(".dot")
    .data(grouped)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => barXLinear(d.key))
    .attr("cy", d => barY(d.avg))
    .attr("r", 4)
    .on("mouseover", (event, d) => showBarTooltip(event, d, 'Scale ')) // Mouseover 시 툴팁 출력
    .on("mouseout", () => barTooltip.style("display", "none")); // Mouseout 시 툴팁 제거
}

// Juxtapose Visualization에서 각각의 Bar Chart와 Line Chart를 그려줄 함수
function drawSmallJuxtapose(type, data, title) {

  // 각 Chart를 담을 공간 및 크기 설정 
  const w = 200, h = 175;
  const svg = d3.create("svg").attr("width", w).attr("height", h);
  const g = svg.append("g").attr("transform", `translate(40,30)`);
  const innerW = w - 60, innerH = h - 70;

  // Bar/Line Chart에 따라 다르게 축과 Scale을 설정
  // ChatGPT4o : 축과 Scale을 설정하는 전반적인 코드를 작성함
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

  // Line/Bar Chart 그리기
  if (type === 'line') {
    g.append("path").datum(grouped).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 1.5).attr("d", d3.line().x(d => x(d.key)).y(d => y(d.avg)));
    g.selectAll("circle").data(grouped).enter().append("circle").attr("cx", d => x(d.key)).attr("cy", d => y(d.avg)).attr("r", 3);
  } else {
    g.selectAll("rect").data(grouped).enter().append("rect")
      .attr("x", d => x(d.key)).attr("y", d => y(d.avg))
      .attr("width", x.bandwidth()).attr("height", d => innerH - y(d.avg))
      .attr("fill", d => barColor(d.key));
  }

  // 제목 설정
  svg.append("text")
    .attr("x", w / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text(title);

  // 그린 Bar/Line Chart를 multi-view에 추가
  document.getElementById("multi-view").appendChild(svg.node());
}

// 버튼을 생성할 함수
function setupBarControls(data) {

  // 버튼이 생성될 공간
  const control = d3.select("#juxtapose-view")
    .insert("div", ":first-child")
    .attr("class", "d-flex flex-wrap gap-2 mb-3");

  // Model, Style, Object, Background에 대한 버튼을 클릭 시 Bar Chart 생성
  ["Model", "Style", "Object", "Background"].forEach(attr => {
    control.append("button")
      .text(`Group by ${attr}`)
      .attr("data-attr", attr)
      .attr("class", "btn btn-outline-primary btn-sm")
      .on("click", () => updateSingleBar(attr, data));
  });

  // Guidance Scale에 대한 버튼을 클릭 시 Line Chart 생성
  control.append("button")
    .text("Plot by Guidance Scale")
    .attr("id", "guidance-line")
    .attr("class", "btn btn-outline-danger btn-sm")
    .on("click", () => updateLineChart(data));

  // Juxtapose 버튼 클릭 시 multi-view에 각 Bar/Line Chart들을 모두 그려넣음
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

// 데이터를 불러오고 위의 함수들로 Visualization 생성
// ChatGPT4o : ChatGPT4o가 추천해준 코드, 다른 Visualization에서 데이터를 또다시 불러올 필요없이 데이터를 전역변수에 저장하여 공유할 수 있는 코드를 제공해줌
if (!window.sharedData) {
  d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
    window.sharedData = data;
    setupBarControls(data); // 버튼 생성
    updateSingleBar("Model", data); // 처음엔 Model에 대한 Bar Chart를 가지고 있음
  });
} else {
  setupBarControls(window.sharedData);
  updateSingleBar("Model", window.sharedData);
}
