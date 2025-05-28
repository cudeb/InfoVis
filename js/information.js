// 좌하단의 Image Information & Comparison 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// 선택한 이미지의 상세 정보를 보여주는 함수
function showInformationPanel(d) {

    // 기존 내용 지우기
    const container = d3.select("#detail-view");
    container.html("");
  
    // 제목 및 누르면 내용이 지워지는 Back 버튼을 담은 헤더 공간
    const header = container.append("div")
      .attr("class", "d-flex justify-content-between align-items-center mb-2");
    header.append("h6").html("<strong>Image Detail</strong>");
    header.append("button")
      .attr("class", "btn btn-sm btn-outline-secondary")
      .text("←Back")
      .on("click", () => {
        container.html("<p class='text-muted'></p>");
      });
    
    // 좌측엔 이미지를 출력하고 우측엔 이미지의 정보(Prompt,Guidance Scale,Model,Clip Score)를 텍스트로 제공
    // 이때, Guidance Scale과 Model의 경우 클릭하면 서로 다른 Guidance Scale과 Model에 대한 이미지들을 비교하여 보여주는 기능을 추가
    const row = container.append("div").attr("class", "row g-3");
    const left = row.append("div").attr("class", "col-md-6");
    left.append("img")
      .attr("src", d.Image_Path)
      .attr("alt", d.Prompt)
      .attr("class", "img-fluid rounded border")
      .style("max-height", "200px");
  
    const right = row.append("div").attr("class", "col-md-6")
      .style("font-size", "14px")
      .style("line-height", "1.6");
  
    right.append("div").html(`<strong>Prompt</strong> : ${d.Prompt}`);
  
    right.append("div")
      .html(`<span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill" style="cursor:pointer">Guidance Scale : ${d.Guidance_Scale}</span>`)
      .on("click", () => showComparisonImagesOnly(d, "Guidance_Scale", ["Prompt", "Model"], true)); // 클릭 시 Prompt와 Model은 같고 Guidance Scale이 서로 다른 이미지들을 비교하여 보여줌
  
    right.append("div")
      .html(`<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill" style="cursor:pointer">Model : ${d.Model}</span>`)
      .on("click", () => showComparisonImagesOnly(d, "Model", ["Prompt", "Guidance_Scale"], true)); // 클릭 시 Prompt와 Guidance Scale은 같고 Model가 서로 다른 이미지들을 비교하여 보여줌
  
    right.append("div").text(`Clip Score : ${d.Clip_Score.toFixed(4)}`);
  }
  
  // 선택한 Attribute (Guidance Scale or Model)만 바꾼 이미지들을 비교해서 보여주는 함수
  // ChatGPT4o : 원본 이미지를 포함/비포함 시킬 수 있는 코드를 추천해줌 (코드만 만들고 실제 데모에서는 항상 원본 이미지를 포함시켰음)
  function showComparisonImagesOnly(baseData, varyingAttr, fixedAttrs = [], includeOriginal = false) {

    // 기존 내용 지우기
    d3.select("#comparison-view").remove();
    
    // 비교 이미지들이 들어갈 공간, 또한 여기서도 누르면 내용이 지워지는 Back 버튼을 추가
    const container = d3.select("#detail-view");
    const section = container.append("div").attr("id", "comparison-view");
    section.append("div")
      .attr("class", "d-flex justify-content-end mb-2")
      .append("button")
      .attr("class", "btn btn-sm btn-outline-secondary")
      .text("← Back")
      .on("click", () => {
        d3.select("#comparison-view").remove();
      });
  
    // 상단에는 동일한 Attribute들을 출력
    const header = section.append("div")
      .attr("class", "mb-2")
      .style("font-size", "14px")
      .style("line-height", "1.6");
    fixedAttrs.forEach(attr => {
      header.append("div")
        .html(`<strong>${attr}</strong> : ${baseData[attr]}`);
    });
    
    section.append("h6").text(`Other variations by ${varyingAttr}`);
    
    // 비교 이미지들을 출력해줄 공간
    const grid = section.append("div")
      .attr("class", "d-flex flex-wrap gap-2");
    
    // ChatGPT4o : 선택한 Attribute만 다르고 나머지 Attribute는 동일한 이미지들을 filtering 해주는 코드를 작성해줌
    const matches = window.sharedData.filter(item =>
      item[varyingAttr] !== baseData[varyingAttr] &&
      fixedAttrs.every(attr => item[attr] === baseData[attr])
    );
    
    // 원본 이미지 출력 여부 (데모에선 항상 원본 이미지도 포함해서 출력시켰음)
    if (includeOriginal) {
      matches.unshift(baseData);
    }
    
    // 위에서 찾은 선택 Attribute만 다른 이미지들을 선택 Attribute 및 Clip Score와 함께 출력
    matches.forEach(item => {
      const card = grid.append("div")
        .attr("class", "card p-1 text-center")
        .style("width", "140px")
        .style("font-size", "12px");
  
      card.append("img")
        .attr("src", item.Image_Path)
        .attr("alt", item.Prompt)
        .attr("class", "card-img-top rounded")
        .style("height", "140px")
        .style("object-fit", "cover");
  
      const body = card.append("div").attr("class", "card-body p-1");
      body.append("div").text(`${varyingAttr}: ${item[varyingAttr]}`);
      body.append("div").text(`CLIP: ${item.Clip_Score.toFixed(2)}`);
    });
  }
  
  // ScatterPlot에서 점을 클릭하면 이미지 정보를 출력할 수 있도록 설정해주는 함수
  function attachScatterClickEvents() {
    d3.select("#scatter-view svg")
      .selectAll("circle")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        showInformationPanel(d);
      });
  }
  
  // Top25 Image Grid에서 이미지를 클릭하면 이미지 정보를 출력할 수 있도록 설정해주는 함수
  function attachTop25ClickEvents() {
    d3.selectAll("#grid .cell")
      .style("cursor", "pointer")
      .on("click", function(_, d) {
        showInformationPanel(d);
      });
  }
  
  // 클릭 이벤트를 설정해주는 함수들을 호출하고 새로운 요소가 추가되면 동적으로 다시 클릭 이벤트를 설정해주는 함수
  // ChatGPT4o : Scatter Plot이나 Top25 Image Grid에서 클릭 등으로 새롭게 생성되는 요소에 매번 Click 이벤트를 다시 동적으로 걸어주는 부분을 작성해줌
  function hookInformationEvents() {
    const observer = new MutationObserver(() => {
      attachScatterClickEvents();
      attachTop25ClickEvents();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // 클릭 이벤트 설정 및 동적 설정 활성화
  hookInformationEvents();
  