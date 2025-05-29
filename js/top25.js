// 우하단의 Top 25 Image Grid 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// 필터를 통해 선택된 이미지들 중 Clip Score가 가장 높은 25장의 이미지를 격자 형식으로 보여주는 Visualization
class Top25Grid {

    // 생성자, 이미지들이 출력될 grid와 Attribute들에 대한 필터들을 불러옴
    constructor(gridId = "#grid", filters = {
      style: "#style-filter",
      object: "#object-filter",
      background: "#background-filter",
      model: "#model-filter"
    }) {
      this.gridId = gridId;
      this.filters = filters;
      this.data = [];
    }
  
    // 초기화 함수, 데이터를 불러와서 필터를 초기화하고 초기 Grid에 전체 이미지 중 Clip Score가 가장 높은 25개의 이미지를 출력하도록 설정
    // ChatGPT4o :다른 Visualization이나 함수에서 데이터를 또다시 불러올 필요없이 데이터를 전역변수에 저장하여 공유할 수 있는 코드를 추천해줌
    initialize() {
      if (!window.sharedData) {
        d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
          window.sharedData = data;
          this.data = data;
          this.setupFilters();
          this.renderTop25(data);
        });
      } else {
        this.data = window.sharedData;
        this.setupFilters();
        this.renderTop25(this.data);
      }
    }
    
    // Clip Score 기준 상위 25개의 이미지를 정렬하고 출력해줄 함수
    renderTop25(data) {

      //ChatGPT4o :  Clip Score 기준 상위 25개의 이미지만 선택 하는 코드를 제공해줌
      const topData = data
        .slice()
        .sort((a, b) => d3.descending(a.Clip_Score, b.Clip_Score))
        .slice(0, 25);
      
      // 이미지를 보여줄 Grid 공간을 초기화
      const grid = d3.select(this.gridId);
      grid.html("");
      
      // 각 이미지가 들어가는 공간
      const cell = grid.selectAll("div")
        .data(topData)
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
    setupFilters() {
      // Style/Object/Background/Model Attribute의 Level 추출
      const styles = [...new Set(this.data.map(d => d.Style))];
      const objects = [...new Set(this.data.map(d => d.Object))];
      const backgrounds = [...new Set(this.data.map(d => d.Background))];
      const models = [...new Set(this.data.map(d => d.Model))];
      
      // 각 필터에 추출한 level을 option으로 넣기
      this.createOptions(this.filters.style, styles);
      this.createOptions(this.filters.object, objects);
      this.createOptions(this.filters.background, backgrounds);
      this.createOptions(this.filters.model, models);
      
      // 필터의 option이 바뀔 때마다 해당되는 이미지를 선택
      d3.selectAll("select").on("change", () => {
        const styleVal = d3.select(this.filters.style).property("value");
        const objectVal = d3.select(this.filters.object).property("value");
        const backgroundVal = d3.select(this.filters.background).property("value");
        const modelVal = d3.select(this.filters.model).property("value");
        
        // ChatGPT4o : 필터링마다 해당되는 이미지를 선택해주는 코드를 작성해줌
        const filtered = window.sharedData.filter(d => {
          return (styleVal === "All" || d.Style === styleVal) &&
                 (objectVal === "All" || d.Object === objectVal) &&
                 (backgroundVal === "All" || d.Background === backgroundVal) &&
                 (modelVal === "All" || d.Model === modelVal);
        });
        
        // 선택한 이미지들 중 Clip Score 기준 Top 25개를 출력
        this.renderTop25(filtered);
      });
    }
    
    // 각 필터에 추출한 level을 option으로 넣어주는 함수
    createOptions(selectId, values) {
      const sel = d3.select(selectId);
      sel.selectAll("option")
        .data(["All", ...values])
        .enter()
        .append("option")
        .text(d => d);
    }
  }
  