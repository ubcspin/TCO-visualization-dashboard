class ScatterPlot extends Chart {
	/**
	 * Class constructor with basic chart configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data, options) {
		super(_config, data)
		this.xDimension = _config.xDimension;
		this.yDimension = _config.yDimension;
		this.colourDimension = _config.colourDimension;
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
		vis.yScale = d3.scaleBand();

		vis.xAxis = d3.axisBottom(vis.xScale);
		vis.yAxis = d3.axisLeft(vis.yScale);

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chartArea.append('g')
			.attr('class', 'axis x-axis');

		// Append y-axis group
		vis.yAxisG = vis.chartArea.append('g')
			.attr('class', 'axis y-axis');

		vis.xForce = d3.forceX();
		vis.yForce = d3.forceY();

		// Initialize force simulation
		vis.simulation = d3.forceSimulation()
			.force('x', vis.xForce)
			.force('y', vis.yForce);

		vis.xAxisTitle = vis.chartArea.append("text")
			.style("text-anchor", "middle");

		vis.yAxisTitle = vis.chartArea.append("text")
			.attr("transform", "rotate(-90)")
			.style("text-anchor", "middle");

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		vis.data = JSON.parse(JSON.stringify(vis.ogData));

		vis.config.margin.left = vis.config.containerWidth * vis.config.marginLeft;
		vis.config.margin.right = vis.config.containerWidth * vis.config.marginRight;
		vis.config.margin.top = vis.config.containerHeight * vis.config.marginTop;
		vis.config.margin.bottom = vis.config.containerHeight * vis.config.marginBottom;

		vis.chartArea
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.xAxisG
			.attr('transform', `translate(0,${vis.config.height})`);

		vis.yAxisTitle
			.attr("y", 0 - vis.config.margin.left + vis.config.width * 0.04)
			.attr("x", 0 - (vis.config.height / 2));

		vis.xAxisTitle
			.attr("x", vis.config.width / 2 )
			.attr("y",  vis.config.height + vis.config.margin.bottom - 16)
		
		vis.simulation
			.nodes(vis.data)
			.force('collision', d3.forceCollide().radius(0.01 * vis.config.height));

		// Specificy x- and y-accessor functions
		vis.xValue = d => d[vis.xDimension];
		vis.yValue = d => d[vis.yDimension];
		vis.colourValue = d => d[vis.colourDimension];

		vis.colourData = d3.rollups(vis.data, d => d.length, d => vis.colourValue(d)).sort((a, b) => {
			return vis.options[vis.colourDimension].indexOf(vis.colourValue(a)) - vis.options[vis.colourDimension].indexOf(vis.colourValue(b));
		});;

		let xDomain = vis.data.map(d => vis.xValue(d).trim()).sort((a, b) => {
			return vis.options[vis.xDimension].indexOf(a) - vis.options[vis.xDimension].indexOf(b);
		});

		let yDomain = vis.data.map(d => vis.yValue(d).trim()).sort((a, b) => {
			return vis.options[vis.yDimension].indexOf(b) - vis.options[vis.yDimension].indexOf(a);
		});

		// Set the scale input domains
		vis.xScale
			.domain(xDomain)
			.range([0, vis.config.width]);
		vis.yScale
			.domain(yDomain)
			.range([0, vis.config.height]);

		vis.simulation.force("x").x(d => vis.xScale(vis.xValue(d)) + vis.xScale.bandwidth() / 2);
		vis.simulation.force("y").y(d => vis.yScale(vis.yValue(d)) + vis.yScale.bandwidth() / 2);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		const colourMap = {}
		vis.colourData.forEach((d, i) => {
			colourMap[d[0]] = i;
		});

		vis.nodes = vis.chartArea.selectAll('.point')
			.data(vis.data, d => d["SNo"])
			.join(
				(enter) => {
					return enter.append("circle")
						.attr('cx', vis.config.width / 2)
						.attr('cy', vis.config.height / 2)
						.attr('class', 'point')
				}
			)
			.attr('fill', d => d3.schemeTableau10[colourMap[vis.colourValue(d)]])
			.attr('r', 0.01 * vis.config.height);

		vis.simulation.on("tick", () => {
			vis.nodes
				.attr('cx', d => d.x)
				.attr('cy', d => d.y);
		});

		vis.data.forEach(d => {
			d.x = vis.config.width / 2;
			d.y = vis.config.height / 2;
		});

		vis.simulation.nodes(vis.data);
		vis.simulation.alpha(1).alphaTarget(0.1).restart();

		vis.simulation.force("x").initialize(vis.data);

		// Update the axes because the underlying scales might have changed
		vis.xAxisG.call(vis.xAxis)
		vis.yAxisG.call(vis.yAxis);

		vis.xAxisTitle.text(vis.xDimension);
		vis.yAxisTitle.text(vis.yDimension);
	}
}