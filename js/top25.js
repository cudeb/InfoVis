// 우하단의 Top 25 Image Grid 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// Clip Score 기준 상위 25개의 이미지를 정렬하고 출력해줄 함수
function renderTop25(data) {

  //ChatGPT4o :  Clip Score 기준 상위 25개의 이미지만 선택 하는 코드를 제공해줌
  const filtered = data.slice().sort((a, b) => d3.descending(a.Clip_Score, b.Clip_Score)).slice(0, 25);

  // 이미지를 보여줄 Grid 공간
  const grid = d3.select("#grid");
  grid.html("");

  // 각 이미지가 들어가는 공간
  const cell = grid.selectAll("div")
    .data(filtered)
    .enter()
    .append("div")
    .attr("class", "card cell p-1 text-center")
    .style("width", "120px");

  // 이미지를 실제로 공간안에 넣어서 출력
  cell.append("img")
    .attr("src", d => d.Image_Path)
    .attr("alt", d => d.Prompt)
    .attr("class", "card-img-top rounded")
    .style("height", "80px")
    .style("object-fit", "cover")
    .style("border", "1px solid #ccc");

  // 각 이미지 공간 안에 Clip Score도 함께 출력하도록 함
  const body = cell.append("div").attr("class", "card-body p-1");
  body.append("div")
    .attr("class", "small text-muted")
    .text(d => `CLIP: ${d.Clip_Score.toFixed(4)}`);
}

// 출력될 이미지를 선택할 수 있는 필터를 생성하는 함수
// ChatGPT4o : 필터링 관련 부분은 대부분 ChatGPT4o의 도움을 받았음
function setupTop25Filters(data) {

  // Style/Object/Background/Model Attribute의 Level 추출
  const styles = [...new Set(data.map(d => d.Style))];
  const objects = [...new Set(data.map(d => d.Object))];
  const backgrounds = [...new Set(data.map(d => d.Background))];
  const models = [...new Set(data.map(d => d.Model))];

  // 각 필터에 추출한 level을 option으로 넣기
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

  // 필터의 option이 바뀔 때마다 해당되는 이미지를 기준으로 Top25개를 출력
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

// 데이터를 불러오고 위의 함수들로 Visualization 생성
// ChatGPT4o : ChatGPT4o가 추천해준 코드, 다른 Visualization에서 데이터를 또다시 불러올 필요없이 데이터를 전역변수에 저장하여 공유할 수 있는 코드를 제공해줌
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