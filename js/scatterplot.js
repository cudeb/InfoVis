// 우상단의 Scatter Plot 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// 이미지들의 Embedding을 Attribute 별로 Color로 구분하여 보여주는 Visualization
class Scatterplot {
    constructor(containerId = "#scatter-view") {
      
      this.containerId = containerId;
      this.data = []; // Scatter Plot에 사용할 데이터들
      this.colorScale = null; // 데이터마다 제공해줄 색상
      this.currentAttr = "Model"; // 어떤 Attribute를 기준으로 색상을 부여할지 결정 (초기값은 Model)
      
      // scatterplot 관련 Visualization이 들어갈 scatter-view 불러오기
      const container = d3.select(this.containerId)
        .append("div")
        .attr("class", "d-flex flex-column gap-3");
      
      // scatter-view에 버튼이 들어갈 공간 추가
      this.controlDiv = container.append("div")
        .attr("class", "d-flex flex-wrap gap-2 mb-2");
  
      // scatter-view에 실제 scatterplot이 들어갈 공간 추가
      const chartArea = container.append("div")
        .attr("class", "d-flex align-items-start gap-3");
      
      // scatterplot이 들어갈 공간에 svg를 추가하여 구체화
      this.svg = chartArea.append("svg")
        .attr("width", 350)
        .attr("height", 350)
        .style("background", "white");
      
      // scatter-view에 범례가 들어갈 공간 추가
      this.legendDiv = chartArea.append("div")
        .attr("id", "scatter-legend")
        .attr("class", "small mt-1");
  
      // scatterplot에서 데이터 point마다 출력될 툴팁 추가
      this.tooltip = d3.select("body")
        .append("div")
        .attr("class", "custom-tooltip position-absolute bg-dark text-white px-2 py-1 rounded shadow")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("z-index", "9999")
        .style("display", "none");
    }
    
    // 초기화 함수, 데이터를 불러와서 초기 scatterplot 생성, 초기 Attribute는 Model을 사용, 또한 Attribute를 선택할 수 있는 버튼을 생성
    // ChatGPT4o :다른 Visualization이나 함수에서 데이터를 또다시 불러올 필요없이 데이터를 전역변수에 저장하여 공유할 수 있는 코드를 추천해줌
    initialize() {
      if (!window.sharedData) {
        d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
          window.sharedData = data;
          this.data = data;
          this.updateColor(this.currentAttr);
          this.draw();
          this.setupControls();
        });
      } else {
        this.data = window.sharedData;
        this.updateColor(this.currentAttr);
        this.draw();
        this.setupControls();
      }
    }
    
    // Update 함수, 선택한 Attribute에 따라 scatterplot의 색상을 변경함
    update(attribute) {
      this.currentAttr = attribute;
      this.updateColor(attribute);
    }
    
    // Attribute에 따라 색상 및 범례를 재설정 해주는 함수
    updateColor(attribute) {

      // 해당 Attribute의 Level(=category) 추출
      const categories = [...new Set(this.data.map(d => d[attribute]))].filter(Boolean);

      // 두가지 색상 팔레트를 엮어서 level마다 색상 설정
      this.colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeTableau10.concat(d3.schemePastel1)); // ChatGPT4o : 두 가지 색상 팔레트를 섞어주는 코드를 작성해줌
      
      // Scatter Plot 내부의 데이터들을 선택한 Attribute에 따라 Level 단위로 색상을 설정
      this.svg.selectAll("circle")
        .transition().duration(300)
        .attr("fill", d => this.colorScale(d[attribute]));
  
      // 범례 업데이트
      this.legendDiv.html("");
      this.legendDiv.append("div")
        .attr("class", "fw-bold mb-1")
        .text(`Color by ${attribute}`); // 범례 제목
      
      // 범례의 항목을 Attribute에 맞게 추가
      categories.forEach(cat => {
        const row = this.legendDiv.append("div")
          .attr("class", "d-flex align-items-center mb-1");
  
        row.append("div")
          .style("width", "14px")
          .style("height", "14px")
          .style("margin-right", "6px")
          .style("border-radius", "50%")
          .style("background-color", this.colorScale(cat));
  
        row.append("span").text(cat);
      });
    }
    
    // 불러온 데이터로 Scatterplot을 그려주는 함수
    draw() {

      // X, Y 축의 Scale 작성
      const xExtent = d3.extent(this.data, d => d.x);
      const yExtent = d3.extent(this.data, d => d.y);
  
      const xScale = d3.scaleLinear().domain(xExtent).range([40, 310]); // ChatGPT4o: 적절한 range에 대해서 알려줌
      const yScale = d3.scaleLinear().domain(yExtent).range([310, 40]); // ChatGPT4o: 적절한 range에 대해서 알려줌

      // 각 데이터 포인트를 추가
      this.svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("r", 4)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("fill", d => this.colorScale(d[this.currentAttr]))
        .on("mouseover", (event, d) => {      // 마우스 오버 시 툴팁 표시
          this.tooltip
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
        .on("mouseout", () => this.tooltip.style("display", "none")); // 마우스 아웃 시 툴팁 제거
    }

    // Attribute를 선택할 수 있는 버튼을 생성해주는 함수
    setupControls() {

      // 모델, 스타일, 객체, 배경 Attribute로 색상 기준을 변경할 수 있는 버튼 추가
      ["Model", "Style", "Object", "Background"].forEach(attr => {
        this.controlDiv.append("button")
          .text(`Color by ${attr}`)
          .attr("class", "btn btn-outline-primary btn-sm")
          .on("click", () => this.update(attr));  // 버튼 클릭 시 색상과 범례 재설정
      });
    }
  }
  