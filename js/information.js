// 좌하단의 Image Information & Comparison 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// Image 정보 및 비교를 해주는 Visualization
class InformationPanel {

    // 생성자, detail이 표시될 detail-view 및 클릭 이벤트 연동을 위한 top25 grid와 scatter plot을 select해서 가져옴
    constructor(detailViewId = "#detail-view", gridSelector = "#grid", scatterSvgSelector = "#scatter-view svg") {
      this.detailViewId = detailViewId;
      this.gridSelector = gridSelector;
      this.scatterSvgSelector = scatterSvgSelector;
    }
    
    // 초기화 함수, 클릭 이벤트를 설정해주는 함수들을 호출
    initialize() {
      this.attachScatterClickEvents();
      this.attachTop25ClickEvents();
      this.observeDynamicUpdates();
    }
    
    // 선택한 이미지의 상세 정보를 보여주는 함수
    showInformationPanel(d) {

      // 기존 내용 지우기
      const container = d3.select(this.detailViewId).html("");
      
      // 제목 및 누르면 내용이 지워지는 Back 버튼을 담은 헤더 공간
      const header = container.append("div").attr("class", "d-flex justify-content-between align-items-center mb-2");
      header.append("h6").html("<strong>Image Detail</strong>");
      header.append("button")
        .attr("class", "btn btn-sm btn-outline-secondary")
        .text("←Back")
        .on("click", () => container.html("<p class='text-muted'></p>"));
      
      // 좌측엔 이미지를 출력하고 우측엔 이미지의 정보(Prompt,Guidance Scale,Model,Clip Score)를 텍스트로 제공
      // 이때, Guidance Scale과 Model의 경우 클릭하면 서로 다른 Guidance Scale과 Model에 대한 이미지들을 비교하여 보여주는 기능을 추가
      // ChatGPT4o : 이미지에 scale+fade-in 애니메이션 추가, 텍스트에도 fade-in 기능을 추가해주는 코드를 작성해줌
      const row = container.append("div").attr("class", "row g-3");

      // 좌측 : 이미지 출력
      const left = row.append("div").attr("class", "col-md-6");
      const img = left.append("img")
        .attr("src", d.Image_Path)
        .attr("alt", d.Prompt)
        .attr("class", "img-fluid rounded border")
        .style("max-height", "200px")
        .style("transform", "scale(0.8)")
        .style("opacity", 0)
        .style("transition", "all 0.2s ease-out");
  
      setTimeout(() => {
        img.style("transform", "scale(1)").style("opacity", 1);
      }, 10);
      
      // 우측 : 이미지에 대한 정보 출력
      const right = row.append("div").attr("class", "col-md-6")
        .style("font-size", "14px")
        .style("line-height", "1.6");
  
      const prompt = right.append("div")
        .html(`<strong>Prompt</strong> : ${d.Prompt}`)
        .style("opacity", 0).style("transform", "translateY(10px)").style("transition", "all 0.2s ease-out");
  
      const badgeGuidance = right.append("div")
        .html(`<span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill" style="cursor:pointer">Guidance Scale : ${d.Guidance_Scale}</span>`)
        .on("click", () => this.showComparisonImagesOnly(d, "Guidance_Scale", ["Prompt", "Model"], true))
        .style("opacity", 0).style("transform", "scale(0.9)").style("transition", "all 0.2s ease-out");
  
      const badgeModel = right.append("div")
        .html(`<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill" style="cursor:pointer">Model : ${d.Model}</span>`)
        .on("click", () => this.showComparisonImagesOnly(d, "Model", ["Prompt", "Guidance_Scale"], true))
        .style("opacity", 0).style("transform", "scale(0.9)").style("transition", "all 0.2s ease-out");
  
      const clip = right.append("div")
        .text(`Clip Score : ${d.Clip_Score.toFixed(4)}`)
        .style("opacity", 0).style("transform", "translateY(10px)").style("transition", "all 0.2s ease-out");
  
      setTimeout(() => {
        prompt.style("opacity", 1).style("transform", "translateY(0)");
        clip.style("opacity", 1).style("transform", "translateY(0)");
        badgeGuidance.style("opacity", 1).style("transform", "scale(1)");
        badgeModel.style("opacity", 1).style("transform", "scale(1)");
      }, 10);
    }

