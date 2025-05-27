function showInformationPanel(d) {
    const container = d3.select("#detail-view");
    container.html(""); // 기존 전체 초기화
  
    const header = container.append("div")
      .attr("class", "d-flex justify-content-between align-items-center mb-2");
  
    header.append("h6").html("<strong>Image Detail</strong>");
    header.append("button")
      .attr("class", "btn btn-sm btn-outline-secondary")
      .text("←Back")
      .on("click", () => {
        container.html("<p class='text-muted'></p>");
      });
  
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
      .on("click", () => showComparisonImagesOnly(d, "Guidance_Scale", ["Prompt", "Model"], true));
  
    right.append("div")
      .html(`<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill" style="cursor:pointer">Model : ${d.Model}</span>`)
      .on("click", () => showComparisonImagesOnly(d, "Model", ["Prompt", "Guidance_Scale"], true));
  
    right.append("div").text(`Clip Score : ${d.Clip_Score.toFixed(4)}`);
  }
  
  function showComparisonImagesOnly(baseData, varyingAttr, fixedAttrs = [], includeOriginal = false) {
    // 기존 비교 영역 제거
    d3.select("#comparison-view").remove();
  
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
  
    const header = section.append("div")
      .attr("class", "mb-2")
      .style("font-size", "14px")
      .style("line-height", "1.6");
  
    fixedAttrs.forEach(attr => {
      header.append("div")
        .html(`<strong>${attr}</strong> : ${baseData[attr]}`);
    });
  
    section.append("h6").text(`Other variations by ${varyingAttr}`);
  
    const grid = section.append("div")
      .attr("class", "d-flex flex-wrap gap-2");
  
    const matches = window.sharedData.filter(item =>
      item[varyingAttr] !== baseData[varyingAttr] &&
      fixedAttrs.every(attr => item[attr] === baseData[attr])
    );
  
    if (includeOriginal) {
      matches.unshift(baseData);
    }
  
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
  
  // Integration for scatterplot
  function attachScatterClickEvents() {
    d3.select("#scatter-view svg")
      .selectAll("circle")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        showInformationPanel(d);
      });
  }
  
  // Integration for top25
  function attachTop25ClickEvents() {
    d3.selectAll("#grid .cell")
      .style("cursor", "pointer")
      .on("click", function(_, d) {
        showInformationPanel(d);
      });
  }
  
  // Monitor window.sharedData availability and run hooks after rendering
  function hookInformationEvents() {
    const observer = new MutationObserver(() => {
      attachScatterClickEvents();
      attachTop25ClickEvents();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  hookInformationEvents();
  