// 우상단의 Scatter Plot 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// Scatter Plot에 사용할 데이터들
let scatterData = [];

// 데이터마다 제공해줄 색상
let scatterColorScale;

// 어떤 Attribute를 기준으로 색상을 부여할지 결정 (초기값은 Model)
let scatterCurrentAttr = "Model";

// Scatter Plot의 크기 및 여백
const scatterWidth = 350;
const scatterHeight = 350;
const scatterPadding = 40;

// scatter-view 내부에 SVG 생성
const scatterSvg = d3.select("#scatter-view")
  .append("div")
  .attr("class", "d-flex flex-column gap-3")
  .append("div")
  .attr("class", "d-flex align-items-start gap-3")
  .append("svg")
  .attr("width", scatterWidth)
  .attr("height", scatterHeight)
  .style("background", "white");

// Mouseover시 생성할 툴팁
const scatterTooltip = d3.select("body")
  .append("div")
  .attr("class", "custom-tooltip position-absolute bg-dark text-white px-2 py-1 rounded shadow")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("z-index", "9999")
  .style("display", "none");

// scatter-view 내부에 범례 생성
const legendDiv = d3.select("#scatter-view .d-flex.align-items-start")
  .append("div")
  .attr("id", "scatter-legend")
  .attr("class", "small mt-1");

// Attribute에 따라 색상 및 범례를 재설정 해주는 함수
function updateScatterColors(attribute) {
  // 해당 Attribute의 Level(=category) 추출
  const categories = [...new Set(scatterData.map(d => d[attribute]))].filter(Boolean); //ChatGPT4o : 데이터 전체를 가지고 Attribute마다 Level을 뽑아주는 코드를 작성해줌

  // 두가지 색상 팔레트를 엮어서 levle마다 색상 설정
  scatterColorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeTableau10.concat(d3.schemePastel1)); // ChatGPT4o : 두 가지 색상 팔레트를 섞어주는 코드를 작성해줌

  // Scatter Plot 내부의 데이터들을 선택한 Attribute에 따라 Level 단위로 색상을 설정
  d3.select("#scatter-view svg").selectAll("circle")
    .transition().duration(300)
    .attr("fill", d => scatterColorScale(d[attribute]));

  // 범례 작성
  legendDiv.html("");
  legendDiv.append("div")
    .attr("class", "fw-bold mb-1")
    .text(`Color by ${attribute}`); // 범례 제목

  // 범례의 항목을 Attribute에 맞게 추가
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

// Scatterplot에 데이터를 채워넣는 함수
function drawScatter(data) {

  // X, Y 축의 Scale 작성
  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);

  const xScale = d3.scaleLinear().domain(xExtent).range([scatterPadding, scatterWidth - scatterPadding]); // ChatGPT4o: 적절한 range에 대해서 알려줌
  const yScale = d3.scaleLinear().domain(yExtent).range([scatterHeight - scatterPadding, scatterPadding]); // ChatGPT4o: 적절한 range에 대해서 알려줌

  // 각 데이터 포인트를 추가
  d3.select("#scatter-view svg").selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("fill", d => scatterColorScale(d[scatterCurrentAttr]))
    .on("mouseover", (event, d) => {          // 마우스 오버 시 툴팁 표시
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
    .on("mouseout", () => scatterTooltip.style("display", "none")); // 마우스 아웃 시 툴팁 제거
}

// Attribute를 선택할 수 있는 버튼을 생성해주는 함수
function setupScatterControls(data) {
  // scatter-view에 버튼을 넣기 위한 장소 추가
  const container = d3.select("#scatter-view .d-flex.flex-column");
  const controlDiv = container.insert("div", ":first-child")
    .attr("class", "d-flex flex-wrap gap-2 mb-2");

  // 모델, 스타일, 객체, 배경 Attribute로 색상 기준을 변경할 수 있는 버튼 추가
  ["Model", "Style", "Object", "Background"].forEach(attr => {
    controlDiv.append("button")
      .text(`Color by ${attr}`)
      .attr("class", "btn btn-outline-primary btn-sm")
      .on("click", () => {  // 버튼 클릭 시 색상과 범례 재설정
        scatterCurrentAttr = attr;
        updateScatterColors(attr);
      });
  });
}

// 데이터를 불러오고 위의 함수들로 Visualization 생성
// ChatGPT4o : ChatGPT4o가 추천해준 코드, 다른 Visualization에서 데이터를 또다시 불러올 필요없이 데이터를 전역변수에 저장하여 공유할 수 있는 코드를 제공해줌
if (!window.sharedData) {
  // 아직 데이터가 전역에 없다면 GitHub에서 JSON 불러오기
  d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
    window.sharedData = data; 
    scatterData = data;
    updateScatterColors(scatterCurrentAttr); // 색상 적용
    drawScatter(data); // Scatter Plot 생성
    setupScatterControls(data); // 버튼 생성
  });
} else {
  // 이미 데이터가 전역에 있다면 재활용
  scatterData = window.sharedData;
  updateScatterColors(scatterCurrentAttr);
  drawScatter(scatterData);
  setupScatterControls(scatterData);
}