    // 선택한 Attribute (Guidance Scale or Model)만 바꾼 이미지들을 비교해서 보여주는 함수
    // ChatGPT4o : 이미지에 scale+fade-in 애니메이션 추가, 텍스트에도 fade-in 기능을 추가해주는 코드를 작성해줌
    // ChatGPT4o : 원본 이미지를 포함/비포함 시킬 수 있는 코드를 추천해줌 (코드만 만들고 실제 데모에서는 항상 원본 이미지를 포함시켰음)
    showComparisonImagesOnly(base, varyingAttr, fixedAttrs = [], includeOriginal = false) {
      // 기존 내용 지우기
      d3.select("#comparison-view").remove();
  
      // 비교 이미지들이 들어갈 공간, 또한 여기서도 누르면 내용이 지워지는 Back 버튼을 추가
      const section = d3.select(this.detailViewId).append("div").attr("id", "comparison-view");
      section.append("div")
        .attr("class", "d-flex justify-content-end mb-2")
        .append("button")
        .attr("class", "btn btn-sm btn-outline-secondary")
        .text("← Back")
        .on("click", () => d3.select("#comparison-view").remove());
      
      // 상단에는 동일한 Attribute들을 출력
      const header = section.append("div").attr("class", "mb-2").style("font-size", "14px");
      fixedAttrs.forEach(attr => header.append("div").html(`<strong>${attr}</strong> : ${base[attr]}`));
      section.append("h6").text(`Other variations by ${varyingAttr}`);
      
      // 비교 이미지들을 출력해줄 공간
      const grid = section.append("div").attr("class", "d-flex flex-wrap gap-2");

      // ChatGPT4o : 선택한 Attribute만 다르고 나머지 Attribute는 동일한 이미지들을 filtering 해주는 코드를 작성해줌
      const matches = window.sharedData.filter(d =>
        d[varyingAttr] !== base[varyingAttr] &&
        fixedAttrs.every(attr => d[attr] === base[attr])
      );
      
      // 원본 이미지 출력 여부 (데모에선 항상 원본 이미지도 포함해서 출력시켰음)
      if (includeOriginal) matches.unshift(base);
  
      const cardEls = [], textEls = [];
      
    // 위에서 찾은 선택 Attribute만 다른 이미지들을 선택 Attribute 및 Clip Score와 함께 출력
    // ChatGPT4o : 각 이미지를 부드럽게 출력해주는 애니메이션을 적용해주는 코드를 작성해줌
      matches.forEach(item => {
        const card = grid.append("div")
          .attr("class", "card p-1 text-center")
          .style("width", "140px")
          .style("font-size", "12px")
          .style("opacity", 0)
          .style("transform", "scale(0.9)")
          .style("transition", "all 0.3s ease-out");
  
        card.append("img")
          .attr("src", item.Image_Path)
          .attr("alt", item.Prompt)
          .attr("class", "card-img-top rounded")
          .style("height", "140px")
          .style("object-fit", "cover");
  
        const body = card.append("div").attr("class", "card-body p-1");
        const t1 = body.append("div")
          .text(`${varyingAttr}: ${item[varyingAttr]}`)
          .style("opacity", 0).style("transition", "opacity 0.3s ease-out");
  
        const t2 = body.append("div")
          .text(`CLIP: ${item.Clip_Score.toFixed(2)}`)
          .style("opacity", 0).style("transition", "opacity 0.3s ease-out");
  
        cardEls.push(card);
        textEls.push(t1, t2);
      });
  
      setTimeout(() => {
        cardEls.forEach(c => c.style("opacity", 1).style("transform", "scale(1)"));
        textEls.forEach(t => t.style("opacity", 1));
      }, 10);
    }
    
    // ScatterPlot에서 점을 클릭하면 이미지 정보를 출력할 수 있도록 설정해주는 함수
    attachScatterClickEvents() {
      d3.select(this.scatterSvgSelector)
        .selectAll("circle")
        .style("cursor", "pointer")
        .on("click", (event, d) => this.showInformationPanel(d));
    }
    
    // Top25 Image Grid에서 이미지를 클릭하면 이미지 정보를 출력할 수 있도록 설정해주는 함수
    attachTop25ClickEvents() {
      d3.selectAll(`${this.gridSelector} .cell`)
        .style("cursor", "pointer")
        .on("click", (_, d) => this.showInformationPanel(d));
    }
  
    // 새로운 요소가 추가되면 동적으로 클릭 이벤트를 설정해주는 함수들을 다시 호출하여 클릭 이벤트를 재설정해주는 함수
    // ChatGPT4o : Scatter Plot이나 Top25 Image Grid에서 클릭 등으로 새롭게 생성되는 요소에 매번 Click 이벤트를 다시 동적으로 걸어주는 부분을 작성해줌
    observeDynamicUpdates() {
      const observer = new MutationObserver(() => {
        this.attachScatterClickEvents();
        this.attachTop25ClickEvents();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  