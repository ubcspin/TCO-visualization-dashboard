class BarChart extends Chart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  // Todo: Add or remove parameters from the constructor as needed
  constructor(_config, data) {
    super()
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.width,
      containerHeight: _config.height,
      margin: {
        top: 5,
        right: 5,
        bottom: 50,
        left: 60
      }
    }
    this.dimension = _config.dimension;
    this.data = data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.xScale = d3.scaleBand()
        .range([0, vis.config.width]);
    vis.yScale = d3.scaleLinear()
        .range([vis.config.height, 0])

    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.config.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chartArea.append('g')
        .attr('class', 'axis y-axis');

    vis.chartArea.append("text")
        .attr("transform", "rotate(-90)")
        .attr("font-size", 16)
        .attr("y", 0 - vis.config.margin.left + 16)
        .attr("x", 0 - (vis.config.height / 2))
        .style("text-anchor", "middle")
        .text("Count"); 

    vis.xAxisTitle = vis.chartArea.append("text")
        .attr("font-size", 16)
        .attr("y", 0 - vis.config.margin.left + 16)
        .attr("x", vis.config.width / 2 )
        .attr("y",  vis.config.height + vis.config.margin.bottom - 16)
        .style("text-anchor", "middle");

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // Specificy x- and y-accessor functions
    vis.xValue = d => d[0];
    vis.yValue = d => d[1];

    vis.rollupData = d3.rollups(vis.data, d => d.length, d => d[vis.dimension]).sort((a, b) => vis.yValue(b) - vis.yValue(a));

    // Set the scale input domains
    vis.xScale.domain(vis.rollupData.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.rollupData, vis.yValue)]);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    const colourMap = {}
    vis.rollupData.sort((a, b) => {
        if (vis.xValue(a) < vis.xValue(b)) {
            return -1;
        }
        if (vis.xValue(a) > vis.xValue(b)) {
            return 1;
        }
        return 0;
    }).forEach((d, i) => {
        colourMap[vis.xValue(d)] = i;
    });

    // Add rectangles
    vis.chartArea.selectAll('.bar')
      .data(vis.rollupData)
      .join('rect')
      .attr('class', 'bar')
      .attr('fill', d => d3.schemeTableau10[colourMap[vis.xValue(d)]])
      .attr('width', vis.xScale.bandwidth() * 0.8)
      .attr('height', d => vis.config.height - vis.yScale(vis.yValue(d)))
      .attr('x', d => vis.xScale(vis.xValue(d)) + vis.xScale.bandwidth() * 0.1)
      .attr('y', d => vis.yScale(vis.yValue(d)));

    // Update the axes because the underlying scales might have changed
    vis.xAxisG.call(vis.xAxis)
        // .selectAll("text")  
        //     .style("text-anchor", "end")
        //     .attr("dx", "-.8em")
        //     .attr("dy", ".15em")
        //     .attr("transform", "rotate(-45)" );

    vis.yAxisG.call(vis.yAxis);

    vis.xAxisTitle.text(vis.dimension);
  }
}