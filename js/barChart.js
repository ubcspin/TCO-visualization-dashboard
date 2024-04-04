class BarChart extends Chart {

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data, options, dispatch) {
		super(_config, data, dispatch)
		this.dimension = _config.dimension;
		this.options = options;
		this.initVis();
	}

	initVis() {
		let vis = this;

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chartArea = vis.svg.append('g');

		vis.xScale = d3.scaleBand();
		vis.yScale = d3.scaleLinear();

		vis.xAxis = d3.axisBottom(vis.xScale);
		vis.yAxis = d3.axisLeft(vis.yScale);

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chartArea.append('g')
			.attr('class', 'axis x-axis')

		// Append y-axis group
		vis.yAxisG = vis.chartArea.append('g')
			.attr('class', 'axis y-axis');

		vis.xAxisTitle = vis.chartArea.append("text")
			.style("text-anchor", "middle");

		vis.yAxisTitle = vis.chartArea.append("text")
			.style("text-anchor", "middle")
			.text("Count");
	}

	updateVis() {
		let vis = this;

		vis.data = JSON.parse(JSON.stringify(vis.ogData));

		vis.config.margin.gap = vis.config.containerHeight * vis.config.marginGap;
		vis.config.margin.left = vis.config.containerWidth * vis.config.marginLeft;
		vis.config.margin.right = vis.config.containerWidth * vis.config.marginRight;
		vis.config.margin.top = vis.config.containerHeight * vis.config.marginTop;
		vis.config.margin.bottom = vis.config.containerHeight * vis.config.marginBottom;

		vis.chartArea
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.xAxisTitle
			.attr("y", 0 - vis.config.margin.left + 16);

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.gap - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight - vis.config.margin.gap)
			.attr("transform", "translate(0, " + vis.config.margin.gap + ")");

		vis.xAxisG
			.attr('transform', `translate(0,${vis.config.height})`);

		vis.yAxisTitle
			.attr("y", 0 - vis.config.margin.left + vis.config.width * 0.04)
			.attr("x", 0 - (vis.config.height / 2))
			.attr("transform", "rotate(-90)");

		vis.xAxisTitle
			.attr("x", vis.config.width / 2 )
			.attr("y",  vis.config.height + vis.config.margin.bottom - 16)

		// Specificy x- and y-accessor functions
		vis.xValue = d => d[0];
		vis.yValue = d => d[1];

		vis.rollupData = vis.options[vis.dimension].map(o => [o, vis.data.map(d => d[vis.dimension]).filter(d => d === o).length]);

		// Set the scale input domains
		vis.xScale
			.domain(vis.rollupData.map(vis.xValue))
			.range([0, vis.config.width]);
		vis.yScale
			.domain([0, d3.max([d3.max(vis.rollupData, vis.yValue), 1])])
			.range([vis.config.height, 0]);

		vis.yAxis
			.tickValues(vis.yScale.ticks().filter(t => Number.isInteger(t)))
			.tickFormat(d3.format('d'));

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		const colourMap = {}
		vis.rollupData.forEach((d, i) => {
			colourMap[vis.xValue(d)] = i;
		});

		// Add rectangles
		vis.bars = vis.chartArea.selectAll('.bar')
			.data(vis.rollupData)
			.join('rect')
			.attr('class', 'bar')
			.attr('fill', d => d3.schemeTableau10[colourMap[vis.xValue(d)]])
			.attr('width', vis.xScale.bandwidth() * 0.8)
			.attr('height', d => vis.config.height - vis.yScale(vis.yValue(d)))
			.attr('x', d => vis.xScale(vis.xValue(d)) + vis.xScale.bandwidth() * 0.1)
			.attr('y', d => vis.yScale(vis.yValue(d)))
			.attr("stroke-width", d => vis.emphasized.includes(vis.xValue(d)) ? 2 : 0)
			.attr("stroke", "black")
			.on("mouseover", (_, d) => vis.dispatch.call("specifyGroup", null, [{ dimension: vis.dimension, option: d[0] }], "bar-chart"))
			.on("mouseout", _ => vis.dispatch.call("specifyGroup", null, null, "bar-chart"));

		// Update the axes because the underlying scales might have changed
		if (d3.max(vis.xScale.domain().map(d => d.length)) > 6) {
			vis.xAxisG.call(vis.xAxis)
				.selectAll("text")  
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", ".15em")
					.attr("transform", "rotate(-25)");
		} else {
			vis.xAxisG.call(vis.xAxis);
		}

		vis.yAxisG.call(vis.yAxis);

		vis.xAxisTitle.text(vis.dimension);

		d3.selectAll("g.tick text").attr("font-size", globalFontSize + "%");
	}
}