// Visualization JS 코드를 기반으로 각 Visualization에 대한 객체를 생성 및 initialize 함수를 웹페이지 로드 이후 호출해주는 JS 코드

document.addEventListener("DOMContentLoaded", () => {
  
    // Scatter Plot
    const scatter = new Scatterplot("#scatter-view");
    scatter.initialize();
  
    // Juxtapose Bar/Line Chart
    const juxtapose = new JuxtaposeChart("#juxtapose-view", "#multi-view");
    juxtapose.initialize();
  
    // Top 25 Grid
    const top25 = new Top25Grid("#grid", {
      style: "#style-filter",
      object: "#object-filter",
      background: "#background-filter",
      model: "#model-filter"
    });
    top25.initialize();
  
    // Image Information
    const infoPanel = new InformationPanel("#detail-view");
    infoPanel.initialize();
  });
  