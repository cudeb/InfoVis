// 좌상단의 Juxtaposed Bar & Line Chart 작성을 위한 JS 코드
// 1.시각화 요소들의 정렬을 위한 div 등의 요소 추가와 2.Style 및 Bootstrap 관련 코드 추가, 그리고 3.일부 애니메이션 추가는 ChatGPT4o 의 도움을 받았음
// 추가적으로 도움을 받은 부분은 코드 내부에 주석 (ChatGPT4o : 도움받은부분) 으로 표기하였음

// Attribute(x)와 ClipScore(y)의 관계를 보여주는 Bar/Line Chart를 보여주는 Visualization
class JuxtaposeChart {

    // 생성자
    constructor(containerId = "#juxtapose-view", multiViewId = "#multi-view") {
      this.containerId = containerId;
      this.multiViewId = multiViewId;
      this.data = [];
      
      // Bar와 Line Chart를 그릴 juxtapose-view를 불러옴
      this.container = document.querySelector(containerId);
      this.width = this.container.clientWidth;
      
      // Bar와 Line Chart의 크기 및 여백 설정
      this.margin = { top: 40, right: 20, bottom: 100, left: 60 };
      this.chartWidth = this.width - this.margin.left - this.margin.right;
      this.chartHeight = 400 - this.margin.top - this.margin.bottom;
      
      // juxtapose-view 안에 SVG 생성
      this.svg = d3.select(containerId)
        .append("svg")
        .attr("width", this.width)
        .attr("height", 400)
        .style("background", "white");
  
      this.chartGroup = this.svg.append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
      
      // Bar/Line Chart가 실제로 들어갈 공간을 정의하고 X축,Y축 Scale 정의 +  색상 설정
      // ChatGPT4o : 적절한 Scale 설정을 도와줌
      this.xBand = d3.scaleBand().padding(0.2).range([0, this.chartWidth]);
      this.xLinear = d3.scaleLinear().range([0, this.chartWidth]);
      this.y = d3.scaleLinear().range([this.chartHeight, 0]);
  
      this.xAxisGroup = this.chartGroup.append("g")
        .attr("transform", `translate(0,${this.chartHeight})`)
        .attr("class", "x-axis");
      this.yAxisGroup = this.chartGroup.append("g").attr("class", "y-axis");
  
      this.color = d3.scaleOrdinal(d3.schemeTableau10);
      
      // Bar or Line Chart에서 출력될 툴팁 설정
      this.tooltip = d3.select("body").append("div")
        .attr("class", "custom-tooltip position-absolute bg-dark text-white px-2 py-1 rounded shadow")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "9999")
        .style("display", "none");
    }
    
    // 초기화 함수, 데이터를 불러와서 Attribute를 선택할 수 있는 버튼 및 초기 Bar Chart 생성, 초기 Attribute는 Model을 사용
    // ChatGPT4o :다른 Visualization이나 함수에서 데이터를 또다시 불러올 필요없이 데이터를 전역변수에 저장하여 공유할 수 있는 코드를 추천해줌
    initialize() {
      if (!window.sharedData) {
        d3.json("https://raw.githubusercontent.com/cudeb/InfoVis/main/datasets.json").then(data => {
          window.sharedData = data;
          this.data = data;
          this.setupControls();
          this.update("Model");
        });
      } else {
        this.data = window.sharedData;
        this.setupControls();
        this.update("Model");
      }
    }
    
    // Update 함수, 선택한 Attribute에 맞는 Chart를 그려주도록 설정
    update(attr) {
      if (attr === "Guidance_Scale") this.drawLineChart(this.data);
      else this.drawBarChart(attr, this.data);
    }
    
    // Bar Chart를 그려줄 함수
    drawBarChart(attr, data) {

      // 기존 Chart 내용 지우기
      d3.select(this.multiViewId).html("");
      this.svg.style("display", "block");
      this.chartGroup.selectAll(".line, .dot").remove();
      
      // 데이터를 Attribute 기준으로 그룹화 + 평균 Clip Score 계산 + 정렬
      // ChatGPT4o : 그룹핑, 평균 계산, 정렬 부분 코드를 작성해줌
      const grouped = d3.groups(data, d => d[attr])
        .map(([key, values]) => ({ key, avg: d3.mean(values, v => v.Clip_Score) }))
        .sort((a, b) => d3.descending(a.avg, b.avg));
      
      // Scale 설정 및 축 그리기
      this.xBand.domain(grouped.map(d => d.key));
      this.y.domain([0, d3.max(grouped, d => d.avg)]);
      this.color.domain(grouped.map(d => d.key));
  
      this.xAxisGroup.transition().duration(500).call(d3.axisBottom(this.xBand));
      this.yAxisGroup.transition().duration(500).call(d3.axisLeft(this.y));
      
      // Bar Chart에 준비한 데이터 그리기
      const bars = this.chartGroup.selectAll(".bar").data(grouped, d => d.key);
  
      bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => this.xBand(d.key))
        .attr("width", this.xBand.bandwidth())
        .attr("y", this.chartHeight)
        .attr("height", 0)
        .attr("fill", d => this.color(d.key))
        .on("mouseover", (event, d) => this.showTooltip(event, d)) // Mouseover 시 툴팁 출력
        .on("mouseout", () => this.tooltip.style("display", "none")) // Mouseout 시 툴팁 제거
        .transition().duration(500)
        .attr("y", d => this.y(d.avg))
        .attr("height", d => this.chartHeight - this.y(d.avg));
      
      // ChatGPT4o : ChatGPT4o가 넣으면 좋을 것 같다고 추천해준 코드, 데이터가 변경되더라도 부드럽게 변동되게 해주는 코드
      bars.transition().duration(500)
        .attr("x", d => this.xBand(d.key))
        .attr("width", this.xBand.bandwidth())
        .attr("y", d => this.y(d.avg))
        .attr("height", d => this.chartHeight - this.y(d.avg))
        .attr("fill", d => this.color(d.key));
      
      // 기존 Bar 삭제
      bars.exit().transition().duration(300)
        .attr("y", this.chartHeight)
        .attr("height", 0)
        .remove();
    }

    // Line Chart를 그려주는 코드
    drawLineChart(data) {

      // 기존 Chart 내용 지우기
      d3.select(this.multiViewId).html("");
      this.svg.style("display", "block");
      this.chartGroup.selectAll(".bar").remove();

      // 데이터를 Attribute 기준으로 그룹화 + 평균 Clip Score 계산 + 정렬
      // ChatGPT4o : 그룹핑, 평균 계산, 정렬 부분 코드를 작성해줌 
      const grouped = d3.groups(data, d => d.Guidance_Scale)
        .map(([key, values]) => ({ key: +key, avg: d3.mean(values, v => v.Clip_Score) }))
        .sort((a, b) => a.key - b.key);
      
      // Scale 설정 및 축 그리기
      this.xLinear.domain(d3.extent(grouped, d => d.key));
      this.y.domain([0, d3.max(grouped, d => d.avg)]);
  
      this.xAxisGroup.transition().duration(500).call(d3.axisBottom(this.xLinear));
      this.yAxisGroup.transition().duration(500).call(d3.axisLeft(this.y));
      
      // 데이터 point와 point를 잇는 선으로 Line Chart 그리기
      // ChatGPT4o : 선을 부드럽게 그려주는 animation 작성
      const line = d3.line().x(d => this.xLinear(d.key)).y(d => this.y(d.avg));
      
      this.chartGroup.append("path")
        .datum(grouped)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line)
        .attr("stroke-dasharray", function () {
          const length = this.getTotalLength();
          return length + " " + length;
        })
        .attr("stroke-dashoffset", function () {
          return this.getTotalLength();
        })
        .transition()
        .duration(1000)
        .attr("stroke-dashoffset", 0);
  
      this.chartGroup.selectAll(".dot")
        .data(grouped)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => this.xLinear(d.key))
        .attr("cy", d => this.y(d.avg))
        .attr("r", 4)
        .on("mouseover", (event, d) => this.showTooltip(event, d, 'Scale ')) // Mouseover 시 툴팁 출력
        .on("mouseout", () => this.tooltip.style("display", "none")); // Mouseout 시 툴팁 제거
    }

    // Juxtapose Visualization에서 각각의 Bar Chart와 Line Chart를 그려줄 함수
    drawSmallChart(type, data, title) {

      // 각 Chart를 담을 공간 및 크기 설정 
      const w = 200, h = 175;
      const svg = d3.create("svg").attr("width", w).attr("height", h);
      const g = svg.append("g").attr("transform", `translate(40,30)`);
      const innerW = w - 60, innerH = h - 70;

      // Bar/Line Chart에 따라 다르게 축과 Scale을 설정
      // ChatGPT4o : 축과 Scale을 설정하는 전반적인 코드를 작성함
      const x = type === 'line'
        ? d3.scaleLinear().range([0, innerW])
        : d3.scaleBand().padding(0.2).range([0, innerW]);
      const y = d3.scaleLinear().range([innerH, 0]);
      
      const grouped = type === 'line' // ChatGPT4o : 데이터를 그룹화 후 각 그룹별 Clip Score 평균 계산하는 코드를 작성해줌
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
          .attr("fill", d => this.color(d.key));
      }
      
      // 제목 설정
      svg.append("text")
        .attr("x", w / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text(title);
      
      // 그린 Bar/Line Chart를 multi-view에 추가
      document.querySelector(this.multiViewId).appendChild(svg.node());
    }
    
    // 툴팁을 실제로 보여주는 함수
    showTooltip(event, d, prefix = '') {
      this.tooltip.style("display", "block")
        .html(`<strong>${prefix}${d.key}</strong><br>Avg CLIP: ${d.avg.toFixed(4)}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    }
    
    
    // Attribute를 선택할 수 있는 버튼을 생성할 함수
    setupControls() {

      // 버튼이 생성될 공간
      const control = d3.select(this.containerId)
        .insert("div", ":first-child")
        .attr("class", "d-flex flex-wrap gap-2 mb-3");
      
      // Model, Style, Object, Background에 대한 버튼을 클릭 시 Bar Chart 생성
      ["Model", "Style", "Object", "Background"].forEach(attr => {
        control.append("button")
          .text(`Group by ${attr}`)
          .attr("class", "btn btn-outline-primary btn-sm")
          .on("click", () => this.update(attr));
      });
      
      // Guidance Scale에 대한 버튼을 클릭 시 Line Chart 생성
      control.append("button")
        .text("Plot by Guidance Scale")
        .attr("class", "btn btn-outline-danger btn-sm")
        .on("click", () => this.update("Guidance_Scale"));
      
      // Juxtapose 버튼 클릭 시 multi-view에 각 Bar/Line Chart들을 모두 그려넣음
      control.append("button")
        .text("Juxtapose All")
        .attr("class", "btn btn-outline-success btn-sm")
        .on("click", () => {
          this.svg.style("display", "none");
          d3.select(this.multiViewId).html("");
          ["Model", "Style", "Object", "Background"].forEach(attr => this.drawSmallChart("bar", this.data, attr));
          this.drawSmallChart("line", this.data, "Guidance Scale");
        });
    }
  }
  